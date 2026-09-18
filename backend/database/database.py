import sqlite3
from contextlib import contextmanager
from pathlib import Path

DB_PATH = Path(__file__).resolve().parent.parent / "voiceguard.db"

SCHEMA = """
CREATE TABLE IF NOT EXISTS families (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    family_id TEXT NOT NULL,
    name TEXT NOT NULL,
    role TEXT NOT NULL,              -- mom | dad | son (see FamilyMemberIn)
    login_id TEXT UNIQUE,
    password TEXT,
    phone TEXT,
    voice_embedding TEXT,
    registered_at TEXT
);

CREATE TABLE IF NOT EXISTS calls (
    id TEXT PRIMARY KEY,
    family_id TEXT NOT NULL,
    claimed_identity_user_id TEXT NOT NULL,
    caller_number TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'RINGING',   -- RINGING | ACTIVE | ENDED
    transcript TEXT DEFAULT '',
    risk_score INTEGER DEFAULT 0,
    risk_level TEXT DEFAULT 'LOW',
    risk_signals TEXT DEFAULT '[]',
    speaker_match INTEGER,
    speaker_similarity REAL,
    verification_status TEXT DEFAULT 'NONE',  -- NONE | PENDING | VERIFIED | FAILED | UNVERIFIED | IMPERSONATION
    action_status TEXT DEFAULT 'ALLOWED',     -- ALLOWED | PROTECTED | BLOCKED
    created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS caller_history (
    caller_number TEXT PRIMARY KEY,
    total_calls INTEGER DEFAULT 0,
    suspicious_calls INTEGER DEFAULT 0,
    last_result TEXT
);

CREATE TABLE IF NOT EXISTS risk_events (
    id TEXT PRIMARY KEY,
    call_id TEXT NOT NULL,
    signal TEXT NOT NULL,
    weight INTEGER NOT NULL,
    created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS verification_challenges (
    token TEXT PRIMARY KEY,
    call_id TEXT NOT NULL,
    family_id TEXT NOT NULL,
    claimed_user_id TEXT NOT NULL,
    caller_number TEXT NOT NULL,
    reason TEXT NOT NULL,             -- offline | timeout | requested_by_son | manual
    expires_at TEXT NOT NULL,
    used INTEGER DEFAULT 0,
    created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS verification_attempts (
    id TEXT PRIMARY KEY,
    token TEXT NOT NULL,
    login_id TEXT,
    success INTEGER NOT NULL,
    created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS incidents (
    id TEXT PRIMARY KEY,
    call_id TEXT NOT NULL,
    family_id TEXT NOT NULL,
    caller_number TEXT NOT NULL,
    claimed_identity TEXT NOT NULL,
    transcript TEXT,
    risk_level TEXT,
    risk_signals TEXT,
    speaker_result TEXT,
    verification_result TEXT NOT NULL,
    action_taken TEXT NOT NULL,
    created_at TEXT NOT NULL
);
"""


def get_db() -> sqlite3.Connection:
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA foreign_keys = ON")
    return conn


@contextmanager
def db_session():
    conn = get_db()
    try:
        yield conn
        conn.commit()
    finally:
        conn.close()


def init_db() -> None:
    with db_session() as conn:
        conn.executescript(SCHEMA)
