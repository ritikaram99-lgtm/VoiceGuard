# VoiceGuard Backend

FastAPI backend: call/risk pipeline, WebSocket family state, the Verify Person
flow (30s timeout, offline detection), and the caller-verification-link
fallback (one-time credential challenge).

## Run

```bash
cd backend
python -m venv .venv
.venv/Scripts/activate   # .venv/bin/activate on macOS/Linux
pip install -r requirements.txt
uvicorn main:app --reload --port 8123
```

The server seeds a `demo-family` (Mom / Dad / Rahul) on startup. Rahul's
demo login is `rahul_001` / `voiceguard-demo-2026` — see `main.py`.

## Test

```bash
pip install -r requirements-dev.txt
pytest
```

## Architecture notes

- **Whisper / ECAPA-TDNN** (`services/whisper_service.py`,
  `services/speaker_service.py`) run in mock mode by default so the full
  flow works without heavy ML downloads. Set `VOICEGUARD_USE_REAL_WHISPER=1`
  / `VOICEGUARD_USE_REAL_ECAPA=1` and install the optional deps listed in
  `requirements.txt` to swap in the real models — the function signatures
  don't change.
- **Risk scoring** (`services/risk_service.py`, `services/trust_engine.py`)
  is rule-based by design, not an ML confidence score. Never surface it to
  the UI as a percentage.
- **WebSocket** (`/ws/{family_id}?role=mom|dad|son|scammer`) is server->client
  push only. All client actions go through the REST API in `api/`.
- **Verification states** are three-way: `VERIFIED`, `FAILED`/`IMPERSONATION`,
  and `UNVERIFIED` (timeout or unreachable). `UNVERIFIED` is never treated as
  a confirmed scam.
