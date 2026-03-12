from __future__ import annotations

from datetime import datetime, timezone
from enum import Enum
from typing import Any, Optional

from pydantic import BaseModel, Field


class MatchStatus(str, Enum):
    idle = "idle"
    pregame = "pregame"
    live = "live"
    goal_pause = "goal_pause"
    replay = "replay"
    overtime = "overtime"
    postgame = "postgame"
    complete = "complete"


class NormalizedEventPayload(BaseModel):
    event_type: str = Field(..., examples=["goal", "match_start", "clock_update", "match_end"])
    match_id: str = "active"
    timestamp: datetime
    payload: dict[str, Any] = Field(default_factory=dict)


class MatchState(BaseModel):
    match_id: str = "active"
    series_id: str = "default"
    game_number: int = 1
    best_of: int = 5
    status: MatchStatus = MatchStatus.idle
    auto_mode: bool = True

    blue_team_name: str = "Blue"
    orange_team_name: str = "Orange"

    blue_score: int = 0
    orange_score: int = 0
    blue_series_wins: int = 0
    orange_series_wins: int = 0

    clock: str = "5:00"
    overtime: bool = False

    last_event: Optional[str] = None
    winner: Optional[str] = None
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))


class TeamNamesRequest(BaseModel):
    blue_team_name: str
    orange_team_name: str
    best_of: Optional[int] = None


class ManualScoreRequest(BaseModel):
    blue_score: Optional[int] = None
    orange_score: Optional[int] = None
    blue_series_wins: Optional[int] = None
    orange_series_wins: Optional[int] = None
    clock: Optional[str] = None
    overtime: Optional[bool] = None
    status: Optional[MatchStatus] = None
    winner: Optional[str] = None


class ModeRequest(BaseModel):
    auto_mode: bool


class MessageResponse(BaseModel):
    message: str
    state: MatchState
