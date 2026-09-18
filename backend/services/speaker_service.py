"""Speaker verification using SpeechBrain ECAPA-TDNN.

Real ECAPA-TDNN (speechbrain) is used when available.
Mock mode derives a deterministic pseudo-embedding from the audio bytes
if the real model is disabled or speechbrain is not installed.

Raw voice recordings are never persisted — only the derived embedding.
Temporary audio files are strictly cleaned up.
Model is cached at startup.
Non-blocking async helpers allow inference in a threadpool without blocking the event loop.
"""

import asyncio
import hashlib
import logging
import os
import tempfile

logger = logging.getLogger(__name__)

# Ensure certificates are discoverable
try:
    import certifi
    os.environ.setdefault("SSL_CERT_FILE", certifi.where())
except ImportError:
    pass

# Ensure ffmpeg binary is discoverable
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

EMBEDDING_DIM = 32
MATCH_THRESHOLD = float(os.getenv("VOICEGUARD_SPEAKER_THRESHOLD", "0.65"))

_CLASSIFIER = None


def _convert_to_wav_if_needed(raw_bytes: bytes) -> bytes:
    if raw_bytes[:4] == b"RIFF":
        return raw_bytes
    import subprocess
    try:
        cmd = [
            "ffmpeg", "-nostdin", "-threads", "0",
            "-i", "pipe:0",
            "-f", "wav", "-ac", "1", "-ar", "16000", "-acodec", "pcm_s16le",
            "pipe:1"
        ]
        res = subprocess.run(cmd, input=raw_bytes, capture_output=True, check=True)
        return res.stdout
    except Exception as e:
        logger.warning(f"Audio conversion to WAV via ffmpeg failed: {e}")
        return raw_bytes


def load_model():
    """Pre-warm and cache the ECAPA-TDNN classifier model in memory."""
    global _CLASSIFIER
    if _CLASSIFIER is None:
        from speechbrain.inference.speaker import EncoderClassifier  # type: ignore
        logger.info("Loading SpeechBrain ECAPA-TDNN model...")
        _CLASSIFIER = EncoderClassifier.from_hparams(source="speechbrain/spkrec-ecapa-voxceleb")
        logger.info("SpeechBrain ECAPA-TDNN model loaded successfully.")
    return _CLASSIFIER


def _pseudo_embedding(audio_bytes: bytes) -> list[float]:
    digest = hashlib.sha256(audio_bytes).digest()
    return [b / 255.0 for b in digest[:EMBEDDING_DIM]]


def _embed_real(audio_bytes: bytes) -> list[float]:
    global _CLASSIFIER
    if _CLASSIFIER is None:
        load_model()

    wav_bytes = _convert_to_wav_if_needed(audio_bytes)

    tmp_file = tempfile.NamedTemporaryFile(suffix=".wav", delete=False)
    path = tmp_file.name
    try:
        tmp_file.write(wav_bytes)
        tmp_file.flush()
        tmp_file.close()

        signal = _CLASSIFIER.load_audio(path)
        embedding = _CLASSIFIER.encode_batch(signal.unsqueeze(0), normalize=True)
        return embedding.squeeze().tolist()


    finally:
        if os.path.exists(path):
            try:
                os.unlink(path)
            except OSError as e:
                logger.warning(f"Failed to remove temporary audio file {path}: {e}")


def embed(audio_bytes: bytes) -> list[float]:
    use_real = os.getenv("VOICEGUARD_USE_REAL_ECAPA", "1")
    if use_real not in ("0", "false", "False"):
        try:
            return _embed_real(audio_bytes)
        except Exception as e:
            logger.warning(f"SpeechBrain embedding extraction failed, falling back to mock: {e}")
    return _pseudo_embedding(audio_bytes)


async def async_embed(audio_bytes: bytes) -> list[float]:
    """Run embedding extraction asynchronously in a background thread."""
    return await asyncio.to_thread(embed, audio_bytes)


def _cosine_similarity(a: list[float], b: list[float]) -> float:
    if len(a) != len(b) or not a:
        return 0.0
    dot = sum(x * y for x, y in zip(a, b))
    norm_a = sum(x * x for x in a) ** 0.5
    norm_b = sum(y * y for y in b) ** 0.5
    if norm_a == 0 or norm_b == 0:
        return 0.0
    return dot / (norm_a * norm_b)


def compare(registered_embedding: list[float], caller_audio: bytes) -> tuple[bool, float]:
    caller_embedding = embed(caller_audio)
    similarity = round(_cosine_similarity(registered_embedding, caller_embedding), 4)
    return similarity >= MATCH_THRESHOLD, similarity


async def async_compare(registered_embedding: list[float], caller_audio: bytes) -> tuple[bool, float]:
    """Run comparison asynchronously in a background thread."""
    return await asyncio.to_thread(compare, registered_embedding, caller_audio)
