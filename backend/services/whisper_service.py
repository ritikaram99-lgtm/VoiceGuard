"""Speech-to-text. Real Whisper is a drop-in swap — see `_transcribe_real`.

For the demo, calls are usually started with a canned `scenario` transcript
(see api/demo.py) so the pipeline runs end-to-end without needing real audio
capture. If raw audio bytes are posted, this falls back to a mock transcript
unless `openai-whisper` is installed and VOICEGUARD_USE_REAL_WHISPER=1.
"""

import os

_MODEL = None


def _transcribe_real(audio_bytes: bytes) -> str:
    global _MODEL
    import tempfile

    import whisper  # type: ignore

    if _MODEL is None:
        _MODEL = whisper.load_model("base")

    with tempfile.NamedTemporaryFile(suffix=".wav", delete=False) as f:
        f.write(audio_bytes)
        path = f.name

    result = _MODEL.transcribe(path)
    return result["text"].strip()


def transcribe(audio_bytes: bytes) -> str:
    if os.getenv("VOICEGUARD_USE_REAL_WHISPER") == "1":
        try:
            return _transcribe_real(audio_bytes)
        except ImportError:
            pass
    return "[mock transcript] Audio received but real Whisper is not enabled on this server."
