"""Combines conversation signals + speaker verification + caller history into
a prototype risk score. These are scoring rules, not probability estimates —
never surface them to the UI as a percentage/confidence.

Trust Engine V2:
- voice_mismatch = 35 (elevates acoustic mismatch to at least SUSPICIOUS)
- otp_request = 25 (calibrated with urgency so critical OTP extraction reaches HIGH)
- emergency_coercion = 20 (legal/authority/medical coercion signal)
- high_value_amount = 15 (severity amplifier for requests ≥ ₹50,000)
- identity_uncertainty = 15 (unverified identity default)
- suspicious_history = 10 (repeat caller flag)
"""

from typing import Optional

WEIGHTS: dict[str, int] = {
    "urgent_request": 20,
    "money_request": 20,
    "high_value_amount": 15,
    "secrecy": 15,
    "otp_request": 25,
    "credential_request": 15,
    "emergency_coercion": 20,
    "identity_uncertainty": 15,
    "voice_mismatch": 35,
    "suspicious_history": 10,
}

LOW_MAX = 30
HIGH_MIN = 60


def compute_risk(
    signals: list[str],
    speaker_match: Optional[bool],
    caller_suspicious: bool,
) -> tuple[int, str, str, list[str]]:
    # Deduplicate signals while preserving order to avoid any double-counting
    unique_signals = list(dict.fromkeys(signals))
    applied = list(unique_signals)
    score = sum(WEIGHTS.get(s, 0) for s in unique_signals)

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
        level = "SUSPICIOUS"
        recommendation = "MONITOR"
    else:
        level = "LOW"
        recommendation = "PROCEED"

    return score, level, recommendation, applied


WHY_LABELS: dict[str, str] = {
    "urgent_request": "Urgent request / artificial time pressure",
    "money_request": "Contextual financial / money transfer request",
    "high_value_amount": "High-value financial amount requested (≥ ₹50,000)",
    "secrecy": "Isolation / secrecy request (coercion indicator)",
    "otp_request": "OTP / verification code request",
    "credential_request": "Credential / password request",
    "emergency_coercion": "Emergency / legal authority coercion language",
    "identity_uncertainty": "Identity uncertain - not yet independently verified",
    "voice_mismatch": "Synthetic / mismatched voice indicators",
    "suspicious_history": "Previous suspicious activity from this caller",
}
