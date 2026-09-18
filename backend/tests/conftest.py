import uuid
from pathlib import Path

import pytest
from fastapi.testclient import TestClient

DB_PATH = Path(__file__).resolve().parent.parent / "voiceguard.db"
DB_PATH.unlink(missing_ok=True)

from main import app  # noqa: E402


@pytest.fixture()
def client():
    with TestClient(app) as c:
        yield c


@pytest.fixture()
def family(client):
    login_id = f"rahul_test_{uuid.uuid4().hex[:8]}"
    resp = client.post(
        "/api/family/setup",
        json={
            "family_name": "Test Family",
            "members": [
                {"name": "Mom", "role": "mom"},
                {"name": "Dad", "role": "dad"},
                {"name": "Rahul", "role": "son", "login_id": login_id, "password": "correct-horse"},
            ],
        },
    )
    assert resp.status_code == 200
    data = resp.json()
    by_role = {m["role"]: m for m in data["members"]}
    return {"family_id": data["family_id"], **by_role}
