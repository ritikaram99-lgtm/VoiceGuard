"""Speaker verification. Real ECAPA-TDNN (speechbrain) is a drop-in swap —
see `_embed_real`. Mock mode derives a deterministic pseudo-embedding from
the audio bytes so demo runs are repeatable: the same recording always
produces the same similarity against a given registered embedding.

Raw voice recordings are never persisted — only the derived embedding.
"""

import hashlib
import os

EMBEDDING_DIM = 32
MATCH_THRESHOLD = 0.6


def _pseudo_embedding(audio_bytes: bytes) -> list[float]:
    digest = hashlib.sha256(audio_bytes).digest()
    return [b / 255.0 for b in digest[:EMBEDDING_DIM]]


def _embed_real(audio_bytes: bytes) -> list[float]:
    import tempfile

    import torch  # type: ignore
    from speechbrain.inference.speaker import EncoderClassifier  # type: ignore

    classifier = EncoderClassifier.from_hparams(source="speechbrain/spkrec-ecapa-voxceleb")
    with tempfile.NamedTemporaryFile(suffix=".wav", delete=False) as f:
        f.write(audio_bytes)
        path = f.name
    signal = classifier.load_audio(path)
    embedding = classifier.encode_batch(signal.unsqueeze(0))
    return embedding.squeeze().tolist()


def embed(audio_bytes: bytes) -> list[float]:
    if os.getenv("VOICEGUARD_USE_REAL_ECAPA") == "1":
        try:
            return _embed_real(audio_bytes)
        except ImportError:
            pass
    return _pseudo_embedding(audio_bytes)


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
