from fastapi import APIRouter, File, Form, HTTPException, UploadFile

from services import family_service, speaker_service

router = APIRouter(prefix="/api/identity", tags=["identity"])


@router.post("/register-voice")
async def register_voice(user_id: str = Form(...), audio: UploadFile = File(...)):
    user = family_service.get_user(user_id)
    if user is None:
        raise HTTPException(404, "User not found")

    audio_bytes = await audio.read()
    embedding = await speaker_service.async_embed(audio_bytes)
    family_service.set_voice_embedding(user_id, embedding)
    return {"user_id": user_id, "status": "VOICE_REGISTERED", "embedding_dim": len(embedding)}

