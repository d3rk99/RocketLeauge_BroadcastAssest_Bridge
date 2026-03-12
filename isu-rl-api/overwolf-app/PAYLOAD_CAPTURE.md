# Rocket League Payload Capture Guide (v1 -> v2)

Use this process to capture **real Overwolf Rocket League payloads** and catalog mappings before hardening `eventAdapter.ts`.

## Why
The v1 adapter uses assumptions. Real payload captures are required for robust production mappings.

## Capture Steps
1. Build and load the Overwolf app in dev mode.
2. Open the `debug` window from Overwolf dev tools.
3. Start Rocket League and trigger representative scenarios:
   - kickoff/match start
   - goals (normal + overtime)
   - replay transitions
   - match end with winner
4. Copy raw event JSON from debug output and store in your payload catalog.

## Payload Catalog Template
Create `payload-catalog/YYYY-MM-DD-session.md` and group by event name.

```md
## goal
- observed_on: 2026-03-12
- notes: ranked 3v3 private lobby
- raw:
```json
{ "name": "goal", "data": { "blue_score": "1", "orange_score": "0", "clock": "4:31" } }
```
- normalized_target:
```json
{ "event_type": "goal", "payload": { "blue_score": 1, "orange_score": 0, "clock": "4:31" } }
```
```

## Files to update after capture
- `src/eventAdapter.ts`
- `src/overwolf.ts`
- `src/mockEvents.ts`
