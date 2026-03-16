# ISU RL API - FastAPI Server

In-memory backend that stores one authoritative Rocket League match state.

## Run
```bash
cd server
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env
uvicorn app:app --reload --host 0.0.0.0 --port 8000
```

## Endpoints
- `POST /ingest` (API key)
- `GET /state/current`
- `WS /ws`
- `POST /admin/reset` (API key)
- `POST /admin/set-teams` (API key)
- `POST /admin/manual-score` (API key)
- `POST /admin/mode` (API key)


## Tests
```bash
cd server
python -m pytest -q
```
