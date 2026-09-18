import json

from fastapi import APIRouter, HTTPException

from database.database import db_session

router = APIRouter(prefix="/api/incidents", tags=["incidents"])


def _row_to_incident(row) -> dict:
    d = dict(row)
    d["risk_signals"] = json.loads(d["risk_signals"] or "[]")
    return d


@router.get("")
async def list_incidents(family_id: str):
    with db_session() as conn:
        rows = conn.execute(
            "SELECT * FROM incidents WHERE family_id = ? ORDER BY created_at DESC", (family_id,)
        ).fetchall()
    return [_row_to_incident(r) for r in rows]


@router.get("/{incident_id}")
async def get_incident(incident_id: str):
    with db_session() as conn:
        row = conn.execute("SELECT * FROM incidents WHERE id = ?", (incident_id,)).fetchone()
    if row is None:
        raise HTTPException(404, "Incident not found")
    return _row_to_incident(row)
