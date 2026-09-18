from fastapi import APIRouter, HTTPException

from models.database_models import FamilySetupRequest
from services import family_service
from websocket.manager import manager

router = APIRouter(prefix="/api/family", tags=["family"])


@router.post("/setup")
async def setup_family(body: FamilySetupRequest):
    family_id = family_service.create_family(body.family_name)
    members = []
    for m in body.members:
        user_id = family_service.create_member(family_id, m.name, m.role, m.login_id, m.password, m.phone)
        members.append({"user_id": user_id, "name": m.name, "role": m.role, "login_id": m.login_id})
    return {"family_id": family_id, "members": members}


@router.get("/{family_id}")
async def get_family(family_id: str):
    members = family_service.get_family_members(family_id)
    if not members:
        raise HTTPException(404, "Family not found")
    return {
        "family_id": family_id,
        "members": [
            {"user_id": m["id"], "name": m["name"], "role": m["role"], "online": manager.is_online(family_id, m["role"])}
            for m in members
        ],
    }


@router.get("/{family_id}/presence")
async def get_presence(family_id: str):
    members = family_service.get_family_members(family_id)
    return {m["role"]: manager.is_online(family_id, m["role"]) for m in members}
