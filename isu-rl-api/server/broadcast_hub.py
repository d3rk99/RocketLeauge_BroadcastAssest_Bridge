from __future__ import annotations

import json
from typing import Set

from fastapi import WebSocket


class BroadcastHub:
    def __init__(self) -> None:
        self._clients: Set[WebSocket] = set()

    async def connect(self, websocket: WebSocket) -> None:
        await websocket.accept()
        self._clients.add(websocket)

    def disconnect(self, websocket: WebSocket) -> None:
        self._clients.discard(websocket)

    async def broadcast_state(self, state_json: str) -> None:
        dead_clients = []
        for client in self._clients:
            try:
                await client.send_text(state_json)
            except Exception:
                dead_clients.append(client)

        for client in dead_clients:
            self.disconnect(client)

    async def broadcast_dict(self, state: dict) -> None:
        await self.broadcast_state(json.dumps(state))
