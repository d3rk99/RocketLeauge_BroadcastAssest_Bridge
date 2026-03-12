from __future__ import annotations

from fastapi import Depends, FastAPI, Header, HTTPException, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware

from broadcast_hub import BroadcastHub
from config import settings
from models import (
    ManualScoreRequest,
    MessageResponse,
    ModeRequest,
    NormalizedEventPayload,
    TeamNamesRequest,
)
from state_manager import StateManager

app = FastAPI(title="ISU RL API", version="0.1.0")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

state_manager = StateManager()
hub = BroadcastHub()


def api_key_guard(x_api_key: str = Header(default="")) -> None:
    if x_api_key != settings.isu_rl_api_key:
        raise HTTPException(status_code=401, detail="Invalid API key")


async def push_state() -> None:
    await hub.broadcast_state(state_manager.get_state().model_dump_json())


@app.get("/")
def root() -> dict:
    return {
        "name": "ISU RL API",
        "state_url": f"{settings.isu_rl_public_base_url}/state/current",
        "ws_url": f"{settings.isu_rl_public_base_url.replace('http', 'ws')}/ws",
    }


@app.post("/ingest", response_model=MessageResponse, dependencies=[Depends(api_key_guard)])
async def ingest(payload: NormalizedEventPayload) -> MessageResponse:
    state = state_manager.apply_ingest_event(payload)
    await push_state()
    return MessageResponse(message="ingested", state=state)


@app.get("/state/current")
def state_current():
    return state_manager.get_state()


@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket) -> None:
    await hub.connect(websocket)
    await websocket.send_text(state_manager.get_state().model_dump_json())
    try:
        while True:
            await websocket.receive_text()
    except WebSocketDisconnect:
        hub.disconnect(websocket)
    except Exception:
        hub.disconnect(websocket)


@app.post("/admin/reset", response_model=MessageResponse, dependencies=[Depends(api_key_guard)])
async def admin_reset() -> MessageResponse:
    state = state_manager.reset()
    await push_state()
    return MessageResponse(message="reset", state=state)


@app.post("/admin/set-teams", response_model=MessageResponse, dependencies=[Depends(api_key_guard)])
async def admin_set_teams(req: TeamNamesRequest) -> MessageResponse:
    state = state_manager.set_teams(req)
    await push_state()
    return MessageResponse(message="teams_updated", state=state)


@app.post("/admin/manual-score", response_model=MessageResponse, dependencies=[Depends(api_key_guard)])
async def admin_manual_score(req: ManualScoreRequest) -> MessageResponse:
    state = state_manager.manual_score_update(req)
    await push_state()
    return MessageResponse(message="manual_score_updated", state=state)


@app.post("/admin/mode", response_model=MessageResponse, dependencies=[Depends(api_key_guard)])
async def admin_mode(req: ModeRequest) -> MessageResponse:
    state = state_manager.set_mode(req.auto_mode)
    await push_state()
    return MessageResponse(message="mode_updated", state=state)
