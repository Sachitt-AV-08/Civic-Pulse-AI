"""Small SQLite persistence layer.

The project intentionally uses only the Python standard library so the backend
can run in a fresh hackathon environment without installing database drivers.
"""
from __future__ import annotations

import sqlite3
from contextlib import contextmanager
from pathlib import Path

DB_PATH = Path(__file__).resolve().parents[1] / "civic_pulse.db"


SCHEMA = """
CREATE TABLE IF NOT EXISTS issues (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    category TEXT NOT NULL,
    severity INTEGER NOT NULL,
    urgency TEXT NOT NULL,
    department TEXT NOT NULL,
    address TEXT,
    latitude REAL NOT NULL,
    longitude REAL NOT NULL,
    status TEXT NOT NULL DEFAULT 'reported',
    reporter_name TEXT,
    reporter_contact TEXT,
    ai_confidence REAL NOT NULL DEFAULT 0.8,
    ai_reason TEXT,
    duplicate_of TEXT,
    reported_count INTEGER NOT NULL DEFAULT 1,
    sla_hours INTEGER NOT NULL DEFAULT 48,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    sla_deadline TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS resolutions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    issue_id TEXT NOT NULL,
    status TEXT NOT NULL,
    note TEXT,
    evidence_url TEXT,
    crew TEXT,
    created_at TEXT NOT NULL,
    FOREIGN KEY(issue_id) REFERENCES issues(id)
);

CREATE TABLE IF NOT EXISTS ratings (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    issue_id TEXT NOT NULL,
    score INTEGER NOT NULL,
    comment TEXT,
    created_at TEXT NOT NULL,
    FOREIGN KEY(issue_id) REFERENCES issues(id)
);

CREATE INDEX IF NOT EXISTS idx_issues_status ON issues(status);
CREATE INDEX IF NOT EXISTS idx_issues_category ON issues(category);
CREATE INDEX IF NOT EXISTS idx_issues_location ON issues(latitude, longitude);
"""


def get_connection() -> sqlite3.Connection:
    connection = sqlite3.connect(DB_PATH)
    connection.row_factory = sqlite3.Row
    connection.execute("PRAGMA foreign_keys = ON")
    return connection


@contextmanager
def db_session():
    connection = get_connection()
    try:
        yield connection
        connection.commit()
    finally:
        connection.close()


def init_db() -> None:
    with db_session() as connection:
        connection.executescript(SCHEMA)


def row_to_dict(row: sqlite3.Row) -> dict:
    return dict(row) if row is not None else None
