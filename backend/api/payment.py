from fastapi import APIRouter, HTTPException

from database.database import db_session
from models.database_models import PaymentCheckRequest, PaymentCheckResponse
from websocket.manager import manager

router = APIRouter(prefix="/api/payment", tags=["payment"])


@router.post("/check", response_model=PaymentCheckResponse)
async def check_payment(body: PaymentCheckRequest):
    with db_session() as conn:
        call = conn.execute("SELECT * FROM calls WHERE id = ?", (body.call_id,)).fetchone()
    if call is None:
        raise HTTPException(404, "Call not found")

    action_status = call["action_status"]
    if call["risk_level"] == "HIGH" and call["verification_status"] not in ("VERIFIED",):
        action_status = "PROTECTED" if call["verification_status"] != "FAILED" and call["verification_status"] != "IMPERSONATION" else "BLOCKED"

    messages = {
        "ALLOWED": "Payment can proceed.",
        "PROTECTED": "This payment is protected. Verify the person before proceeding.",
        "BLOCKED": "Payment locked. Identity verification failed for this caller.",
    }

    if action_status in ("PROTECTED", "BLOCKED"):
        await manager.broadcast(call["family_id"], {"event": "PAYMENT_LOCKED", "call_id": body.call_id, "status": action_status})

    return PaymentCheckResponse(action_status=action_status, message=messages[action_status])
