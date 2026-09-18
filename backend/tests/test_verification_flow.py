import time

from api import calls as calls_module


def _start_scam_call(client, family):
    resp = client.post(
        "/api/calls/start",
        json={
            "family_id": family["family_id"],
            "claimed_identity_user_id": family["son"]["user_id"],
            "caller_number": "+919999900001",
            "scenario": "scam",
        },
    )
    assert resp.status_code == 200
    call_id = resp.json()["call_id"]
    analyze = client.post(
        f"/api/calls/{call_id}/analyze",
        data={"transcript": "Mom, I had an accident. I need 50000 rupees right now. Please don't tell Dad."},
    )
    assert analyze.json()["risk_level"] == "HIGH"
    return call_id


def test_son_offline_offers_caller_verification_link(client, family):
    call_id = _start_scam_call(client, family)

    resp = client.post(f"/api/calls/{call_id}/verify-person")
    assert resp.json()["status"] == "unavailable"

    resp = client.post(f"/api/calls/{call_id}/send-verification", json={"reason": "offline"})
    assert resp.status_code == 200
    body = resp.json()
    assert body["token"]
    assert body["link"].endswith(body["token"])


def test_son_denies_triggers_impersonation_and_family_shield(client, family):
    call_id = _start_scam_call(client, family)
    family_id = family["family_id"]

    with client.websocket_connect(f"/ws/{family_id}?role=son") as son_ws, \
         client.websocket_connect(f"/ws/{family_id}?role=dad") as dad_ws:
        resp = client.post(f"/api/calls/{call_id}/verify-person")
        assert resp.json()["status"] == "contacting"
        assert son_ws.receive_json()["event"] == "VERIFY_REQUESTED"

        resp = client.post(f"/api/calls/{call_id}/respond", json={"confirmed": False})
        assert resp.json()["verification_status"] == "IMPERSONATION"

        dad_events = [dad_ws.receive_json()["event"] for _ in range(6)]
        assert "FAMILY_ALERT" in dad_events
        assert "PAYMENT_LOCKED" in dad_events
        assert "INCIDENT_CREATED" in dad_events

    call_state = client.get(f"/api/calls/{call_id}").json()
    assert call_state["action_status"] == "BLOCKED"


def test_son_confirms_verifies_identity(client, family):
    call_id = _start_scam_call(client, family)
    family_id = family["family_id"]

    with client.websocket_connect(f"/ws/{family_id}?role=son") as son_ws:
        client.post(f"/api/calls/{call_id}/verify-person")
        son_ws.receive_json()
        resp = client.post(f"/api/calls/{call_id}/respond", json={"confirmed": True})
        assert resp.json()["verification_status"] == "VERIFIED"


def test_timeout_is_unverified_not_scam(client, family, monkeypatch):
    monkeypatch.setattr(calls_module, "VERIFY_TIMEOUT_SECONDS", 1)
    call_id = _start_scam_call(client, family)
    family_id = family["family_id"]

    with client.websocket_connect(f"/ws/{family_id}?role=son") as son_ws, \
         client.websocket_connect(f"/ws/{family_id}?role=mom") as mom_ws:
        client.post(f"/api/calls/{call_id}/verify-person")
        son_ws.receive_json()  # VERIFY_REQUESTED
        mom_ws.receive_json()  # CONTACTING_SON

        time.sleep(1.5)
        event = mom_ws.receive_json()
        assert event["event"] == "SON_TIMEOUT"

    call_state = client.get(f"/api/calls/{call_id}").json()
    assert call_state["verification_status"] == "UNVERIFIED"


def test_caller_credential_verification_success_and_failure(client, family):
    call_id = _start_scam_call(client, family)
    login_id = family["son"]["login_id"]

    # Wrong credentials -> FAILED, payment blocked, incident created, one-time token consumed.
    send = client.post(f"/api/calls/{call_id}/send-verification", json={"reason": "manual"}).json()
    login = client.post(f"/api/verification/{send['token']}/login", json={"login_id": login_id, "password": "wrong"})
    assert login.json()["status"] == "FAILED"

    reused = client.post(f"/api/verification/{send['token']}/login", json={"login_id": login_id, "password": "correct-horse"})
    assert reused.status_code == 410  # token already used, not reusable

    call_state = client.get(f"/api/calls/{call_id}").json()
    assert call_state["action_status"] == "BLOCKED"

    incidents = client.get("/api/incidents", params={"family_id": family["family_id"]}).json()
    incident = next(i for i in incidents if i["call_id"] == call_id)
    # The incident must carry the call's actual risk signals, not an empty
    # placeholder — this is what the family/Dad's incident view relies on.
    assert set(incident["risk_signals"]) >= {"urgent_request", "money_request", "secrecy"}
    assert incident["risk_level"] == "HIGH"

    # A fresh token with correct credentials succeeds and unlocks payment.
    send2 = client.post(f"/api/calls/{call_id}/send-verification", json={"reason": "manual"}).json()
    login2 = client.post(f"/api/verification/{send2['token']}/login", json={"login_id": login_id, "password": "correct-horse"})
    assert login2.json()["status"] == "VERIFIED"

    call_state2 = client.get(f"/api/calls/{call_id}").json()
    assert call_state2["action_status"] == "ALLOWED"


def test_expired_or_unknown_token_is_rejected(client, family):
    resp = client.get("/api/verification/NOTAREALTOKEN")
    assert resp.status_code == 404
