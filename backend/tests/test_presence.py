"""Regression test for the ConnectionManager reconnect race: a stale
connection (e.g. a refreshed browser tab) disconnecting after a newer one
has already taken over must not evict the live connection or broadcast a
false OFFLINE event.
"""


def test_stale_disconnect_does_not_evict_newer_connection_or_broadcast_offline(client, family):
    family_id = family["family_id"]

    with client.websocket_connect(f"/ws/{family_id}?role=mom") as mom_ws:
        old_son_ws = client.websocket_connect(f"/ws/{family_id}?role=son").__enter__()
        new_son_ws = client.websocket_connect(f"/ws/{family_id}?role=son").__enter__()
        try:
            mom_ws.receive_json()  # SON_ONLINE from old_son_ws connecting
            mom_ws.receive_json()  # SON_ONLINE from new_son_ws connecting

            old_son_ws.close()  # the stale tab disconnects; new_son_ws is still open

            resp = client.post(
                "/api/calls/start",
                json={
                    "family_id": family_id,
                    "claimed_identity_user_id": family["son"]["user_id"],
                    "caller_number": "+919999900004",
                    "scenario": "scam",
                },
            )
            call_id = resp.json()["call_id"]

            verify = client.post(f"/api/calls/{call_id}/verify-person")
            # Before the fix, the stale disconnect wiped the manager's entry
            # for "son" even though new_son_ws was still live, so this would
            # incorrectly read "unavailable".
            assert verify.json()["status"] == "contacting"
            new_son_ws.receive_json()  # VERIFY_REQUESTED reaches the still-live connection
        finally:
            new_son_ws.close()
