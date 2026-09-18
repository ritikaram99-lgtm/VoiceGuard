"""Speech-to-text service using Whisper.

Supports real OpenAI Whisper (P1) and falls back to mock if real model is disabled.
Models are cached at startup and inference is run asynchronously to prevent
blocking the FastAPI event loop.
Temporary audio files are strictly cleaned up.
"""

import asyncio
import logging
import os
import tempfile

logger = logging.getLogger(__name__)

# Ensure certificates and ffmpeg binary are discoverable
try:
    import certifi
    os.environ.setdefault("SSL_CERT_FILE", certifi.where())
except ImportError:
    pass

try:
    import imageio_ffmpeg
    exe = imageio_ffmpeg.get_ffmpeg_exe()
    ffmpeg_dir = os.path.dirname(exe)
    symlink_path = os.path.join(ffmpeg_dir, "ffmpeg")
    if not os.path.exists(symlink_path):
        try:
            os.symlink(exe, symlink_path)
        except OSError:
            pass
    if ffmpeg_dir not in os.environ.get("PATH", ""):
        os.environ["PATH"] = ffmpeg_dir + os.pathsep + os.environ.get("PATH", "")
except Exception:
    pass


_MODEL = None


def load_model(model_name: str = "base"):
    """Pre-warm and cache the Whisper model in memory."""
    global _MODEL
    if _MODEL is None:
        import whisper  # type: ignore
        logger.info(f"Loading Whisper model ({model_name})...")
        _MODEL = whisper.load_model(model_name)
        logger.info(f"Whisper model ({model_name}) loaded successfully.")
    return _MODEL


def _transcribe_real(audio_bytes: bytes) -> str:
    global _MODEL
    if _MODEL is None:
        load_model()

    tmp_file = tempfile.NamedTemporaryFile(suffix=".wav", delete=False)
    path = tmp_file.name
    try:
        tmp_file.write(audio_bytes)
        tmp_file.flush()
        tmp_file.close()

        result = _MODEL.transcribe(path, fp16=False)
        return result.get("text", "").strip()

    finally:
        if os.path.exists(path):
            try:
                os.unlink(path)
            except OSError as e:
                logger.warning(f"Failed to remove temporary audio file {path}: {e}")


def transcribe(audio_bytes: bytes) -> str:
    """Synchronous transcribe helper."""
    use_real = os.getenv("VOICEGUARD_USE_REAL_WHISPER", "1")
    if use_real not in ("0", "false", "False"):
        try:
            return _transcribe_real(audio_bytes)
        except Exception as e:
            logger.warning(f"Whisper transcription failed, falling back to mock: {e}")
    return "[mock transcript] Audio received but real Whisper is not enabled on this server."


async def async_transcribe(audio_bytes: bytes) -> str:
    """Run Whisper transcription in a background thread to prevent blocking the event loop."""
    return await asyncio.to_thread(transcribe, audio_bytes)
