import sqlite3
import uuid
from datetime import datetime, timezone

from database.database import db_session


def now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


def new_id() -> str:
    return uuid.uuid4().hex[:12]


def create_family(name: str) -> str:
    family_id = new_id()
    with db_session() as conn:
        conn.execute(
            "INSERT INTO families (id, name, created_at) VALUES (?, ?, ?)",
            (family_id, name, now_iso()),
        )
    return family_id


def create_member(family_id: str, name: str, role: str, login_id: str | None, password: str | None, phone: str | None) -> str:
    user_id = new_id()
    with db_session() as conn:
        conn.execute(
            """INSERT INTO users (id, family_id, name, role, login_id, password, phone, registered_at)
               VALUES (?, ?, ?, ?, ?, ?, ?, ?)""",
            (user_id, family_id, name, role, login_id, password, phone, now_iso()),
        )
    return user_id


def get_user(user_id: str) -> sqlite3.Row | None:
    with db_session() as conn:
        return conn.execute("SELECT * FROM users WHERE id = ?", (user_id,)).fetchone()


def get_family_members(family_id: str) -> list[sqlite3.Row]:
    with db_session() as conn:
        return conn.execute("SELECT * FROM users WHERE family_id = ?", (family_id,)).fetchall()


def set_voice_embedding(user_id: str, embedding: list[float]) -> None:
    import json

    with db_session() as conn:
        conn.execute(
            "UPDATE users SET voice_embedding = ? WHERE id = ?",
            (json.dumps(embedding), user_id),
        )


def get_caller_history(caller_number: str) -> sqlite3.Row | None:
    with db_session() as conn:
        return conn.execute(
            "SELECT * FROM caller_history WHERE caller_number = ?", (caller_number,)
        ).fetchone()


def create_incident(
    call_id: str,
    family_id: str,
    caller_number: str,
    claimed_identity: str,
    transcript: str,
    risk_level: str,
    risk_signals: list[str],
    speaker_result: str | None,
    verification_result: str,
    action_taken: str,
) -> str:
    import json

    incident_id = new_id()
    with db_session() as conn:
        conn.execute(
            """INSERT INTO incidents
               (id, call_id, family_id, caller_number, claimed_identity, transcript,
                risk_level, risk_signals, speaker_result, verification_result, action_taken, created_at)
               VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)""",
            (
                incident_id, call_id, family_id, caller_number, claimed_identity, transcript,
                risk_level, json.dumps(risk_signals), speaker_result, verification_result, action_taken, now_iso(),
            ),
        )
    return incident_id


def record_call_for_caller(caller_number: str, suspicious: bool, result: str) -> None:
    with db_session() as conn:
        existing = conn.execute(
            "SELECT * FROM caller_history WHERE caller_number = ?", (caller_number,)
        ).fetchone()
        if existing is None:
            conn.execute(
                "INSERT INTO caller_history (caller_number, total_calls, suspicious_calls, last_result) VALUES (?, ?, ?, ?)",
                (caller_number, 1, 1 if suspicious else 0, result),
            )
        else:
            conn.execute(
                """UPDATE caller_history
                   SET total_calls = total_calls + 1,
                       suspicious_calls = suspicious_calls + ?,
                       last_result = ?
                   WHERE caller_number = ?""",
                (1 if suspicious else 0, result, caller_number),
            )
