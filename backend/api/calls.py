import asyncio
import json
import os

from fastapi import APIRouter, File, Form, HTTPException, Request, UploadFile


from database.database import db_session
from models.database_models import (
    AnalyzeResponse,
    RespondRequest,
    SendVerificationRequest,
    SendVerificationResponse,
    StartCallRequest,
    VerifyPersonResponse,
)
from services import family_service, risk_service, speaker_service, trust_engine, verification_service, whisper_service
from websocket.manager import manager

router = APIRouter(prefix="/api/calls", tags=["calls"])

VERIFY_TIMEOUT_SECONDS = 30

# call_id -> asyncio.Task, cancelled once the son responds
_pending_timeouts: dict[str, asyncio.Task] = {}

SCENARIOS = {
    "normal": "Hi Mom, just checking in, how are you doing today?",
    "scam": "Mom, I had an accident. I need 50000 rupees right now. Please don't tell Dad.",
}


def _row_to_call(row) -> dict:
    d = dict(row)
    d["risk_signals"] = json.loads(d["risk_signals"] or "[]")
    d["speaker_match"] = bool(d["speaker_match"]) if d["speaker_match"] is not None else None
    return d


def get_call_or_404(call_id: str) -> dict:
    with db_session() as conn:
        row = conn.execute("SELECT * FROM calls WHERE id = ?", (call_id,)).fetchone()
    if row is None:
        raise HTTPException(404, "Call not found")
    return _row_to_call(row)


@router.post("/start")
async def start_call(body: StartCallRequest):
    claimed_user = family_service.get_user(body.claimed_identity_user_id)
    if claimed_user is None:
        raise HTTPException(404, "Claimed identity user not found")

    call_id = family_service.new_id()
    transcript = SCENARIOS.get(body.scenario or "", "")
    with db_session() as conn:
        conn.execute(
            """INSERT INTO calls (id, family_id, claimed_identity_user_id, caller_number, status, transcript, created_at)
               VALUES (?, ?, ?, ?, 'RINGING', ?, ?)""",
            (call_id, body.family_id, body.claimed_identity_user_id, body.caller_number, transcript, family_service.now_iso()),
        )

    await manager.broadcast(
        body.family_id,
        {
            "event": "CALL_STARTED",
            "call_id": call_id,
            "claimed_identity": claimed_user["name"],
            "caller_number": body.caller_number,
        },
    )
    return {"call_id": call_id}


@router.post("/{call_id}/accept")
async def accept_call(call_id: str):
    call = get_call_or_404(call_id)
    with db_session() as conn:
        conn.execute("UPDATE calls SET status = 'ACTIVE' WHERE id = ?", (call_id,))
    await manager.broadcast(call["family_id"], {"event": "CALL_ACCEPTED", "call_id": call_id})
    return {"status": "ACTIVE"}


@router.post("/{call_id}/analyze", response_model=AnalyzeResponse)
async def analyze_call(
    call_id: str,
    request: Request,
    transcript: str | None = Form(None),
    audio: UploadFile | None = File(None),
):
    call = get_call_or_404(call_id)
    claimed_user = family_service.get_user(call["claimed_identity_user_id"])

    content_type = request.headers.get("content-type", "")
    if "application/json" in content_type:
        try:
            body = await request.json()
            if isinstance(body, dict) and "transcript" in body:
                transcript = body["transcript"]
        except Exception:
            pass

    audio_bytes = await audio.read() if audio is not None else None

    if transcript:
        final_transcript = transcript
    elif audio_bytes:
        final_transcript = await whisper_service.async_transcribe(audio_bytes)
    else:
        final_transcript = call["transcript"] or ""

    speaker_match: bool | None = None
    speaker_similarity: float | None = None
    if audio_bytes and claimed_user and claimed_user["voice_embedding"]:
        registered_embedding = json.loads(claimed_user["voice_embedding"])
        speaker_match, speaker_similarity = await speaker_service.async_compare(registered_embedding, audio_bytes)


    signals = risk_service.analyze_transcript(final_transcript)

    history = family_service.get_caller_history(call["caller_number"])
    caller_suspicious = bool(history and history["suspicious_calls"] > 0)

    score, level, recommendation, applied_signals = trust_engine.compute_risk(signals, speaker_match, caller_suspicious)
    why = [trust_engine.WHY_LABELS.get(s, s) for s in applied_signals]

    with db_session() as conn:
        conn.execute(
            """UPDATE calls SET transcript = ?, risk_score = ?, risk_level = ?, risk_signals = ?,
               speaker_match = ?, speaker_similarity = ? WHERE id = ?""",
            (
                final_transcript, score, level, json.dumps(applied_signals),
                None if speaker_match is None else int(speaker_match), speaker_similarity, call_id,
            ),
        )

    await manager.broadcast(call["family_id"], {"event": "TRANSCRIPT_UPDATED", "call_id": call_id, "transcript": final_transcript})
    await manager.broadcast(
        call["family_id"],
        {
            "event": "RISK_UPDATED",
            "call_id": call_id,
            "risk_score": score,
            "risk_level": level,
            "signals": applied_signals,
            "why": why,
            "recommendation": recommendation,
        },
    )

    return AnalyzeResponse(
        call_id=call_id,
        transcript=final_transcript,
        risk_score=score,
        risk_level=level,
        signals=applied_signals,
        why=why,
        recommendation=recommendation,
        speaker_match=speaker_match,
        speaker_similarity=speaker_similarity,
    )


@router.post("/{call_id}/verify-person", response_model=VerifyPersonResponse)
async def verify_person(call_id: str):
    call = get_call_or_404(call_id)
    claimed_user = family_service.get_user(call["claimed_identity_user_id"])
    family_id = call["family_id"]

    if not manager.is_online(family_id, "son"):
        return VerifyPersonResponse(
            call_id=call_id,
            status="unavailable",
            message=f"{claimed_user['name']}'s registered device could not be reached.",
        )

    with db_session() as conn:
        conn.execute("UPDATE calls SET verification_status = 'PENDING' WHERE id = ?", (call_id,))

    sent = await manager.send_to_role(
        family_id,
        "son",
        {
            "event": "VERIFY_REQUESTED",
            "call_id": call_id,
            "claimed_identity": claimed_user["name"],
            "caller_number": call["caller_number"],
        },
    )
    if not sent:
        return VerifyPersonResponse(call_id=call_id, status="unavailable", message=f"{claimed_user['name']}'s registered device could not be reached.")

    await manager.broadcast(family_id, {"event": "CONTACTING_SON", "call_id": call_id}, exclude_role="son")

    existing = _pending_timeouts.pop(call_id, None)
    if existing:
        existing.cancel()
    _pending_timeouts[call_id] = asyncio.create_task(_timeout_watch(call_id, family_id))

    return VerifyPersonResponse(call_id=call_id, status="contacting", message=f"Contacting {claimed_user['name']}...")


async def _timeout_watch(call_id: str, family_id: str) -> None:
    await asyncio.sleep(VERIFY_TIMEOUT_SECONDS)
    _pending_timeouts.pop(call_id, None)
    with db_session() as conn:
        row = conn.execute("SELECT verification_status FROM calls WHERE id = ?", (call_id,)).fetchone()
        if row is None or row["verification_status"] != "PENDING":
            return
        conn.execute("UPDATE calls SET verification_status = 'UNVERIFIED' WHERE id = ?", (call_id,))
    await manager.broadcast(
        family_id,
        {
            "event": "SON_TIMEOUT",
            "call_id": call_id,
            "message": "Identity could not be independently verified. This does not mean the call is fraudulent.",
        },
    )


@router.post("/{call_id}/respond")
async def respond(call_id: str, body: RespondRequest):
    """The registered family member's YES/NO answer to VERIFY_REQUESTED."""
    call = get_call_or_404(call_id)
    family_id = call["family_id"]

    task = _pending_timeouts.pop(call_id, None)
    if task:
        task.cancel()

    if body.confirmed:
        with db_session() as conn:
            conn.execute("UPDATE calls SET verification_status = 'VERIFIED' WHERE id = ?", (call_id,))
        await manager.broadcast(family_id, {"event": "SON_CONFIRMED", "call_id": call_id})
        return {"verification_status": "VERIFIED"}

    claimed_user = family_service.get_user(call["claimed_identity_user_id"])
    with db_session() as conn:
        conn.execute("UPDATE calls SET verification_status = 'IMPERSONATION', action_status = 'BLOCKED' WHERE id = ?", (call_id,))
    family_service.record_call_for_caller(call["caller_number"], suspicious=True, result="IMPERSONATION_CONFIRMED")
    incident_id = family_service.create_incident(
        call_id=call_id,
        family_id=family_id,
        caller_number=call["caller_number"],
        claimed_identity=claimed_user["name"],
        transcript=call["transcript"],
        risk_level=call["risk_level"],
        risk_signals=call["risk_signals"],
        speaker_result=None if call["speaker_match"] is None else str(call["speaker_match"]),
        verification_result="IMPERSONATION_CONFIRMED",
        action_taken="ACTION_PROTECTED",
    )

    await manager.broadcast(family_id, {"event": "SON_DENIED", "call_id": call_id})
    await manager.broadcast(family_id, {"event": "IMPERSONATION_CONFIRMED", "call_id": call_id, "status": "SON_DENIED"})
    await manager.broadcast(family_id, {"event": "ACTION_PROTECTED", "call_id": call_id, "status": "BLOCKED"})
    await manager.broadcast(family_id, {"event": "PAYMENT_LOCKED", "call_id": call_id})
    await manager.send_to_role(
        family_id,
        "dad",
        {
            "event": "FAMILY_ALERT",
            "call_id": call_id,
            "claimed_identity": claimed_user["name"],
            "caller_number": call["caller_number"],
            "reason": "The real family member confirmed they are NOT making this call.",
        },
    )
    await manager.broadcast(family_id, {"event": "INCIDENT_CREATED", "incident_id": incident_id})

    return {"verification_status": "IMPERSONATION"}


@router.post("/{call_id}/send-verification", response_model=SendVerificationResponse)
async def send_verification(call_id: str, body: SendVerificationRequest):
    call = get_call_or_404(call_id)
    token, expires_at = verification_service.create_challenge(
        call_id=call_id,
        family_id=call["family_id"],
        claimed_user_id=call["claimed_identity_user_id"],
        caller_number=call["caller_number"],
        reason=body.reason,
    )
    frontend_origin = os.getenv("VOICEGUARD_FRONTEND_URL", "http://localhost:5174")
    link = f"{frontend_origin}/caller?token={token}"


    with db_session() as conn:
        conn.execute("UPDATE calls SET verification_status = 'PENDING' WHERE id = ?", (call_id,))

    await manager.broadcast(call["family_id"], {"event": "VERIFICATION_LINK_CREATED", "call_id": call_id, "link": link, "expires_at": expires_at})
    await manager.send_to_role(call["family_id"], "scammer", {"event": "SEND_CALLER_VERIFICATION", "call_id": call_id, "link": link, "token": token})

    return SendVerificationResponse(token=token, link=link, expires_at=expires_at)


@router.get("/{call_id}")
async def get_call(call_id: str):
    return get_call_or_404(call_id)
