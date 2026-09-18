import json

from fastapi import APIRouter, HTTPException

from database.database import db_session
from models.database_models import LoginRequest, LoginResponse
from services import family_service, verification_service
from websocket.manager import manager

router = APIRouter(prefix="/api/verification", tags=["verification"])


def _call_row(call_id: str):
    with db_session() as conn:
        return conn.execute("SELECT * FROM calls WHERE id = ?", (call_id,)).fetchone()


@router.get("/{token}")
async def get_challenge(token: str):
    try:
        challenge = verification_service.get_challenge(token)
    except verification_service.ChallengeError as e:
        raise HTTPException(410 if e.code in ("EXPIRED", "USED") else 404, e.message)

    claimed_user = family_service.get_user(challenge["claimed_user_id"])
    await manager.broadcast(
        challenge["family_id"],
        {"event": "VERIFICATION_STARTED", "call_id": challenge["call_id"]},
    )

    return {
        "call_id": challenge["call_id"],
        "claimed_identity": claimed_user["name"],
        "caller_number": challenge["caller_number"],
        "expires_at": challenge["expires_at"],
    }


@router.post("/{token}/login", response_model=LoginResponse)
async def login(token: str, body: LoginRequest):
    try:
        challenge = verification_service.get_challenge(token)
    except verification_service.ChallengeError as e:
        raise HTTPException(410 if e.code in ("EXPIRED", "USED") else 404, e.message)

    claimed_user = family_service.get_user(challenge["claimed_user_id"])
    call = _call_row(challenge["call_id"])
    family_id = challenge["family_id"]
    call_id = challenge["call_id"]

    success = verification_service.verify_credentials(token, body.login_id, body.password)

    if success:
        with db_session() as conn:
            conn.execute("UPDATE calls SET verification_status = 'VERIFIED', action_status = 'ALLOWED' WHERE id = ?", (call_id,))
        family_service.record_call_for_caller(challenge["caller_number"], suspicious=False, result="VERIFIED")

        await manager.broadcast(family_id, {"event": "VERIFICATION_SUCCESS", "call_id": call_id})
        await manager.broadcast(family_id, {"event": "ACTION_ALLOWED", "call_id": call_id})
        await manager.broadcast(family_id, {"event": "PAYMENT_UNLOCKED", "call_id": call_id})
        return LoginResponse(status="VERIFIED", message=f"The caller successfully authenticated the registered {claimed_user['name']} identity.")

    with db_session() as conn:
        conn.execute("UPDATE calls SET verification_status = 'FAILED', action_status = 'BLOCKED' WHERE id = ?", (call_id,))
    family_service.record_call_for_caller(challenge["caller_number"], suspicious=True, result="VERIFICATION_FAILED")
    incident_id = family_service.create_incident(
        call_id=call_id,
        family_id=family_id,
        caller_number=challenge["caller_number"],
        claimed_identity=claimed_user["name"],
        transcript=call["transcript"] if call else "",
        risk_level=call["risk_level"] if call else "UNKNOWN",
        risk_signals=json.loads(call["risk_signals"]) if call and call["risk_signals"] else [],
        speaker_result=None if not call or call["speaker_match"] is None else str(bool(call["speaker_match"])),
        verification_result="IDENTITY_VERIFICATION_FAILED",
        action_taken="ACTION_PROTECTED",
    )

    await manager.broadcast(family_id, {"event": "VERIFICATION_FAILED", "call_id": call_id})
    await manager.broadcast(family_id, {"event": "IMPERSONATION_CONFIRMED", "call_id": call_id, "status": "IDENTITY_VERIFICATION_FAILED"})
    await manager.broadcast(family_id, {"event": "ACTION_PROTECTED", "call_id": call_id, "status": "BLOCKED"})
    await manager.broadcast(family_id, {"event": "PAYMENT_LOCKED", "call_id": call_id})

    await manager.send_to_role(
        family_id,
        "dad",
        {
            "event": "FAMILY_ALERT",
            "call_id": call_id,
            "claimed_identity": claimed_user["name"],
            "caller_number": challenge["caller_number"],
            "reason": "Identity verification failed.",
        },
    )
    await manager.broadcast(family_id, {"event": "INCIDENT_CREATED", "incident_id": incident_id})

    return LoginResponse(status="FAILED", message=f"The person claiming to be {claimed_user['name']} could not authenticate the registered identity.")


@router.post("/{token}/complete")
async def complete(token: str):
    """Extension point for an optional device biometric/passkey layer after
    the credential step. For the MVP this just reports current status.
    """
    try:
        challenge = verification_service.get_challenge(token)
    except verification_service.ChallengeError as e:
        raise HTTPException(410 if e.code in ("EXPIRED", "USED") else 404, e.message)
    call = _call_row(challenge["call_id"])
    return {"verification_status": call["verification_status"] if call else "UNKNOWN"}
