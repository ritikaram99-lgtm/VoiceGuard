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

## Frontend integration notes

Two things that don't match the "just send JSON" pattern used everywhere else
in the API, worth knowing before wiring the UI up:

- **`POST /api/calls/{id}/analyze` takes `multipart/form-data`, not JSON** —
  it accepts an optional audio file alongside the transcript. For a
  text-only call (the normal demo path, no real audio), send a `FormData`
  body rather than `JSON.stringify`:
  ```js
  const fd = new FormData();
  fd.append("transcript", "Mom, I had an accident...");
  await fetch(`${API}/api/calls/${callId}/analyze`, { method: "POST", body: fd });
  // don't set Content-Type manually — the browser adds the multipart boundary
  ```
- **`/api/demo/*` `call_id`/`token` params are query params, not path/body**
  (e.g. `POST /api/demo/trigger-verification?call_id=...`) — these are
  simulator-only convenience endpoints, not the primary API surface.

Everything else (`/api/calls/start`, `/verify-person`, `/respond`,
`/send-verification`, `/api/verification/{token}/login`, `/api/family/setup`,
`/api/payment/check`) takes a plain JSON body and returns JSON.

### WebSocket contract

Connect one socket per screen: `ws://<host>/ws/{family_id}?role=mom|dad|son|scammer`.
It's push-only from the server — send nothing, just listen for `{"event": ...}`
messages. All 20 events from the product spec are implemented, plus one extra
(`CONTACTING_SON`, fired the instant Verify Person reaches Rahul's device, so
the UI can show a "Contacting..." state immediately rather than waiting for
the first real response).

| Event | When | Notes |
|---|---|---|
| `CALL_STARTED` | `POST /calls/start` | |
| `CALL_ACCEPTED` | `POST /calls/{id}/accept` | |
| `TRANSCRIPT_UPDATED` | `POST /calls/{id}/analyze` | |
| `RISK_UPDATED` | `POST /calls/{id}/analyze` | carries `risk_level`, `risk_score`, `signals`, `why` |
| `CONTACTING_SON` | `POST /calls/{id}/verify-person`, son reachable | not in the original spec vocabulary |
| `VERIFY_REQUESTED` | same, sent to son only | |
| `SON_ONLINE` / `SON_OFFLINE` | son's socket connects/disconnects | |
| `SON_TIMEOUT` | 30s with no response | `verification_status` becomes `UNVERIFIED`, not a scam verdict |
| `SON_CONFIRMED` | `POST /calls/{id}/respond {confirmed:true}` | |
| `SON_DENIED` | same, `confirmed:false` | followed by `IMPERSONATION_CONFIRMED` |
| `SEND_CALLER_VERIFICATION` | `POST /calls/{id}/send-verification`, sent to `scammer` role | carries the link |
| `VERIFICATION_LINK_CREATED` | same, broadcast to family | |
| `VERIFICATION_STARTED` | caller opens `GET /verification/{token}` | |
| `VERIFICATION_SUCCESS` / `VERIFICATION_FAILED` | `POST /verification/{token}/login` | |
| `IMPERSONATION_CONFIRMED` | son denies, or credential check fails | `status` field distinguishes `SON_DENIED` vs `IDENTITY_VERIFICATION_FAILED` |
| `FAMILY_ALERT` | impersonation confirmed, sent to `dad` role | |
| `PAYMENT_LOCKED` / `PAYMENT_UNLOCKED` | verification fails/succeeds, or `POST /payment/check` | |
| `INCIDENT_CREATED` | impersonation confirmed | carries `incident_id`, fetch via `GET /api/incidents/{id}` |

A single `ConnectionManager` singleton tracks one live socket per
`(family_id, role)`; reconnecting (e.g. a refreshed tab) safely replaces the
old connection without a stale disconnect knocking a live one offline.
