from contextlib import asynccontextmanager

from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware

from api import calls, demo, family, identity, incidents, payment, verification
from database.database import db_session, init_db
from websocket.manager import manager

DEMO_FAMILY_ID = "demo-family"
DEMO_LOGIN_ID = "rahul_001"
DEMO_PASSWORD = "voiceguard-demo-2026"  # prototype-only credential, not a real secret


def seed_demo_family() -> None:
    with db_session() as conn:
        existing = conn.execute("SELECT id FROM families WHERE id = ?", (DEMO_FAMILY_ID,)).fetchone()
        if existing:
            return
        import datetime

        now = datetime.datetime.now(datetime.timezone.utc).isoformat()
        conn.execute("INSERT INTO families (id, name, created_at) VALUES (?, ?, ?)", (DEMO_FAMILY_ID, "Demo Family", now))
        conn.execute(
            "INSERT INTO users (id, family_id, name, role, login_id, password, phone, registered_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
            ("demo-mom", DEMO_FAMILY_ID, "Mom", "mom", None, None, "+91 90000 00001", now),
        )
        conn.execute(
            "INSERT INTO users (id, family_id, name, role, login_id, password, phone, registered_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
            ("demo-dad", DEMO_FAMILY_ID, "Dad", "dad", None, None, "+91 90000 00002", now),
        )
        conn.execute(
            "INSERT INTO users (id, family_id, name, role, login_id, password, phone, registered_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
            ("demo-son", DEMO_FAMILY_ID, "Rahul", "son", DEMO_LOGIN_ID, DEMO_PASSWORD, "+91 90000 00003", now),
        )


@asynccontextmanager
async def lifespan(app: FastAPI):
    init_db()
    seed_demo_family()
    yield


app = FastAPI(title="VoiceGuard API", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(calls.router)
app.include_router(verification.router)
app.include_router(family.router)
app.include_router(identity.router)
app.include_router(incidents.router)
app.include_router(payment.router)
app.include_router(demo.router)


@app.get("/")
async def health():
    return {"status": "ok", "service": "voiceguard-backend"}


@app.websocket("/ws/{family_id}")
async def ws_endpoint(websocket: WebSocket, family_id: str, role: str):
    """One connection per (family_id, role): mom | dad | son | scammer.
    Server -> client push only; all client actions go through the REST API.
    """
    await manager.connect(websocket, family_id, role)
    if role == "son":
        await manager.broadcast(family_id, {"event": "SON_ONLINE"}, exclude_role="son")
    try:
        while True:
            # Keep the connection alive; ignore any client pings/messages.
            await websocket.receive_text()
    except WebSocketDisconnect:
        went_offline = manager.disconnect(websocket, family_id, role)
        if role == "son" and went_offline:
            await manager.broadcast(family_id, {"event": "SON_OFFLINE"})
