# VoiceGuard — Live Call Room

A standalone, separately-hosted visualization: three phone mockups (Mom, Son,
Anonymous Call) side by side, each holding its **own independent WebSocket
connection** to the real VoiceGuard backend — genuinely simulating three
separate devices, not a shared-state trick within one page.

Plain HTML/CSS/JS, no build step, no dependency on the main React app.

## Run

Requires the VoiceGuard backend running on `127.0.0.1:8123` (see `../backend/README.md`).

```bash
cd phone-demo
python -m http.server 5175
```

Open `http://localhost:5175`.

## What it demonstrates

1. Click **Start New Call** — a real call is created via `/api/calls/start`
   and broadcast to all three connected roles.
2. Type as the caller (or click a quick phrase) and hit **Send** — the line
   appears instantly on the caller's own phone, and on Mom's phone in real
   time over WebSocket, with suspicious phrasing highlighted in red the
   moment it arrives (client-side keyword matching, no backend round trip
   needed for the highlight itself). The risk badge updates from the real
   backend risk engine a moment later.
3. Click **Verify Person** on Mom's phone — the "IS THIS YOU?" prompt
   appears on Rahul's phone *simultaneously*, pushed over its own
   WebSocket connection, exactly as it would to a second physical device.
4. Rahul's Yes/No response propagates back to Mom's phone live.

The keyword list in `app.js` mirrors `backend/services/risk_service.py` —
it's for instant visual feedback only; the actual risk score always comes
from the real backend.
