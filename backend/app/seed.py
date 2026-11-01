"""Seed realistic demo data for Civic Pulse AI."""
from __future__ import annotations

import math
import random
from datetime import datetime, timedelta, timezone

from .db import db_session
from . import triage

DESCRIPTIONS = {
    "pothole": [
        "Large pothole near the bus stop. Two-wheeler riders are hitting it every evening.",
        "Road surface has cracked open after rain. Tyre damage risk for auto rickshaws.",
        "Dangerous crater at a school crossing. Children use this path daily.",
        "Pothole filling material has washed away, exposing an open manhole cover.",
    ],
    "garbage": [
        "Garbage has not been collected for four days. Smell is reaching nearby homes.",
        "Overflowing bin outside market. Stray animals are tearing bags open.",
        "Construction waste dumped near storm drain. Mosquito breeding risk.",
        "Dead animal on service lane. Need immediate sanitary pickup.",
    ],
    "streetlight": [
        "Three streetlights are dead on the main lane. Very dark after 8 PM.",
        "Pole is bent after wind damage. Bulb is broken and hanging loose.",
        "Lighting is off near hospital access road. People feel unsafe at night.",
        "No streetlight at intersection. Two near misses reported this week.",
    ],
    "water": [
        "Drinking water leak from pipe under road. Surface is ankle deep.",
        "Sewage overflow into lane. Water logging in front of houses.",
        "Burst supply line near school. Water is being wasted continuously.",
        "Tap has low pressure for three days. Families cannot fill drinking water.",
    ],
    "signage": [
        "Traffic signal missing at school zone. Vehicles are not slowing down.",
        "Road sign is twisted backwards. Drivers are taking wrong turn.",
        "No speed limit sign near hospital. Emergency vehicles delayed.",
        "Crosswalk markings have faded completely at busy junction.",
    ],
}

NEIGHBORHOODS = [
    ("Central Market Ward", 28.6139, 77.2090),
    ("Lake View Ward", 28.6220, 77.2180),
    ("Station Road Ward", 28.6055, 77.1996),
    ("University Ward", 28.6325, 77.2240),
    ("Industrial Ward", 28.5960, 77.2315),
]


def _random_point(center_lat: float, center_lon: float) -> tuple[float, float]:
    # Small roughly 3 km scatter around a ward centroid.
    angle = random.uniform(0, math.pi * 2)
    radius_deg = random.uniform(0, 0.028)
    return center_lat + (radius_deg * math.cos(angle)), center_lon + (radius_deg * math.sin(angle))


def seed_samples(clear: bool = True, count: int = 100) -> None:
    now = datetime.now(timezone.utc)
    statuses = ["reported", "verified", "assigned", "in_progress", "resolved", "closed"]
    status_weights = [0.28, 0.16, 0.14, 0.14, 0.20, 0.08]
    reporter_names = [
        "Asha Nair", "Rohit Kumar", "Maya Das", "Imran Ali", "Sita Rao",
        "Anonymous resident", "Ward volunteer", "RWA coordinator",
    ]

    with db_session() as connection:
        if clear:
            connection.execute("DELETE FROM ratings")
            connection.execute("DELETE FROM resolutions")
            connection.execute("DELETE FROM issues")

        issue_count = connection.execute("SELECT COUNT(*) AS count FROM issues").fetchone()["count"]
        target = count - issue_count
        if target <= 0:
            return

        for _ in range(target):
            category = random.choice(list(DESCRIPTIONS))
            description = random.choice(DESCRIPTIONS[category])
            ward_name, base_lat, base_lon = random.choice(NEIGHBORHOODS)
            latitude, longitude = _random_point(base_lat, base_lon)
            triage_result = triage.classify(description, category)

            created = now - timedelta(days=random.randint(0, 4), hours=random.randint(0, 23))
            status = random.choices(statuses, weights=status_weights, k=1)[0]
            if status in {"resolved", "closed"}:
                sla_hours = triage_result["sla_hours"]
                resolved_time = created + timedelta(hours=random.randint(1, sla_hours + 24))
                if resolved_time > now:
                    resolved_time = now - timedelta(hours=random.randint(1, 8))
            else:
                resolved_time = None

            issue_id = f"CP-{random.choice('ABCDEFGHJKLMNPQRSTUVWXYZ')}{random.randint(1000, 9999)}"
            # Avoid rare collisions by retrying a few times.
            tries = 0
            while connection.execute("SELECT 1 FROM issues WHERE id=?", (issue_id,)).fetchone() is not None:
                issue_id = f"CP-{random.choice('ABCDEFGHJKLMNPQRSTUVWXYZ')}{random.randint(1000, 9999)}"
                tries += 1
                if tries > 10:
                    break

            sla_deadline = created + timedelta(hours=triage_result["sla_hours"])
            updated = resolved_time if resolved_time else created + timedelta(hours=random.randint(1, 12))
            address = f"{random.randint(1, 90)} {ward_name} main lane"

            connection.execute(
                """
                INSERT INTO issues (
                    id, title, description, category, severity, urgency, department, address,
                    latitude, longitude, status, reporter_name, ai_confidence, ai_reason,
                    reported_count, sla_hours, created_at, updated_at, sla_deadline
                ) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)
                """,
                (
                    issue_id,
                    triage.title_for(category, description),
                    description,
                    triage_result["category"],
                    triage_result["severity"],
                    triage_result["urgency"],
                    triage_result["department"],
                    address,
                    latitude,
                    longitude,
                    status,
                    random.choice(reporter_names),
                    triage_result["confidence"],
                    triage_result["reason"],
                    random.choice([1, 1, 1, 2]),
                    triage_result["sla_hours"],
                    created.isoformat(),
                    updated.isoformat(),
                    sla_deadline.isoformat(),
                ),
            )

            connection.execute(
                """
                INSERT INTO resolutions (issue_id, status, note, crew, created_at)
                VALUES (?, 'reported', 'Seeded demo issue captured by Civic Pulse AI', 'Demo data', ?)
                """,
                (issue_id, created.isoformat()),
            )

            if status in {"verified", "assigned", "in_progress", "resolved", "closed"}:
                connection.execute(
                    """
                    INSERT INTO resolutions (issue_id, status, note, crew, created_at)
                    VALUES (?, 'verified', 'Field verification completed', 'Ward inspection team', ?)
                    """,
                    (issue_id, (created + timedelta(hours=random.randint(1, 6))).isoformat()),
                )
            if status in {"assigned", "in_progress", "resolved", "closed"}:
                connection.execute(
                    """
                    INSERT INTO resolutions (issue_id, status, note, crew, created_at)
                    VALUES (?, 'assigned', 'Work order generated for crew', 'Department allocator', ?)
                    """,
                    (issue_id, (created + timedelta(hours=random.randint(6, 18))).isoformat()),
                )
            if status in {"resolved", "closed"} and resolved_time:
                connection.execute(
                    """
                    INSERT INTO resolutions (issue_id, status, note, evidence_url, crew, created_at)
                    VALUES (?, 'resolved', 'Issue repaired and evidence uploaded', '/uploads/evidence-placeholder.jpg', 'Crew Alpha', ?)
                    """,
                    (issue_id, resolved_time.isoformat()),
                )
                if random.random() < 0.55:
                    connection.execute(
                        "INSERT INTO ratings (issue_id, score, comment, created_at) VALUES (?,?,?,?)",
                        (
                            issue_id,
                            random.choice([3, 4, 4, 5, 5]),
                            random.choice(["Fast response", "Clear updates", "Good work", "Resolved but took time", "Excellent service"]),
                            (resolved_time + timedelta(hours=random.randint(1, 48))).isoformat(),
                        ),
                    )
