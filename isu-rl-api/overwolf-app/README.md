# ISU RL API - Overwolf App

Minimal Overwolf connector that listens for Rocket League events, normalizes them, and forwards to FastAPI `/ingest`.

## Notes
- Core mapping lives in `src/eventAdapter.ts`.
- Mock mode can run without Overwolf runtime for local development.
- Background window runs `dist/main.js`; debug window shows raw + normalized events.

## Development
```bash
cd overwolf-app
npm install
npm run build
```

Load this folder in Overwolf developer tools and ensure `manifest.json` is selected.

## Overwolf Event Wiring Notes
- Listener/bootstrap flow follows the same pattern as Overwolf's events sample app: register listeners, request required features, and log `games.events.getInfo` diagnostics.
- If Rocket League event names differ in your environment, capture payloads and update `src/eventAdapter.ts` + `src/overwolf.ts`.
