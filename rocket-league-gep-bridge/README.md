# Rocket League GEP Bridge

Production-focused Overwolf bridge app for Rocket League broadcasts. It reads live game events from Overwolf GEP, normalizes them into a stable state model, and exposes scoreboard data for OBS overlays.

## Architecture summary

- **Background controller** (`src/background/main.ts`) boots app logic, registers features, subscribes to GEP, normalizes payloads, and publishes state.
- **State store** maintains canonical model and persistence (`data/latest-state.json`).
- **Transport** exposes localhost HTTP API and scaffolds websocket push.
- **Series manager** tracks BO3/BO5/BO7 independently from RL payloads.
- **Debug window** displays health, state, events, and control buttons.
- **Overlay window** polls `/scoreboard` and renders a broadcast bar.

## Prerequisites

1. Overwolf installed.
2. Developer-whitelisted Overwolf account for unpacked extension testing (if required).
3. Rocket League installed.
4. Node.js 20+.

## Install

```bash
npm install
```

## Build

```bash
npm run build
```

Artifacts are output to `dist/` for unpacked extension loading.

## Dev watch build

```bash
npm run dev
```

## Load as unpacked extension (Overwolf)

1. Open Overwolf developer tools.
2. Choose **Load unpacked extension**.
3. Select `dist/` folder.
4. Launch Rocket League.
5. Open the debug window and verify feature registration + incoming events.

## OBS usage

Use either:
- `http://127.0.0.1:31985/scoreboard` from custom browser/JS overlay, or
- `dist/public/windows/overlay.html` as browser source in local development.

## Localhost endpoints

- `GET /health`
- `GET /state`
- `GET /scoreboard`
- `GET /events/recent`
- `POST /series/reset`
- `POST /series/format` body `{ "format": "bo3|bo5|bo7" }`
- `POST /series/win` body `{ "team": "blue|orange" }`
- `POST /series/set-names` body `{ "blueName": "...", "orangeName": "..." }`
- `POST /series/manual-score` body `{ "blueWins": 1, "orangeWins": 1 }`
- `POST /series/next-game`
- `POST /debug/clear`

## Real-game testing checklist

1. Load unpacked extension and confirm background starts.
2. Launch Rocket League and verify `setRequiredFeatures` succeeds.
3. Start a match and confirm `/state` score changes.
4. Confirm match phase and active flag during start/end.
5. On match finish, call `/series/win` (or automate later) and confirm series increments.
6. Verify OBS reads `/scoreboard` and renders expected values.
7. Reload extension mid-match and verify series persists from `config/series.json`.

## Known limitations

- WebSocket transport is scaffolded but not enabled yet.
- Exact feature payload keys may vary by Overwolf/GEP versions; normalizers are defensive but should be tuned with real captures.
- Series win auto-detection is intentionally conservative; manual control API is included for production reliability.

## Next steps for live validation

1. Capture real `onInfoUpdates2` and `onNewEvents` payloads from Rocket League sessions.
2. Tighten match-end detection and auto-award series wins only when confidence is high.
3. Enable Overwolf-native websocket push for lower-latency overlays.
4. Add small regression tests around normalizers and series logic.
