# Civic Pulse AI

A professional civic-operations web application for crowdsourced issue reporting, AI-assisted triage, department routing, SLA tracking, transparent resolution, and community validation.

## Stack
- Frontend: React, Vite, Tailwind CSS, Leaflet, Material Symbols, Plus Jakarta Sans
- Backend: FastAPI, SQLite, deterministic AI triage rules
- No external AI key is required for the demo

## Run the backend
```bash
cd backend
python -m pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```
On first startup it creates the database and seeds 100 realistic demo issues.

## Run the frontend
```bash
cd frontend
npm install
npm run dev
```
Open `http://localhost:5173`.

## Product experience
- Dashboard: city health KPIs, hotspot map, selected incident inspector, community signals
- Live map: filters, severity markers, SLA countdown, AI triage audit, evidence, comments, support
- Report issue: form with live AI triage preview and risk detection
- Operations queue: prioritized issues, filters, operational actions, status transitions
- Public impact: category, severity, volume, audit transparency, and duplicate metrics
- Community feed: trending issues, comments, supports, ward validation
- Alerts: critical / urgent / overdue incident intelligence
- Profile: citizen/officer demo roles and settings
- Mobile responsive: bottom navigation and adaptive tab content

## Useful endpoints
- `GET /health`
- `POST /issues`
- `GET /issues`
- `GET /issues/{id}`
- `PATCH /issues/{id}/status`
- `POST /issues/{id}/support`
- `POST /issues/{id}/comments`
- `GET /community/feed`
- `GET /triage/preview?description=...`
- `GET /stats`
- `GET /meta/categories`
- `POST /admin/seed-reset`

## Demo flow (under 2 minutes)
1. Start on Dashboard and explain open, overdue, and resolution metrics.
2. Open Live Map and select an emergency issue.
3. Show severity, SLA countdown, AI triage reason, photo evidence, support, and comments.
4. Switch to Officer role and verify / assign / start / resolve.
5. Submit a new report and show the live triage preview.
6. Open Community and show resident support.
7. Finish on Impact with category, severity, and daily volume charts.

## Design system
The UI is generated from the approved Civic Clarity Stitch design and uses:
- Plus Jakarta Sans for headings
- Inter for body and tabular data
- deep navy, cobalt action blue, amber/orange incident emphasis, semantic status colors
- rounded institutional cards and precise borders
- 44px+ touch targets and responsive navigation
