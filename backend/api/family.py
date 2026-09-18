from fastapi import APIRouter, HTTPException

from models.database_models import (
    FamilyLoginRequest,
    FamilyLoginResponse,
    FamilySetupRequest,
    UpdateCredentialsRequest,
)
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
            {
                "user_id": m["id"],
                "name": m["name"],
                "role": m["role"],
                "phone": m["phone"],
                "login_id": m["login_id"],
                "online": manager.is_online(family_id, m["role"]),
            }
            for m in members
        ],
    }


@router.get("/{family_id}/presence")
async def get_presence(family_id: str):
    members = family_service.get_family_members(family_id)
    return {m["role"]: manager.is_online(family_id, m["role"]) for m in members}


@router.patch("/members/{user_id}")
async def update_member(user_id: str, body: UpdateCredentialsRequest):
    user = family_service.get_user(user_id)
    if user is None:
        raise HTTPException(404, "User not found")
    updated = family_service.update_member_credentials(user_id, body.login_id, body.password, body.name)
    return {
        "user_id": updated["id"],
        "name": updated["name"],
        "role": updated["role"],
        "login_id": updated["login_id"],
    }


@router.post("/login", response_model=FamilyLoginResponse)
async def family_login(body: FamilyLoginRequest):
    user = family_service.get_user_by_login(body.identifier) or family_service.get_user_by_phone(body.identifier)
    if user is None or user["password"] != body.password:
        return FamilyLoginResponse(status="FAILED", message="Invalid login ID/phone or password.")
    return FamilyLoginResponse(
        status="OK",
        user_id=user["id"],
        family_id=user["family_id"],
        name=user["name"],
        role=user["role"],
        message=f"Welcome back, {user['name']}.",
    )
