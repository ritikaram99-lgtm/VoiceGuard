"""Tests for real audio processing pipeline (P1):
- Whisper transcription
- SpeechBrain ECAPA speaker verification
- Temp audio file cleanup
- Non-blocking execution
- Full pipeline: audio -> transcript + speaker verification -> risk engine -> action protection -> incident
"""

import io
import math
import os
import struct
import tempfile
import wave
import pytest
from fastapi.testclient import TestClient

from database.database import db_session, init_db
from main import app
from services import speaker_service, whisper_service


def _generate_synthetic_wav(freq: float = 440.0, duration_sec: float = 1.0, sample_rate: int = 16000) -> bytes:
    """Generate a clean 16kHz mono PCM 16-bit WAV file in memory."""
    buf = io.BytesIO()
    total_samples = int(duration_sec * sample_rate)
    with wave.open(buf, "wb") as wf:
        wf.setnchannels(1)
        wf.setsampwidth(2)
        wf.setframerate(sample_rate)
        frames = bytearray()
        for i in range(total_samples):
            val = int(32767.0 * 0.6 * math.sin(2.0 * math.pi * freq * i / sample_rate))
            frames.extend(struct.pack("<h", val))
        wf.writeframes(frames)
    return buf.getvalue()


@pytest.fixture(autouse=True)
def fresh_db(tmp_path, monkeypatch):
    import datetime
    now = datetime.datetime.now(datetime.timezone.utc).isoformat()
    test_db = str(tmp_path / "test_audio.db")
    monkeypatch.setattr("database.database.DB_PATH", test_db)
    init_db()
    with db_session() as conn:
        conn.execute("INSERT INTO families (id, name, created_at) VALUES ('f1', 'Test Family', ?)", (now,))
        conn.execute(
            "INSERT INTO users (id, family_id, name, role, phone, registered_at) VALUES ('u-rahul', 'f1', 'Rahul', 'son', '+919999900001', ?)",
            (now,),
        )
        conn.execute(
            "INSERT INTO users (id, family_id, name, role, phone, registered_at) VALUES ('u-mom', 'f1', 'Mom', 'mom', '+919999900002', ?)",
            (now,),
        )
    yield



def test_speaker_service_real_ecapa():
    wav1 = _generate_synthetic_wav(freq=220.0, duration_sec=1.0)
    wav2 = _generate_synthetic_wav(freq=880.0, duration_sec=1.0)

    # Embedding extraction
    emb1 = speaker_service.embed(wav1)
    assert isinstance(emb1, list)
    assert len(emb1) == 192  # SpeechBrain ECAPA voxceleb produces 192-dim embeddings

    # Self-comparison
    matched, sim = speaker_service.compare(emb1, wav1)
    assert matched is True
    assert sim >= 0.95

    # Different audio should produce lower similarity
    matched_diff, sim_diff = speaker_service.compare(emb1, wav2)
    assert sim_diff < sim


def test_temp_audio_cleanup():
    tmpdir = tempfile.gettempdir()
    before_wavs = {f for f in os.listdir(tmpdir) if f.endswith(".wav")}

    wav = _generate_synthetic_wav(freq=300.0, duration_sec=0.5)
    _ = speaker_service.embed(wav)
    _ = whisper_service.transcribe(wav)

    after_wavs = {f for f in os.listdir(tmpdir) if f.endswith(".wav")}
    # Ensure no new temporary .wav files were left behind in the temp directory
    new_leaked = after_wavs - before_wavs
    assert len(new_leaked) == 0, f"Leaked temporary audio files: {new_leaked}"


def test_real_audio_pipeline_end_to_end():
    client = TestClient(app)

    # 1. Register Rahul's voice
    voice_sample = _generate_synthetic_wav(freq=220.0, duration_sec=1.0)
    reg_resp = client.post(
        "/api/identity/register-voice",
        data={"user_id": "u-rahul"},
        files={"audio": ("rahul_voice.wav", voice_sample, "audio/wav")},
    )
    assert reg_resp.status_code == 200
    reg_data = reg_resp.json()
    assert reg_data["status"] == "VOICE_REGISTERED"
    assert reg_data["embedding_dim"] == 192

    # 2. Start an incoming call claiming to be Rahul
    start_resp = client.post(
        "/api/calls/start",
        json={
            "family_id": "f1",
            "caller_number": "+91 98765 43210",
            "claimed_identity_user_id": "u-rahul",
        },
    )
    assert start_resp.status_code == 200
    call_id = start_resp.json()["call_id"]

    # Accept call
    client.post(f"/api/calls/{call_id}/accept")

    # 3. Analyze call with real audio from an impostor (different voice frequency + suspicious transcript)
    impostor_audio = _generate_synthetic_wav(freq=880.0, duration_sec=1.0)
    analyze_resp = client.post(

        f"/api/calls/{call_id}/analyze",
        data={"transcript": "Mom, I am in urgent trouble with police, please send 50000 rupees immediately to avoid arrest!"},
        files={"audio": ("caller_impostor.wav", impostor_audio, "audio/wav")},
    )
    assert analyze_resp.status_code == 200
    data = analyze_resp.json()

    # Verify speaker verification evaluated mismatch
    assert data["speaker_match"] is False
    assert data["speaker_similarity"] is not None
    assert "voice_mismatch" in data["signals"]
    assert "urgent_request" in data["signals"]
    assert "money_request" in data["signals"]
    assert data["risk_level"] in ("HIGH", "CRITICAL")


    # 4. Action protection: check payment/action protection
    check_resp = client.post("/api/payment/check", json={"call_id": call_id, "amount": 50000.0})
    assert check_resp.status_code == 200
    assert check_resp.json()["action_status"] == "PROTECTED"


    # 5. Verify person: Rahul responds NO via WebSocket / REST
    with client.websocket_connect(f"/ws/f1?role=son") as son_ws, \
         client.websocket_connect(f"/ws/f1?role=dad") as dad_ws:
        verify_req = client.post(f"/api/calls/{call_id}/verify-person")
        assert verify_req.json()["status"] == "contacting"

        resp_no = client.post(
            f"/api/calls/{call_id}/respond",
            json={"confirmed": False},
        )
        assert resp_no.status_code == 200
        assert resp_no.json()["verification_status"] == "IMPERSONATION"

        # Check dad received the family shield alert and incident created events
        dad_events = [dad_ws.receive_json()["event"] for _ in range(7)]
        assert "FAMILY_ALERT" in dad_events
        assert "ACTION_PROTECTED" in dad_events
        assert "INCIDENT_CREATED" in dad_events

    # 6. Verify incident capsule was created
    incidents_resp = client.get("/api/incidents?family_id=f1")
    assert incidents_resp.status_code == 200
    incidents = incidents_resp.json()
    assert len(incidents) >= 1
    latest = incidents[0]
    assert latest["call_id"] == call_id
    assert latest["action_taken"] == "ACTION_PROTECTED"
    assert latest["verification_result"] == "IMPERSONATION_CONFIRMED"




