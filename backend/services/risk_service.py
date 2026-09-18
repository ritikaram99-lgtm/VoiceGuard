"""Rule-based conversation risk analysis — Trust Engine V2.

Upgraded security-risk engine with contextual financial parsing, amount extraction,
financial severity scoring, emergency/authority coercion detection, enhanced
secrecy matching, and negation filtering.

Deliberately NOT an external LLM — strictly deterministic, explainable security rules.
"""

import re
from typing import Any

HIGH_VALUE_THRESHOLD = 50_000.0

NUMBER_WORDS: dict[str, float] = {
    "zero": 0, "one": 1, "two": 2, "three": 3, "four": 4, "five": 5,
    "six": 6, "seven": 7, "eight": 8, "nine": 9, "ten": 10,
    "eleven": 11, "twelve": 12, "thirteen": 13, "fourteen": 14, "fifteen": 15,
    "sixteen": 16, "seventeen": 17, "eighteen": 18, "nineteen": 19,
    "twenty": 20, "thirty": 30, "forty": 40, "fifty": 50,
    "sixty": 60, "seventy": 70, "eighty": 80, "ninety": 90,
    "hundred": 100,
}

MULTIPLIERS: dict[str, float] = {
    "k": 1_000,
    "thousand": 1_000,
    "thousands": 1_000,
    "lakh": 100_000,
    "lakhs": 100_000,
    "lac": 100_000,
    "lacs": 100_000,
    "crore": 10_000_000,
    "crores": 10_000_000,
    "cr": 10_000_000,
}


def parse_num_str(s: str) -> float | None:
    """Parse numeric string with commas or basic number words into float."""
    clean = s.strip().lower().replace(",", "")
    try:
        return float(clean)
    except ValueError:
        pass

    words = clean.split()
    total = 0.0
    current = 0.0
    for w in words:
        if w in NUMBER_WORDS:
            val = NUMBER_WORDS[w]
            if val == 100:
                current = (current if current != 0 else 1) * 100
            else:
                current += val
        elif w in MULTIPLIERS:
            mult = MULTIPLIERS[w]
            total += (current if current != 0 else 1) * mult
            current = 0.0
        else:
            return None
    total += current
    return total if total > 0 else None


NUM_OR_WORDS = (
    r"(?:[\d,]+(?:\.\d+)?|\b(?:zero|one|two|three|four|five|six|seven|eight|nine|ten|"
    r"eleven|twelve|thirteen|fourteen|fifteen|sixteen|seventeen|eighteen|nineteen|twenty|"
    r"thirty|forty|fifty|sixty|seventy|eighty|ninety|hundred)\b(?:\s+\b(?:zero|one|two|three|"
    r"four|five|six|seven|eight|nine|ten|eleven|twelve|thirteen|fourteen|fifteen|sixteen|"
    r"seventeen|eighteen|nineteen|twenty|thirty|forty|fifty|sixty|seventy|eighty|ninety|hundred)\b)*)"
)


def extract_amount(transcript: str) -> dict[str, Any]:
    """Extract and normalize monetary amount from transcript (e.g. ₹100, ₹1 lakh, 50000 rupees)."""
    text = transcript.lower()

    # Pattern 1: Currency prefix (₹, rs., rs, inr) followed by digits/words and optional unit
    p1 = re.findall(
        rf"(?:₹|rs\.?|inr)\s*({NUM_OR_WORDS})\s*(lakh[s]?|lac[s]?|crore[s]?|cr|thousand[s]?|k)?(?:\s*(?:rupees|rs\.?))?",
        text,
    )
    # Pattern 2: Digits or number words followed by unit (lakh, crore, thousand)
    p2 = re.findall(
        rf"({NUM_OR_WORDS})\s*(lakh[s]?|lac[s]?|crore[s]?|cr|thousand[s]?)\s*(?:rupees|rs\.?)?",
        text,
    )
    # Pattern 3: Digits or number words followed by currency suffix (rupees, rs)
    p3 = re.findall(rf"({NUM_OR_WORDS})\s*(?:rupees|rs\.?)\b", text)

    candidates = []
    for base, mult in p1:
        val = parse_num_str(base)
        if val is not None:
            if mult and mult.strip() in MULTIPLIERS:
                val = val * MULTIPLIERS[mult.strip()]
            candidates.append(val)

    for base, mult in p2:
        val = parse_num_str(base)
        if val is not None and mult and mult.strip() in MULTIPLIERS:
            candidates.append(val * MULTIPLIERS[mult.strip()])

    for base in p3:
        val = parse_num_str(base)
        if val is not None and val > 0:
            candidates.append(val)

    if candidates:
        return {
            "amount_detected": True,
            "amount_value": max(candidates),
            "currency": "INR",
        }
    return {
        "amount_detected": False,
        "amount_value": None,
        "currency": None,
    }


def is_negated(text: str, start_idx: int) -> bool:
    """Check if the matched trigger is directly preceded by a negation within the same clause."""
    clause_start = max(
        text.rfind(".", 0, start_idx),
        text.rfind("!", 0, start_idx),
        text.rfind("?", 0, start_idx),
        text.rfind(";", 0, start_idx),
        text.rfind(",", 0, start_idx),
        text.rfind(" but ", 0, start_idx),
    )
    prefix = text[max(0, clause_start):start_idx]
    negation_pattern = r"\b(not|no|never|don['’]?t|dont|do not|cannot|cant|can['’]?t|shouldn['’]?t|shouldnt|won['’]?t|wont)\b"
    return bool(re.search(negation_pattern, prefix))


MONEY_PATTERNS = [
    r"\bsend\s+(?:me\s+)?(?:the\s+)?(?:money|cash|funds|rupees|rs\.?|₹)",
    r"\bneed\s+(?:the\s+)?(?:money|cash|funds|rupees|rs\.?|₹)",
    r"\btransfer\s+(?:the\s+)?(?:money|cash|funds|rupees|rs\.?|₹)",
    r"\bwire\s+(?:the\s+)?(?:money|cash|funds)",
    r"\bbank\s+transfer\b",
    r"\baccount\s+number\b",
    r"\bupi(?:\s+id)?\b",
    r"\b(?:send|transfer|wire|need|give)\s+(?:me\s+)?(?:[₹]|rs\.?|inr|\d+|one|two|three|four|five|six|seven|eight|nine|ten|twenty|thirty|forty|fifty)",
]

URGENT_PATTERNS = [
    r"\burgent(ly)?\b",
    r"\bimmediately\b",
    r"\bright\s+now\b",
    r"\basap\b",
    r"\bquickly\b",
    r"\bhurry\b",
]

SECRECY_PATTERNS = [
    r"\b(?:don['’]?t|dont|do not)\s+tell\s+(?:dad|mom|father|mother|anyone|anybody|the\s+family|family)\b",
    r"\bkeep\s+this\s+between\s+(?:us|you\s+and\s+me)\b",
    r"\bkeep\s+(?:this|it)\s+secret\b",
    r"\b(?:don['’]?t|dont|do not)\s+mention\s+(?:this|to\s+anyone)\b",
    r"\bkeep\s+(?:it|this)\s+quiet\b",
]

OTP_PATTERNS = [
    r"\botp\b",
    r"\bone\s+time\s+password\b",
    r"\bverification\s+code\b",
]

CREDENTIAL_PATTERNS = [
    r"\bpassword\b",
    r"\bpin\s+number\b",
    r"\bcvv\b",
    r"\blogin\s+id\b",
]

EMERGENCY_PATTERNS = [
    r"\bpolice(?:\s+station)?\b",
    r"\barrest(ed)?\b",
    r"\bcops?\b",
    r"\bcustoms\b",
    r"\bcourt\b",
    r"\blawyer\b",
    r"\bbail\b",
    r"\bjail\b",
    r"\bhospital\b",
    r"\baccident\b",
    r"\bdoctor\b",
    r"\bkidnapp(ed|ing)\b",
    r"\bemergency\b",
]


def analyze_transcript(transcript: str) -> list[str]:
    """Analyze conversation transcript and return unique detected risk signals."""
    text = transcript.lower()
    signals: list[str] = []

    # 1. Urgent request
    for pat in URGENT_PATTERNS:
        m = re.search(pat, text)
        if m and not is_negated(text, m.start()):
            signals.append("urgent_request")
            break

    # 2. Emergency / coercion
    for pat in EMERGENCY_PATTERNS:
        m = re.search(pat, text)
        if m and not is_negated(text, m.start()):
            signals.append("emergency_coercion")
            break

    # 3. OTP request
    for pat in OTP_PATTERNS:
        m = re.search(pat, text)
        if m and not is_negated(text, m.start()):
            signals.append("otp_request")
            break

    # 4. Credential request
    for pat in CREDENTIAL_PATTERNS:
        m = re.search(pat, text)
        if m and not is_negated(text, m.start()):
            signals.append("credential_request")
            break

    # 5. Secrecy (security-context phrases; "don't tell" is the trigger, not negated)
    for pat in SECRECY_PATTERNS:
        m = re.search(pat, text)
        if m:
            signals.append("secrecy")
            break

    # 6. Money request & Amount extraction
    amount_info = extract_amount(transcript)
    money_matched = False
    for pat in MONEY_PATTERNS:
        m = re.search(pat, text)
        if m and not is_negated(text, m.start()):
            money_matched = True
            break

    # If amount detected and financial verb exists in non-negated context:
    if not money_matched and amount_info["amount_detected"]:
        m = re.search(r"\b(send|transfer|wire|need|give)\b", text)
        if m and not is_negated(text, m.start()):
            money_matched = True

    if money_matched:
        signals.append("money_request")
        if amount_info["amount_detected"] and (amount_info["amount_value"] or 0) >= HIGH_VALUE_THRESHOLD:
            signals.append("high_value_amount")

    return signals
