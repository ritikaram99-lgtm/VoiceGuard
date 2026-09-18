"""Rule-based conversation risk analysis.

Deliberately NOT an ML model — see the P0 priority in the product spec:
prototype scoring rules, not probability estimates. An LLM-based analyzer
can replace `analyze_transcript` later without changing its signature.
"""

KEYWORDS: dict[str, list[str]] = {
    "urgent_request": ["urgent", "immediately", "right now", "emergency", "asap", "quickly"],
    "money_request": ["rupees", "rs.", "money", "transfer", "send me", "need money", "account number", "upi", "₹"],
    "secrecy": ["don't tell", "dont tell", "do not tell", "keep this between", "secret", "don't mention", "dont mention"],
    "otp_request": ["otp", "one time password", "verification code"],
    "credential_request": ["password", "pin number", "cvv", "login id"],
}


def analyze_transcript(transcript: str) -> list[str]:
    text = transcript.lower()
    signals = []
    for signal, phrases in KEYWORDS.items():
        if any(phrase in text for phrase in phrases):
            signals.append(signal)
    return signals
