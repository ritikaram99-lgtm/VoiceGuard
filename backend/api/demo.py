"""Convenience endpoints for driving the 4-device demo without a real phone
network: start a scenario call, force Rahul's simulated presence, or trigger
caller verification immediately. Not part of the core product surface.
"""

from fastapi import APIRouter, HTTPException

from api.calls import SCENARIOS, start_call
from models.database_models import SendVerificationRequest, SetPresenceRequest, StartCallRequest
from services import family_service
from websocket.manager import manager

router = APIRouter(prefix="/api/demo", tags=["demo"])


@router.get("/scenarios")
async def list_scenarios():
    return SCENARIOS


@router.post("/start-call")
async def demo_start_call(body: StartCallRequest):
    if body.scenario and body.scenario not in SCENARIOS:
        raise HTTPException(400, f"Unknown scenario. Choose one of {list(SCENARIOS)}")
    return await start_call(body)


@router.post("/set-rahul-status")
async def set_rahul_status(body: SetPresenceRequest):
    if body.status not in ("online", "offline"):
        raise HTTPException(400, "status must be 'online' or 'offline'")
    manager.set_presence_override(body.family_id, body.role, body.status)
    event = "SON_ONLINE" if body.status == "online" and body.role == "son" else "SON_OFFLINE"
    if body.role == "son":
        await manager.broadcast(body.family_id, {"event": event})
    return {"family_id": body.family_id, "role": body.role, "status": body.status}


@router.post("/trigger-verification")
async def trigger_verification(call_id: str):
    from api.calls import send_verification

    return await send_verification(call_id, SendVerificationRequest(reason="manual"))
