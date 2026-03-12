# ISU RL API v2 Roadmap (Execution Plan)

This document translates the six requested v2 items into concrete implementation steps.

## 1) Capture and catalog real Overwolf payloads
- Run 3-5 capture sessions using `overwolf-app/public/debug.html`.
- Store payload snapshots in `overwolf-app/payload-catalog/`.
- Add mapping tests for each captured event shape.

## 2) Add persistent storage + event history (Redis/Postgres)
- Introduce Postgres tables:
  - `matches`
  - `events`
  - `state_snapshots`
- Use Redis for pub/sub fanout and recent cache.
- Keep in-memory mode for local dev fallback.

## 3) Add multi-match/session support
- Add `match_id` routing in API and WebSocket channels.
- Allow creating/selecting active session from admin page.
- Overlay URL should accept `?match_id=...`.

## 4) Add authenticated admin UI with operator roles
- Add login + JWT for admin endpoints.
- Add role matrix: `observer`, `operator`, `admin`.
- Audit-log all admin mutations.

## 5) Add richer overlay variants and per-scene layouts
- Add variants:
  - compact scorebug
  - full-width scorebar
  - lower-third game status
- Support URL-driven theming (colors/fonts/position presets).

## 6) Add tests for state transitions and ingest validation
- Unit tests: `StateManager` transitions and duplicate protections.
- API tests: auth, ingest validation, admin endpoints.
- Integration tests: ingest sequence -> websocket snapshot consistency.

## Suggested rollout order
1. Tests baseline (item 6)
2. Payload capture + mapping hardening (item 1)
3. Persistent event history (item 2)
4. Multi-match routing (item 3)
5. Auth roles (item 4)
6. Overlay variants (item 5)
