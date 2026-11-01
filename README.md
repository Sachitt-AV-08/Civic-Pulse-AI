# Civic Pulse AI

A sub-24-hour hackathon MVP for crowdsourced civic issue reporting, AI triage, department routing, SLA tracking, transparent public maps, resolution evidence, and citizen ratings.

## Run the backend

```bash
cd backend
python -m pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

The backend auto-seeds 100 sample issues across five wards on first startup.

Useful endpoints:

- `GET /health`
- `GET /issues`
- `POST /issues`
- `PATCH /issues/{id}/status`
- `GET /stats`
- `GET /meta/categories`
- `POST /admin/seed-reset`

## Run the frontend

```bash
cd frontend
npm install
npm run dev
```

Open `http://localhost:5173`.

Optional backend URL:

```bash
VITE_API_URL=http://localhost:8000 npm run dev
```

## 90-second demo

1. Register a normal report such as "Large pothole near school crossing, two-wheelers swerving, dangerous after rain."
2. Show that Civic Pulse AI classified it as roads, severity 4, and routed it to Roads & Public Works.
3. Open the live map and show clustered civic issues with severity colors.
4. Switch to Admin and move the issue through verified, assigned, in progress.
5. Resolve it and mark a citizen rating.
6. Open Impact to show open issues, overdue count, category mix, average resolution time, and citizen score.

## Architecture

- Frontend: React, Vite, Leaflet, Recharts
- Backend: FastAPI + SQLite
- Triage: deterministic rule-based classifier with safety/risk scoring, duplicate detection, department routing, and SLA deadlines
- No external API key is required, making the demo reliable on unstable hackathon networks
