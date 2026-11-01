"""FastAPI entry point for Civic Pulse AI."""
from __future__ import annotations

import json
import sqlite3
import uuid
from contextlib import asynccontextmanager
from datetime import datetime, timedelta, timezone
from pathlib import Path
from typing import Any

from fastapi import Depends, FastAPI, HTTPException, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel

from .db import DB_PATH, db_session, get_connection, init_db
from .schemas import (
    CategoryMeta,
    DepartmentMeta,
    IssueCreate,
    IssueFilter,
    IssueRead,
    RatingCreate,
    SeedRequest,
    StatsRead,
    StatusUpdate,
)
from . import triage
from . import seed


@asynccontextmanager
async def lifespan(application: FastAPI):
    init_db()
    with db_session() as connection:
        count = connection.execute("SELECT COUNT(*) AS count FROM issues").fetchone()["count"]
    if count == 0:
        seed.seed_samples(count=100)
    uploads = Path(__file__).resolve().parents[1] / "uploads"
    uploads.mkdir(parents=True, exist_ok=True)
    yield


app = FastAPI(
    title="Civic Pulse AI API",
    description="Crowdsourced civic issue reporting, AI triage, routing, SLA tracking, and transparent resolution.",
    version="0.1.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173", "http://localhost:4173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


from fastapi import Depends


def db_dep():
    connection = get_connection()
    try:
        yield connection
    finally:
        connection.close()


def now_utc() -> datetime:
    return datetime.now(timezone.utc)


def format_dt(value: datetime) -> str:
    return value.isoformat()


def parse_dt(value: str) -> datetime:
    return datetime.fromisoformat(value)


def issue_row_to_read(row) -> dict[str, Any]:
    deadline = parse_dt(row["sla_deadline"])
    resolved = row["status"] in {"resolved", "closed", "duplicate", "merged"}
    is_overdue = (not resolved) and now_utc() > deadline
    return {
        "id": row["id"],
        "title": row["title"],
        "description": row["description"],
        "category": row["category"],
        "severity": int(row["severity"]),
        "urgency": row["urgency"],
        "department": row["department"],
        "address": row["address"],
        "latitude": float(row["latitude"]),
        "longitude": float(row["longitude"]),
        "status": row["status"],
        "reporter_name": row["reporter_name"],
        "ai_confidence": float(row["ai_confidence"]),
        "ai_reason": row["ai_reason"] or "",
        "duplicate_of": row["duplicate_of"],
        "reported_count": int(row["reported_count"]),
        "sla_hours": int(row["sla_hours"]),
        "created_at": row["created_at"],
        "updated_at": row["updated_at"],
        "sla_deadline": row["sla_deadline"],
        "is_overdue": is_overdue,
    }


@app.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok", "service": "civic-pulse-ai"}


@app.get("/issues", response_model=list[IssueRead])
def list_issues(
    status: str | None = None,
    category: str | None = None,
    min_severity: int | None = None,
    limit: int = 1000,
    connection=Depends(db_dep),
):
    query = "SELECT * FROM issues WHERE 1=1"
    args: list[Any] = []
    if status:
        statuses = [item.strip() for item in status.split(",") if item.strip()]
        placeholders = ",".join("?" for _ in statuses)
        query += f" AND status IN ({placeholders})"
        args.extend(statuses)
    if category:
        query += " AND category=?"
        args.append(category)
    if min_severity is not None:
        query += " AND severity>=?"
        args.append(min_severity)
    query += " ORDER BY created_at DESC LIMIT ?"
    args.append(max(1, min(limit, 5000)))
    rows = connection.execute(query, args).fetchall()
    return [issue_row_to_read(row) for row in rows]


@app.get("/issues/{issue_id}")
def get_issue(issue_id: str, connection=Depends(db_dep)):
    row = connection.execute("SELECT * FROM issues WHERE id=?", (issue_id,)).fetchone()
    if row is None:
        raise HTTPException(status_code=404, detail="Issue not found")
    resolutions = connection.execute(
        "SELECT * FROM resolutions WHERE issue_id=? ORDER BY created_at DESC", (issue_id,)
    ).fetchall()
    ratings = connection.execute(
        "SELECT * FROM ratings WHERE issue_id=? ORDER BY created_at DESC", (issue_id,)
    ).fetchall()
    issue = issue_row_to_read(row)
    issue["resolutions"] = [dict(item) for item in resolutions]
    issue["ratings"] = [dict(item) for item in ratings]
    return issue


@app.post("/issues", response_model=IssueRead, status_code=201)
def create_issue(payload: IssueCreate, connection=Depends(db_dep)):
    all_rows = connection.execute("SELECT * FROM issues").fetchall()
    triage_result = triage.classify(payload.description, None)

    issue_id = f"CP-{uuid.uuid4().hex[:8].upper()}"
    timestamp = format_dt(now_utc())
    sla_deadline = format_dt(now_utc() + timedelta(hours=triage_result["sla_hours"]))

    duplicate_of, similarity = triage.find_duplicate(
        all_rows,
        payload.latitude,
        payload.longitude,
        triage_result["category"],
        payload.description,
    )

    title = payload.title or triage.title_for(triage_result["category"], payload.description)
    reported_count = 1
    if duplicate_of:
        reported_count = 2

    connection.execute(
        """
        INSERT INTO issues (
            id, title, description, category, severity, urgency, department, address,
            latitude, longitude, status, reporter_name, reporter_contact,
            ai_confidence, ai_reason, duplicate_of, reported_count, sla_hours,
            created_at, updated_at, sla_deadline
        ) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)
        """,
        (
            issue_id,
            title,
            payload.description,
            triage_result["category"],
            triage_result["severity"],
            triage_result["urgency"],
            triage_result["department"],
            payload.address,
            payload.latitude,
            payload.longitude,
            "reported",
            payload.reporter_name,
            payload.reporter_contact,
            triage_result["confidence"],
            triage_result["reason"] + (f"; possible duplicate of {duplicate_of} (similarity {similarity})" if duplicate_of else ""),
            duplicate_of,
            reported_count,
            triage_result["sla_hours"],
            timestamp,
            timestamp,
            sla_deadline,
        ),
    )

    connection.execute(
        """
        INSERT INTO resolutions (issue_id, status, note, crew, created_at)
        VALUES (?, 'reported', 'Issue captured and triaged by Civic Pulse AI', 'Digital intake', ?)
        """,
        (issue_id, timestamp),
    )
    connection.commit()

    row = connection.execute("SELECT * FROM issues WHERE id=?", (issue_id,)).fetchone()
    return issue_row_to_read(row)


@app.patch("/issues/{issue_id}/status")
def update_status(issue_id: str, payload: StatusUpdate, connection=Depends(db_dep)):
    row = connection.execute("SELECT * FROM issues WHERE id=?", (issue_id,)).fetchone()
    if row is None:
        raise HTTPException(status_code=404, detail="Issue not found")

    timestamp = format_dt(now_utc())
    connection.execute(
        "UPDATE issues SET status=?, updated_at=? WHERE id=?", (payload.status, timestamp, issue_id)
    )
    connection.execute(
        """
        INSERT INTO resolutions (issue_id, status, note, evidence_url, crew, created_at)
        VALUES (?,?,?,?,?,?)
        """,
        (issue_id, payload.status, payload.note, payload.evidence_url, payload.crew, timestamp),
    )
    connection.commit()
    row = connection.execute("SELECT * FROM issues WHERE id=?", (issue_id,)).fetchone()
    return issue_row_to_read(row)


@app.post("/issues/{issue_id}/ratings")
def rate_issue(issue_id: str, payload: RatingCreate, connection=Depends(db_dep)):
    row = connection.execute("SELECT * FROM issues WHERE id=?", (issue_id,)).fetchone()
    if row is None:
        raise HTTPException(status_code=404, detail="Issue not found")
    timestamp = format_dt(now_utc())
    connection.execute(
        "INSERT INTO ratings (issue_id, score, comment, created_at) VALUES (?,?,?,?)",
        (issue_id, payload.score, payload.comment, timestamp),
    )
    connection.commit()
    return {"ok": True, "issue_id": issue_id, "score": payload.score}


@app.post("/admin/seed-reset")
def admin_seed_reset(payload: SeedRequest, connection=Depends(db_dep)):
    seed.seed_samples(clear=payload.clear, count=payload.count)
    return {"ok": True, "message": "Sample civic issues regenerated."}


@app.get("/stats", response_model=StatsRead)
def stats(connection=Depends(db_dep)):
    rows = connection.execute("SELECT * FROM issues").fetchall()
    total = len(rows)
    open_statuses = {"reported", "verified", "assigned", "in_progress", "reopened"}
    resolved_rows = [row for row in rows if row["status"] == "resolved"]
    closed_rows = [row for row in rows if row["status"] == "closed"]
    open_rows = [row for row in rows if row["status"] in open_statuses]
    now = now_utc()
    overdue = sum(
        1
        for row in open_rows
        if now > parse_dt(row["sla_deadline"])
    )

    by_category: dict[str, int] = {}
    by_severity: dict[str, int] = {}
    for row in rows:
        by_category[row["category"]] = by_category.get(row["category"], 0) + 1
        by_severity[str(row["severity"])] = by_severity.get(str(row["severity"]), 0) + 1

    ratings = connection.execute("SELECT score FROM ratings").fetchall()
    avg_rating = round(sum(item["score"] for item in ratings) / len(ratings), 2) if ratings else None

    durations = []
    for row in resolved_rows:
        resolution = connection.execute(
            """
            SELECT created_at FROM resolutions
            WHERE issue_id=? AND status='resolved' ORDER BY created_at ASC LIMIT 1
            """,
            (row["id"],),
        ).fetchone()
        if resolution:
            start = parse_dt(row["created_at"])
            end = parse_dt(resolution["created_at"])
            durations.append((end - start).total_seconds() / 3600)
    avg_resolution = round(sum(durations) / len(durations), 1) if durations else None

    # Simple city-level daily trend for the last week.
    from collections import defaultdict

    trend: dict[str, int] = defaultdict(int)
    for row in rows:
        day = row["created_at"][:10]
        trend[day] += 1
    recent_daily = [
        {"date": day, "count": count}
        for day, count in sorted(trend.items())[-7:]
    ]

    duplicates = sum(1 for row in rows if row["duplicate_of"])

    return StatsRead(
        total=total,
        open=len(open_rows),
        resolved=len(resolved_rows),
        closed=len(closed_rows),
        overdue=overdue,
        avg_resolution_hours=avg_resolution,
        avg_rating=avg_rating,
        by_category=by_category,
        by_severity=by_severity,
        recent_daily=recent_daily,
        duplicate_rate=round(duplicates / max(1, total), 3),
    )


@app.get("/meta/categories", response_model=list[CategoryMeta])
def meta_categories():
    return triage.categories_meta()


@app.get("/meta/departments", response_model=list[DepartmentMeta])
def meta_departments():
    return triage.departments_meta()


@app.post("/uploads")
async def upload_file(file: UploadFile = File(...)):
    suffix = Path(file.filename or "upload.png").suffix or ".png"
    uploads = Path(__file__).resolve().parents[1] / "uploads"
    uploads.mkdir(parents=True, exist_ok=True)
    destination = uploads / f"{uuid.uuid4().hex}{suffix}"
    data = await file.read()
    if len(data) > 10 * 1024 * 1024:
        raise HTTPException(status_code=413, detail="File is too large")
    destination.write_bytes(data)
    return {"url": f"/uploads/{destination.name}"}


uploads_directory = Path(__file__).resolve().parents[1] / "uploads"
uploads_directory.mkdir(parents=True, exist_ok=True)
app.mount("/uploads", StaticFiles(directory=str(uploads_directory)), name="uploads")
