from datetime import datetime, timezone

from models import ManualScoreRequest, NormalizedEventPayload
from state_manager import StateManager


def _event(event_type: str, payload: dict):
    return NormalizedEventPayload(
        event_type=event_type,
        match_id="active",
        timestamp=datetime.now(timezone.utc),
        payload=payload,
    )


def test_match_lifecycle_and_series_increment_once():
    manager = StateManager()

    manager.apply_ingest_event(_event("match_start", {"clock": "5:00", "status": "live"}))
    manager.apply_ingest_event(_event("goal", {"blue_score": 1, "orange_score": 0, "clock": "4:31"}))
    manager.apply_ingest_event(_event("match_end", {"winner": "blue", "status": "postgame"}))

    state = manager.get_state()
    assert state.blue_series_wins == 1
    assert state.orange_series_wins == 0
    assert state.game_number == 2

    # duplicate postgame event should not increment same game twice
    manager.apply_ingest_event(_event("match_end", {"winner": "blue", "status": "postgame"}))
    state = manager.get_state()
    assert state.blue_series_wins == 1


def test_manual_mode_blocks_auto_ingest_score_changes():
    manager = StateManager()

    manager.set_mode(False)
    manager.manual_score_update(ManualScoreRequest(blue_score=3, orange_score=1))
    manager.apply_ingest_event(_event("goal", {"blue_score": 0, "orange_score": 5, "clock": "1:00"}))

    state = manager.get_state()
    assert state.blue_score == 3
    assert state.orange_score == 1
    assert state.last_event.startswith("ignored_auto:")
