"""Deterministic civic issue triage for the hackathon MVP.

This deliberately avoids an external LLM API. That makes the demo stable when
network credentials are unavailable, while preserving the product's AI-shaped
UX: category inference, severity scoring, department routing, duplicate hints,
and audit-friendly explanations.
"""
from __future__ import annotations

import math
import re
from datetime import datetime, timedelta
from typing import Dict, Tuple

CATEGORIES = {
    "pothole": {
        "label": "Road / pothole",
        "department": "Roads & Public Works",
        "sla_hours": 72,
        "color": "#f97316",
        "icon": "road",
        "words": [
            "pothole", "road", "crater", "crack", "asphalt", "tar", "speed breaker",
            "tyre", "wheel", "street crack", "manhole",
        ],
    },
    "garbage": {
        "label": "Garbage / waste",
        "department": "Sanitation & Waste Management",
        "sla_hours": 48,
        "color": "#22c55e",
        "icon": "trash",
        "words": [
            "garbage", "trash", "waste", "smell", "bin", "litter", "dump", "rubbish",
            "dead animal", "disposal", "sanitation",
        ],
    },
    "streetlight": {
        "label": "Streetlight",
        "department": "Public Lighting",
        "sla_hours": 48,
        "color": "#eab308",
        "icon": "lightbulb",
        "words": [
            "streetlight", "street light", "light", "lamp", "dark", "bulb", "pole",
            "lighting", "no light", "pole broken",
        ],
    },
    "water": {
        "label": "Water / leak",
        "department": "Water & Sewerage",
        "sla_hours": 24,
        "color": "#0ea5e9",
        "icon": "droplets",
        "words": [
            "water", "leak", "pipe", "flood", "sewage", "drain", "overflow",
            "water logging", "tank", "tap", "burst",
        ],
    },
    "signage": {
        "label": "Signage / traffic",
        "department": "Traffic & Signage Cell",
        "sla_hours": 96,
        "color": "#a855f7",
        "icon": "signpost",
        "words": [
            "sign", "signage", "signal", "traffic light", "crosswalk", "board",
            "direction", "missing sign",
        ],
    },
}


HIGH_RISK_TERMS = [
    "accident", "injury", "emergency", "hospital", "school", "children", "child",
    "bleed", "ambulance", "electric shock", "fire", "sinkhole", "open manhole",
]
INTENSITY_TERMS = {
    "very": 1,
    "huge": 1,
    "many": 1,
    "worst": 1,
    "dangerous": 2,
    "urgent": 2,
    "immediately": 2,
}


def _normalize(text: str) -> str:
    return re.sub(r"\s+", " ", text.strip().lower())


def _word_hits(text: str, words: list[str]) -> list[str]:
    hits = []
    for word in words:
        if " " in word:
            if word in text:
                hits.append(word)
        else:
            if re.search(rf"\b{re.escape(word)}\b", text):
                hits.append(word)
    return hits


def haversine_meters(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    radius = 6_371_000
    p1, p2 = math.radians(lat1), math.radians(lat2)
    d_phi = math.radians(lat2 - lat1)
    d_lambda = math.radians(lon2 - lon1)
    a = math.sin(d_phi / 2) ** 2 + math.cos(p1) * math.cos(p2) * math.sin(d_lambda / 2) ** 2
    return 2 * radius * math.asin(math.sqrt(a))


def classify(text: str, requested_category: str | None = None) -> dict:
    normalized = _normalize(text)
    scores: Dict[str, int] = {slug: 0 for slug in CATEGORIES}
    evidence: Dict[str, list[str]] = {slug: [] for slug in CATEGORIES}

    for slug, metadata in CATEGORIES.items():
        hits = _word_hits(normalized, metadata["words"])
        scores[slug] += len(hits)
        evidence[slug] = hits

    if requested_category in scores:
        scores[requested_category] += 1
        evidence[requested_category].append("manual category hint")

    category = max(scores, key=scores.get)
    if scores[category] == 0:
        # Prefer visually distinctive public infrastructure issues when no words match.
        category = "pothole"
        evidence[category] = ["defaulted from low-signal description"]

    base_severity = {
        "water": 4,
        "pothole": 3,
        "streetlight": 3,
        "garbage": 2,
        "signage": 2,
    }[category]

    severity = base_severity
    risk_hits = [term for term in HIGH_RISK_TERMS if term in normalized]
    severity += min(3, len(risk_hits))
    for term, weight in INTENSITY_TERMS.items():
        if re.search(rf"\b{term}\b", normalized):
            severity += weight
    severity = max(1, min(5, severity))

    if severity >= 4:
        urgency = "same day"
    elif severity == 3:
        urgency = "48 hours"
    else:
        urgency = "routine"

    metadata = CATEGORIES[category]
    confidence = 0.86
    if scores[category] >= 2:
        confidence += 0.06
    if requested_category == category:
        confidence += 0.03
    if scores[category] == 0:
        confidence = 0.62
    confidence = round(min(0.97, confidence), 2)

    reasons = []
    if evidence[category]:
        reasons.append(f"category from {', '.join(evidence[category][:4])}")
    if risk_hits:
        reasons.append(f"severity raised by {', '.join(risk_hits[:4])}")
    if len(reasons) == 0:
        reasons.append("all rules passed with no strong signal")

    return {
        "category": category,
        "category_label": metadata["label"],
        "severity": severity,
        "urgency": urgency,
        "department": metadata["department"],
        "color": metadata["color"],
        "icon": metadata["icon"],
        "sla_hours": metadata["sla_hours"],
        "confidence": confidence,
        "reason": "; ".join(reasons),
        "risk_hits": risk_hits,
        "word_hits": evidence[category],
    }


def _tokenize(text: str) -> set[str]:
    return {
        token for token in re.findall(r"[a-z0-9]{3,}", text.lower())
    }


def token_similarity(left: str, right: str) -> float:
    a, b = _tokenize(left), _tokenize(right)
    if not a and not b:
        return 1.0
    if not a or not b:
        return 0.0
    return len(a & b) / len(a | b)


def find_duplicate(rows, latitude: float, longitude: float, category: str, text: str) -> Tuple[dict | None, float]:
    candidates = []
    for row in rows:
        if row["category"] != category:
            continue
        if row["status"] in {"resolved", "closed", "duplicate"}:
            continue
        distance = haversine_meters(latitude, longitude, row["latitude"], row["longitude"])
        if distance > 150:
            continue
        similarity = token_similarity(text, f"{row['title']} {row['description']}")
        score = similarity * 0.55 + max(0, 1 - (distance / 150)) * 0.45
        if similarity >= 0.45 or score >= 0.7:
            candidates.append((score, row, similarity, distance))

    if not candidates:
        return None, 0.0

    best_score, best_row, best_similarity, best_distance = max(candidates, key=lambda item: item[0])
    evidence = min(0.99, best_score)
    return dict(best_row), round(best_similarity, 2)


def title_for(category: str, description: str) -> str:
    first = description.strip().split("\n")[0].strip()
    words = first.split()
    if len(words) <= 10:
        candidate = first
    else:
        candidate = " ".join(words[:10]) + "..."
    label = CATEGORIES[category]["label"]
    if len(candidate) < 8:
        return f"{label} issue"
    return candidate


def categories_meta() -> list[dict]:
    meta = []
    for slug, data in CATEGORIES.items():
        meta.append({
            "name": data["label"],
            "slug": slug,
            "department": data["department"],
            "default_sla_hours": data["sla_hours"],
            "color": data["color"],
            "icon": data["icon"],
        })
    return meta


def departments_meta() -> list[dict]:
    unique = {}
    for data in CATEGORIES.values():
        department = data["department"]
        unique[department] = {
            "slug": department.lower().replace(" ", "-").replace("&", "and"),
            "name": department,
            "lead": "Duty officer",
        }
    return list(unique.values())
