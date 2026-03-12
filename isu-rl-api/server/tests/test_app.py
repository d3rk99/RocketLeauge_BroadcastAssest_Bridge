from datetime import datetime, timezone

from fastapi.testclient import TestClient

from app import app
from config import settings

client = TestClient(app)


def test_ingest_requires_api_key():
    payload = {
        "event_type": "match_start",
        "match_id": "active",
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "payload": {"status": "live", "clock": "5:00"},
    }

    denied = client.post("/ingest", json=payload)
    assert denied.status_code == 401

    allowed = client.post("/ingest", headers={"x-api-key": settings.isu_rl_api_key}, json=payload)
    assert allowed.status_code == 200
    assert allowed.json()["state"]["status"] == "live"


def test_admin_set_teams_and_fetch_state():
    resp = client.post(
        "/admin/set-teams",
        headers={"x-api-key": settings.isu_rl_api_key},
        json={"blue_team_name": "ISU Blue", "orange_team_name": "ISU Orange", "best_of": 7},
    )
    assert resp.status_code == 200

    state = client.get("/state/current")
    data = state.json()
    assert data["blue_team_name"] == "ISU Blue"
    assert data["orange_team_name"] == "ISU Orange"
    assert data["best_of"] == 7
