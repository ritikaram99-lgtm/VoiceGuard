"""Combines conversation signals + speaker verification + caller history into
a prototype risk score. These are scoring rules, not probability estimates —
never surface them to the UI as a percentage/confidence.
"""

from typing import Optional

WEIGHTS = {
    "urgent_request": 20,
    "money_request": 20,
    "secrecy": 15,
    "otp_request": 15,
    "credential_request": 15,
    "identity_uncertainty": 15,
    "voice_mismatch": 25,
    "suspicious_history": 10,
}

LOW_MAX = 30
HIGH_MIN = 60


def compute_risk(
    signals: list[str],
    speaker_match: Optional[bool],
    caller_suspicious: bool,
) -> tuple[int, str, str, list[str]]:
    applied = list(signals)
    score = sum(WEIGHTS.get(s, 0) for s in signals)

    if speaker_match is False:
        score += WEIGHTS["voice_mismatch"]
        applied.append("voice_mismatch")
    elif speaker_match is None:
        # No independent speaker verification has happened yet — identity is
        # unconfirmed by default, not "safe by default".
        score += WEIGHTS["identity_uncertainty"]
        applied.append("identity_uncertainty")

    if caller_suspicious:
        score += WEIGHTS["suspicious_history"]
        applied.append("suspicious_history")

    if score >= HIGH_MIN:
        level = "HIGH"
        recommendation = "VERIFY_PERSON"
    elif score > LOW_MAX:
        level = "MEDIUM"
        recommendation = "MONITOR"
    else:
        level = "LOW"
        recommendation = "PROCEED"

    return score, level, recommendation, applied


WHY_LABELS = {
    "urgent_request": "Urgent money request",
    "money_request": "Money request",
    "secrecy": "Secrecy detected",
    "otp_request": "OTP / verification code request",
    "credential_request": "Credential request",
    "identity_uncertainty": "Identity uncertain - not yet independently verified",
    "voice_mismatch": "Synthetic / mismatched voice indicators",
    "suspicious_history": "Previous suspicious activity from this caller",
}
