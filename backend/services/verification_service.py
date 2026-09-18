import sqlite3
import uuid
from datetime import datetime, timedelta, timezone

from database.database import db_session
from services import family_service

CHALLENGE_TTL_MINUTES = 5


class ChallengeError(Exception):
    def __init__(self, code: str, message: str):
        self.code = code
        self.message = message
        super().__init__(message)


def _now() -> datetime:
    return datetime.now(timezone.utc)


def create_challenge(call_id: str, family_id: str, claimed_user_id: str, caller_number: str, reason: str) -> tuple[str, str]:
    token = uuid.uuid4().hex[:10].upper()
    expires_at = (_now() + timedelta(minutes=CHALLENGE_TTL_MINUTES)).isoformat()
    with db_session() as conn:
        conn.execute(
            """INSERT INTO verification_challenges
               (token, call_id, family_id, claimed_user_id, caller_number, reason, expires_at, used, created_at)
               VALUES (?, ?, ?, ?, ?, ?, ?, 0, ?)""",
            (token, call_id, family_id, claimed_user_id, caller_number, reason, expires_at, _now().isoformat()),
        )
    return token, expires_at


def get_challenge(token: str) -> sqlite3.Row:
    with db_session() as conn:
        row = conn.execute(
            "SELECT * FROM verification_challenges WHERE token = ?", (token,)
        ).fetchone()
    if row is None:
        raise ChallengeError("NOT_FOUND", "This verification link is invalid.")
    if row["used"]:
        raise ChallengeError("USED", "This verification link has already been used.")
    if datetime.fromisoformat(row["expires_at"]) < _now():
        raise ChallengeError("EXPIRED", "This verification link has expired.")
    return row


def _mark_used(token: str) -> None:
    with db_session() as conn:
        conn.execute("UPDATE verification_challenges SET used = 1 WHERE token = ?", (token,))


def _record_attempt(token: str, login_id: str, success: bool) -> None:
    with db_session() as conn:
        conn.execute(
            "INSERT INTO verification_attempts (id, token, login_id, success, created_at) VALUES (?, ?, ?, ?, ?)",
            (family_service.new_id(), token, login_id, 1 if success else 0, _now().isoformat()),
        )


def verify_credentials(token: str, login_id: str, password: str) -> bool:
    """Checks the caller-supplied credentials against the claimed identity's
    registered login. Always consumes the token — it is one-time-use whether
    the attempt succeeds or fails, so a failed guess can't be retried.
    """
    challenge = get_challenge(token)
    user = family_service.get_user(challenge["claimed_user_id"])

    success = bool(user) and user["login_id"] == login_id and user["password"] == password

    _record_attempt(token, login_id, success)
    _mark_used(token)
    return success
