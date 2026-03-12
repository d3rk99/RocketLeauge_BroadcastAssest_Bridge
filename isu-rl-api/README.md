# ISU RL API (v1 Prototype)

ISU RL API is a lightweight esports broadcast utility for Rocket League that bridges Overwolf live game events to a Python backend and public browser overlays for OBS.

## 1) Architecture Summary

1. **Overwolf app** subscribes to Rocket League game events and info updates.
2. **Event adapter** converts raw Overwolf payloads into normalized events.
3. **FastAPI backend** ingests normalized events and updates one authoritative in-memory `MatchState`.
4. **BroadcastHub** pushes full state snapshots over WebSocket to all connected overlay/admin clients.
5. **Overlay page** renders a broadcast-ready scorebug for OBS browser sources.
6. **Admin page** allows team setup, reset, auto/manual mode toggling, and manual corrections.

## 2) Folder Tree

```text
/isu-rl-api
  /overwolf-app
    /src
      main.ts
      overwolf.ts
      eventAdapter.ts
      api.ts
      mockEvents.ts
    /public
      background.html
      debug.html
      debug.js
    manifest.json
    package.json
    tsconfig.json
    .env.example
    README.md
  /server
    app.py
    models.py
    state_manager.py
    broadcast_hub.py
    config.py
    requirements.txt
    .env.example
    README.md
  /web
    /overlay
      index.html
      styles.css
      app.js
    /admin
      index.html
      styles.css
      app.js
    README.md
  README.md
```

## 3) Quick Start

### Windows One-Click Scripts

From `isu-rl-api/` on Windows:

```bat
install_all.bat
run_all.bat
```

- `install_all.bat` validates a *working* Python runtime (`py`/`python`), handles common Microsoft Store alias issues, attempts Python install via `winget` if needed, creates `server\.venv`, installs backend deps into that environment, copies `.env` files, and installs/builds Overwolf app dependencies.
- `run_all.bat` starts backend (`:8000`) and static web hosting (`:5500`) in separate terminal windows using the venv Python (no `py` launcher required), waits for backend readiness, opens the Overwolf app folder for quick manifest loading, and keeps launcher/service windows open so you can read errors.

### Backend
```bash
cd isu-rl-api/server
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env
uvicorn app:app --reload --host 0.0.0.0 --port 8000
```

### Web pages (overlay/admin)
From repo root:
```bash
cd isu-rl-api
python -m http.server 5500
```
Then open:
- Overlay: `http://localhost:5500/web/overlay/index.html?base=http://localhost:8000`
- Admin: `http://localhost:5500/web/admin/index.html`

### Overwolf app (dev)
```bash
cd isu-rl-api/overwolf-app
npm install
npm run build
```
Load `overwolf-app/manifest.json` in Overwolf developer tools.

## 4) How to Use ISU RL API (Operator Flow)

After services are running, use this workflow during a broadcast:

1. **Open admin page**: `http://localhost:5500/web/admin/index.html`
2. **Set backend URL and API key** at the top of the admin page.
   - Default local backend: `http://localhost:8000`
   - API key value comes from `server/.env` (`ISU_RL_API_KEY`)
3. **Set teams and best-of** in the "Teams & Series" section.
4. **Choose mode**:
   - **Auto**: backend accepts incoming `/ingest` score/state updates.
   - **Manual**: backend ignores incoming auto event score updates so operator can override.
5. **Use overlay URL** in browser or OBS:
   - `http://localhost:5500/web/overlay/index.html?base=http://localhost:8000`
6. **Connect Overwolf app** (or use mock events) so normalized events flow into `/ingest`.
7. **Correct state manually when needed** from admin controls:
   - Reset match
   - Manual score changes
   - Manual series wins

### Useful API examples

Use these if you want direct API control from terminal/Postman:

```bash
# Read current state
curl http://localhost:8000/state/current

# Toggle manual mode
curl -X POST http://localhost:8000/admin/mode \
  -H "x-api-key: dev-api-key" \
  -H "Content-Type: application/json" \
  -d '{"auto_mode": false}'

# Set teams and best-of
curl -X POST http://localhost:8000/admin/set-teams \
  -H "x-api-key: dev-api-key" \
  -H "Content-Type: application/json" \
  -d '{"blue_team_name":"ISU Blue","orange_team_name":"ISU Orange","best_of":5}'
```

## 5) Mock Mode Testing

You can run v1 end-to-end without Rocket League by enabling mock mode in Overwolf runtime globals (`ISU_RL_MOCK_MODE=true`) and using `src/mockEvents.ts`.

Mock mode simulates:
- match start
- clock ticks
- score changes
- overtime
- match end + winner

## 6) OBS Setup

1. Add a **Browser Source** in OBS.
2. Point it to overlay URL:
   `http://localhost:5500/web/overlay/index.html?base=http://localhost:8000`
3. Set desired width/height (for example 1920x1080).
4. Keep background transparent.

## 7) Known Limitations (v1)

- Single active match only (no multi-match support).
- In-memory state only (no persistence/recovery).
- Overwolf Rocket League event names/payload fields are partially assumed.
- No user accounts/roles/audit logs.
- No advanced reconnect buffering or event replay.

## Rocket League Mapping Files to Adjust After Real Testing

- `overwolf-app/src/eventAdapter.ts`
- `overwolf-app/src/overwolf.ts`
- `overwolf-app/src/mockEvents.ts` (for more realistic simulation)
- Capture playbook: `overwolf-app/PAYLOAD_CAPTURE.md`

## Recommended Next Steps for v2

See detailed execution plan: `docs/V2_ROADMAP.md`.

1. Capture and catalog real Overwolf Rocket League payloads for robust mappings.
2. Add persistent storage (Redis/Postgres) and event history.
3. Add multi-match/session support (scrims/tournaments).
4. Add authenticated admin UI with operator roles.
5. Add richer overlay variants and per-scene layouts.
6. Add tests for state transitions and ingest validation.
