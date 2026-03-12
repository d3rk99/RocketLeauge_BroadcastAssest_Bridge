from __future__ import annotations

from datetime import datetime, timezone

from models import MatchState, MatchStatus, ManualScoreRequest, NormalizedEventPayload, TeamNamesRequest


class StateManager:
    """Owns one authoritative in-memory match state for v1."""

    def __init__(self) -> None:
        self._state = MatchState()
        self._series_recorded_for_game: int | None = None

    def get_state(self) -> MatchState:
        return self._state

    def reset(self) -> MatchState:
        best_of = self._state.best_of
        blue = self._state.blue_team_name
        orange = self._state.orange_team_name
        auto_mode = self._state.auto_mode

        self._state = MatchState(best_of=best_of, blue_team_name=blue, orange_team_name=orange, auto_mode=auto_mode)
        self._series_recorded_for_game = None
        return self._touch("reset")

    def set_teams(self, req: TeamNamesRequest) -> MatchState:
        self._state.blue_team_name = req.blue_team_name
        self._state.orange_team_name = req.orange_team_name
        if req.best_of is not None:
            self._state.best_of = max(1, req.best_of)
        return self._touch("set_teams")

    def set_mode(self, auto_mode: bool) -> MatchState:
        self._state.auto_mode = auto_mode
        return self._touch("set_mode")

    def manual_score_update(self, req: ManualScoreRequest) -> MatchState:
        for field in (
            "blue_score",
            "orange_score",
            "blue_series_wins",
            "orange_series_wins",
            "clock",
            "overtime",
            "status",
            "winner",
        ):
            value = getattr(req, field)
            if value is not None:
                setattr(self._state, field, value)
        return self._touch("manual_score")

    def apply_ingest_event(self, event: NormalizedEventPayload) -> MatchState:
        # Manual mode blocks automatic score/event state updates for safety.
        if not self._state.auto_mode:
            return self._touch(f"ignored_auto:{event.event_type}")

        payload = event.payload
        event_type = event.event_type

        if event_type == "match_start":
            self._state.status = MatchStatus.live
            self._state.blue_score = 0
            self._state.orange_score = 0
            self._state.clock = str(payload.get("clock", "5:00"))
            self._state.overtime = False
            self._state.winner = None
            self._series_recorded_for_game = None

        elif event_type == "goal":
            self._state.status = MatchStatus.goal_pause
            self._state.blue_score = int(payload.get("blue_score", self._state.blue_score))
            self._state.orange_score = int(payload.get("orange_score", self._state.orange_score))
            self._state.clock = str(payload.get("clock", self._state.clock))

        elif event_type == "clock_update":
            self._state.clock = str(payload.get("clock", self._state.clock))
            overtime_flag = payload.get("overtime")
            if isinstance(overtime_flag, bool):
                self._state.overtime = overtime_flag
                if overtime_flag and self._state.status == MatchStatus.live:
                    self._state.status = MatchStatus.overtime

        elif event_type == "status_update":
            status = payload.get("status")
            if status in MatchStatus._value2member_map_:
                self._state.status = MatchStatus(status)

        elif event_type == "match_end":
            self._state.status = MatchStatus.postgame
            self._state.winner = payload.get("winner")
            self._record_series_win_once()

        # Shared fields accepted on any event for flexibility.
        self._state.blue_score = int(payload.get("blue_score", self._state.blue_score))
        self._state.orange_score = int(payload.get("orange_score", self._state.orange_score))
        self._state.clock = str(payload.get("clock", self._state.clock))
        self._state.overtime = bool(payload.get("overtime", self._state.overtime))

        status_from_payload = payload.get("status")
        if status_from_payload in MatchStatus._value2member_map_:
            self._state.status = MatchStatus(status_from_payload)

        winner_from_payload = payload.get("winner")
        if winner_from_payload is not None:
            self._state.winner = winner_from_payload
            if self._state.status in (MatchStatus.postgame, MatchStatus.complete):
                self._record_series_win_once()

        if self._state.status in (MatchStatus.postgame, MatchStatus.complete):
            self._check_series_complete()

        return self._touch(event_type)

    def _record_series_win_once(self) -> None:
        """Increment series wins one time per completed game."""
        if self._series_recorded_for_game == self._state.game_number:
            return

        winner = self._state.winner
        if winner == "blue":
            self._state.blue_series_wins += 1
        elif winner == "orange":
            self._state.orange_series_wins += 1
        else:
            return

        self._series_recorded_for_game = self._state.game_number
        self._state.game_number += 1
        self._state.blue_score = 0
        self._state.orange_score = 0
        self._state.clock = "5:00"
        self._state.overtime = False
        self._state.status = MatchStatus.pregame

    def _check_series_complete(self) -> None:
        needed = (self._state.best_of // 2) + 1
        if self._state.blue_series_wins >= needed or self._state.orange_series_wins >= needed:
            self._state.status = MatchStatus.complete

    def _touch(self, last_event: str) -> MatchState:
        self._state.last_event = last_event
        self._state.updated_at = datetime.now(timezone.utc)
        return self._state
