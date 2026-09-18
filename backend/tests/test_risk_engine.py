"""Comprehensive tests for VoiceGuard Trust Engine V2:
- Contextual money request detection (no false positives on casual 'send me')
- Amount extraction & normalization (₹, lakh, crore, words)
- Financial severity (high_value_amount for >= ₹50,000)
- Emergency / authority / coercion detection (police, arrest, hospital, accident)
- Security-context secrecy detection (no false positives on 'secret ingredient')
- Deterministic negation handling (do not send, never share OTP, no emergency)
- Recalibrated voice mismatch (+35 points, at least SUSPICIOUS)
- Identity uncertainty (+15 for unverified, 0 for verified)
- Anti-double-counting across duplicate keywords
- All 15 required benchmark cases (A through O)
"""

from services import risk_service, trust_engine


# --- Core Architectural Tests ---

def test_normal_conversation_is_low_risk():
    signals = risk_service.analyze_transcript("Hi Mom, just checking in, how are you doing today?")
    score, level, recommendation, _ = trust_engine.compute_risk(signals, speaker_match=None, caller_suspicious=False)
    assert signals == []
    assert score == 15  # identity_uncertainty only
    assert level == "LOW"
    assert recommendation == "PROCEED"


def test_scam_message_is_high_risk():
    text = "Mom, I had an accident. I need 50000 rupees right now. Please don't tell Dad."
    signals = risk_service.analyze_transcript(text)
    # accident -> emergency_coercion
    # need 50000 rupees -> money_request
    # 50000 -> high_value_amount
    # right now -> urgent_request
    # don't tell Dad -> secrecy
    assert set(signals) == {
        "emergency_coercion",
        "money_request",
        "high_value_amount",
        "urgent_request",
        "secrecy",
    }

    score, level, recommendation, applied = trust_engine.compute_risk(signals, speaker_match=None, caller_suspicious=False)
    # 20 + 20 + 15 + 20 + 15 + 15 = 105
    assert score == 105
    assert level == "HIGH"
    assert recommendation == "VERIFY_PERSON"
    assert "identity_uncertainty" in applied


def test_verified_matching_voice_lowers_risk_vs_unverified():
    text = "Mom, I had an accident. I need 50000 rupees right now. Please don't tell Dad."
    signals = risk_service.analyze_transcript(text)

    unverified_score, *_ = trust_engine.compute_risk(signals, speaker_match=None, caller_suspicious=False)
    matched_score, *_ = trust_engine.compute_risk(signals, speaker_match=True, caller_suspicious=False)
    mismatched_score, *_ = trust_engine.compute_risk(signals, speaker_match=False, caller_suspicious=False)

    # matched_score (90) < unverified_score (105) < mismatched_score (125)
    assert matched_score < unverified_score < mismatched_score
    assert mismatched_score - matched_score == 35  # voice_mismatch is +35


def test_scores_are_never_exposed_as_probabilities():
    score, *_ = trust_engine.compute_risk(["money_request"], None, False)
    assert isinstance(score, int)


def test_avoid_double_counting_within_same_category():
    # Multiple keywords in the same category must only count once
    text = "Send me ₹1 lakh money transfer immediately right now asap"
    signals = risk_service.analyze_transcript(text)
    # urgent_request should appear only ONCE
    assert signals.count("urgent_request") == 1
    # money_request should appear only ONCE
    assert signals.count("money_request") == 1
    # high_value_amount should appear only ONCE
    assert signals.count("high_value_amount") == 1

    score, _, _, applied = trust_engine.compute_risk(signals, speaker_match=True, caller_suspicious=False)
    # 20 (urgent) + 20 (money) + 15 (high_value) = 55
    assert score == 55
    assert len(applied) == 3


# --- Exact 15 Required Cases (A through O) ---

def test_case_a_normal():
    """A. Normal: 'Hi Mom, how are you?' -> LOW"""
    signals = risk_service.analyze_transcript("Hi Mom, how are you?")
    score, level, rec, _ = trust_engine.compute_risk(signals, speaker_match=None, caller_suspicious=False)
    assert signals == []
    assert score == 15  # identity_uncertainty
    assert level == "LOW"
    assert rec == "PROCEED"


def test_case_b_casual_send():
    """B. Casual send: 'Can you send me the photos from yesterday?' -> must NOT trigger money_request"""
    signals = risk_service.analyze_transcript("Can you send me the photos from yesterday?")
    assert "money_request" not in signals
    score, level, _, _ = trust_engine.compute_risk(signals, speaker_match=None, caller_suspicious=False)
    assert level == "LOW"


def test_case_c_secret_ingredient():
    """C. Secret ingredient: 'What is the secret ingredient in your chicken curry?' -> must NOT trigger secrecy"""
    signals = risk_service.analyze_transcript("What is the secret ingredient in your chicken curry?")
    assert "secrecy" not in signals
    score, level, _, _ = trust_engine.compute_risk(signals, speaker_match=None, caller_suspicious=False)
    assert level == "LOW"


def test_case_d_small_money():
    """D. Small money: 'Mom, please send me ₹100.' -> money_request (no high_value_amount)"""
    transcript = "Mom, please send me ₹100."
    signals = risk_service.analyze_transcript(transcript)
    amt_info = risk_service.extract_amount(transcript)

    assert amt_info["amount_detected"] is True
    assert amt_info["amount_value"] == 100.0
    assert amt_info["currency"] == "INR"

    assert "money_request" in signals
    assert "high_value_amount" not in signals

    score, level, _, _ = trust_engine.compute_risk(signals, speaker_match=None, caller_suspicious=False)
    # 20 (money) + 15 (identity_uncertainty) = 35
    assert score == 35
    assert level == "SUSPICIOUS"


def test_case_e_high_value_money():
    """E. High-value money: 'Mom, please send me ₹1 lakh.' -> money_request + high_value_amount"""
    transcript = "Mom, please send me ₹1 lakh."
    signals = risk_service.analyze_transcript(transcript)
    amt_info = risk_service.extract_amount(transcript)

    assert amt_info["amount_detected"] is True
    assert amt_info["amount_value"] == 100_000.0
    assert amt_info["currency"] == "INR"

    assert set(signals) == {"money_request", "high_value_amount"}

    score, level, _, _ = trust_engine.compute_risk(signals, speaker_match=None, caller_suspicious=False)
    # 20 (money) + 15 (high_value) + 15 (identity_uncertainty) = 50
    assert score == 50
    assert level == "SUSPICIOUS"


def test_case_f_high_value_plus_urgency():
    """F. High-value + urgency: 'Mom, urgently send me ₹1 lakh right now.' -> money_request + high_value_amount + urgent_request -> HIGH"""
    transcript = "Mom, urgently send me ₹1 lakh right now."
    signals = risk_service.analyze_transcript(transcript)
    assert set(signals) == {"money_request", "high_value_amount", "urgent_request"}

    score, level, rec, _ = trust_engine.compute_risk(signals, speaker_match=None, caller_suspicious=False)
    # 20 (money) + 15 (high_value) + 20 (urgent) + 15 (identity_uncertainty) = 70
    assert score == 70
    assert level == "HIGH"
    assert rec == "VERIFY_PERSON"


def test_case_g_high_value_plus_urgency_plus_secrecy():
    """G. High-value + urgency + secrecy: 'Mom, urgently send me ₹1 lakh right now, don't tell Dad.' -> HIGH"""
    transcript = "Mom, urgently send me ₹1 lakh right now, don't tell Dad."
    signals = risk_service.analyze_transcript(transcript)
    assert set(signals) == {"money_request", "high_value_amount", "urgent_request", "secrecy"}

    score, level, rec, _ = trust_engine.compute_risk(signals, speaker_match=None, caller_suspicious=False)
    # 20 (money) + 15 (high_value) + 20 (urgent) + 15 (secrecy) + 15 (identity_uncertainty) = 85
    assert score == 85
    assert level == "HIGH"
    assert rec == "VERIFY_PERSON"


def test_case_h_otp():
    """H. OTP: 'Mom, send me your OTP immediately.' -> otp_request + urgent_request -> elevated risk (must NOT trigger money_request)"""
    transcript = "Mom, send me your OTP immediately."
    signals = risk_service.analyze_transcript(transcript)
    assert "money_request" not in signals
    assert set(signals) == {"otp_request", "urgent_request"}

    score, level, _, _ = trust_engine.compute_risk(signals, speaker_match=None, caller_suspicious=False)
    # 25 (otp) + 20 (urgent) + 15 (identity_uncertainty) = 60
    assert score == 60
    assert level == "HIGH"


def test_case_i_negated_money():
    """I. Negated money: 'Do not send me money.' -> must NOT trigger money_request"""
    transcript = "Do not send me money."
    signals = risk_service.analyze_transcript(transcript)
    assert "money_request" not in signals
    score, level, _, _ = trust_engine.compute_risk(signals, speaker_match=None, caller_suspicious=False)
    assert level == "LOW"


def test_case_j_negated_otp():
    """J. Negated OTP: 'Never share your OTP with anyone.' -> must NOT trigger otp_request"""
    transcript = "Never share your OTP with anyone."
    signals = risk_service.analyze_transcript(transcript)
    assert "otp_request" not in signals
    score, level, _, _ = trust_engine.compute_risk(signals, speaker_match=None, caller_suspicious=False)
    assert level == "LOW"


def test_case_k_emergency():
    """K. Emergency: 'Mom, I'm at the police station and I need help.' -> emergency_coercion -> elevated risk, NOT automatic impersonation"""
    transcript = "Mom, I'm at the police station and I need help."
    signals = risk_service.analyze_transcript(transcript)
    assert "emergency_coercion" in signals

    score, level, rec, applied = trust_engine.compute_risk(signals, speaker_match=None, caller_suspicious=False)
    # 20 (emergency) + 15 (identity_uncertainty) = 35
    assert score == 35
    assert level == "SUSPICIOUS"
    assert rec == "MONITOR"  # Elevated risk signal, not immediate action lock
    assert "voice_mismatch" not in applied


def test_case_l_voice_mismatch():
    """L. Voice mismatch: Normal conversation + speaker_match=False -> at least SUSPICIOUS, never automatically IMPERSONATION"""
    signals = risk_service.analyze_transcript("Hi Mom, how are you?")
    assert signals == []
    score, level, rec, applied = trust_engine.compute_risk(signals, speaker_match=False, caller_suspicious=False)
    # voice_mismatch is +35 -> score 35 -> SUSPICIOUS
    assert score == 35
    assert level == "SUSPICIOUS"
    assert "voice_mismatch" in applied


def test_case_m_verified_voice():
    """M. Verified voice: Suspicious language + speaker_match=True -> conversation risk applies, identity not uncertain"""
    transcript = "Mom, urgently send me ₹1 lakh right now."
    signals = risk_service.analyze_transcript(transcript)
    assert set(signals) == {"money_request", "high_value_amount", "urgent_request"}

    score, level, _, applied = trust_engine.compute_risk(signals, speaker_match=True, caller_suspicious=False)
    # 20 (money) + 15 (high_value) + 20 (urgent) + 0 (identity) = 55
    assert score == 55
    assert level == "SUSPICIOUS"
    assert "identity_uncertainty" not in applied
    assert "voice_mismatch" not in applied


def test_case_n_existing_demo():
    """N. Existing demo: 'Mom, I urgently need you to send me Dad's OTP.' -> must remain HIGH"""
    transcript = "Mom, I urgently need you to send me Dad's OTP."
    signals = risk_service.analyze_transcript(transcript)
    assert "money_request" not in signals
    assert set(signals) == {"urgent_request", "otp_request"}

    score, level, rec, _ = trust_engine.compute_risk(signals, speaker_match=None, caller_suspicious=False)
    # 20 (urgent) + 25 (otp) + 15 (identity_uncertainty) = 60
    assert score == 60
    assert level == "HIGH"
    assert rec == "VERIFY_PERSON"


def test_case_o_recipe_false_positive():
    """O. False-positive test: 'Can you send me the recipe?' -> must NOT trigger money_request"""
    transcript = "Can you send me the recipe?"
    signals = risk_service.analyze_transcript(transcript)
    assert "money_request" not in signals
    score, level, _, _ = trust_engine.compute_risk(signals, speaker_match=None, caller_suspicious=False)
    assert level == "LOW"


# --- Amount Extraction Parsing Variations ---

def test_amount_extraction_formats():
    cases = [
        ("₹100", 100.0, "INR"),
        ("₹5,000", 5000.0, "INR"),
        ("₹50,000", 50000.0, "INR"),
        ("₹1 lakh", 100000.0, "INR"),
        ("1 lakh rupees", 100000.0, "INR"),
        ("one lakh rupees", 100000.0, "INR"),
        ("5 lakh rupees", 500000.0, "INR"),
        ("10 lakh", 1000000.0, "INR"),
        ("1 crore", 10000000.0, "INR"),
        ("one crore rupees", 10000000.0, "INR"),
        ("50000 rupees", 50000.0, "INR"),
        ("send me one lakh rupees", 100000.0, "INR"),
    ]
    for text, expected_val, expected_curr in cases:
        res = risk_service.extract_amount(text)
        assert res["amount_detected"] is True, f"Failed detection for {text}"
        assert res["amount_value"] == expected_val, f"Failed value for {text}: got {res['amount_value']}, expected {expected_val}"
        assert res["currency"] == expected_curr, f"Failed currency for {text}"


def test_negation_emergency():
    signals = risk_service.analyze_transcript("Don't worry, there is no emergency.")
    assert "emergency_coercion" not in signals
    assert "urgent_request" not in signals
