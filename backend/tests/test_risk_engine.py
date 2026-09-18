from services import risk_service, trust_engine


def test_normal_conversation_is_low_risk():
    signals = risk_service.analyze_transcript("Hi Mom, just checking in, how are you doing today?")
    score, level, recommendation, _ = trust_engine.compute_risk(signals, speaker_match=None, caller_suspicious=False)
    assert signals == []
    assert level == "LOW"
    assert recommendation == "PROCEED"


def test_scam_message_is_high_risk():
    text = "Mom, I had an accident. I need 50000 rupees right now. Please don't tell Dad."
    signals = risk_service.analyze_transcript(text)
    assert set(signals) == {"urgent_request", "money_request", "secrecy"}

    score, level, recommendation, applied = trust_engine.compute_risk(signals, speaker_match=None, caller_suspicious=False)
    assert level == "HIGH"
    assert recommendation == "VERIFY_PERSON"
    assert "identity_uncertainty" in applied  # unverified identity always counts against trust


def test_verified_matching_voice_lowers_risk_vs_unverified():
    text = "Mom, I had an accident. I need 50000 rupees right now. Please don't tell Dad."
    signals = risk_service.analyze_transcript(text)

    unverified_score, *_ = trust_engine.compute_risk(signals, speaker_match=None, caller_suspicious=False)
    matched_score, *_ = trust_engine.compute_risk(signals, speaker_match=True, caller_suspicious=False)
    mismatched_score, *_ = trust_engine.compute_risk(signals, speaker_match=False, caller_suspicious=False)

    assert matched_score < unverified_score < mismatched_score


def test_scores_are_never_exposed_as_probabilities():
    # Guardrail: the product principle is "prototype scoring", never a
    # percentage confidence. This just documents the score is an int 0-100+,
    # not a 0-1 probability, so callers don't accidentally render "NN%".
    score, *_ = trust_engine.compute_risk(["money_request"], None, False)
    assert isinstance(score, int)
