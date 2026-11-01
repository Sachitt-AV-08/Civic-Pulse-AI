"""Pydantic models used by the Civic Pulse FastAPI service."""
from __future__ import annotations

from datetime import datetime
from typing import List, Optional

from pydantic import BaseModel, Field, conint


class IssueCreate(BaseModel):
    title: Optional[str] = None
    description: str = Field(min_length=5, max_length=2000)
    address: Optional[str] = None
    latitude: float = Field(ge=-90, le=90)
    longitude: float = Field(ge=-180, le=180)
    reporter_name: Optional[str] = "Anonymous resident"
    reporter_contact: Optional[str] = None
    image_hint: Optional[str] = None


class IssueRead(BaseModel):
    id: str
    title: str
    description: str
    category: str
    severity: int
    urgency: str
    department: str
    address: Optional[str]
    latitude: float
    longitude: float
    status: str
    reporter_name: Optional[str]
    ai_confidence: float
    ai_reason: str
    duplicate_of: Optional[str]
    reported_count: int
    sla_hours: int
    created_at: str
    updated_at: str
    sla_deadline: str
    is_overdue: bool


class StatusUpdate(BaseModel):
    status: str = Field(pattern="^(verified|assigned|in_progress|resolved|closed|reopened|reported)$")
    note: Optional[str] = None
    crew: Optional[str] = None
    evidence_url: Optional[str] = None


class RatingCreate(BaseModel):
    score: conint(ge=1, le=5)
    comment: Optional[str] = None


class IssueFilter(BaseModel):
    status: Optional[List[str]] = None
    category: Optional[str] = None
    min_severity: Optional[int] = None
    limit: int = 1000


class ResolutionRead(BaseModel):
    id: int
    issue_id: str
    status: str
    note: Optional[str]
    evidence_url: Optional[str]
    crew: Optional[str]
    created_at: str


class CategoryMeta(BaseModel):
    name: str
    slug: str
    department: str
    default_sla_hours: int
    color: str
    icon: str


class DepartmentMeta(BaseModel):
    slug: str
    name: str
    lead: str


class StatsRead(BaseModel):
    total: int
    open: int
    resolved: int
    closed: int
    overdue: int
    avg_resolution_hours: Optional[float]
    avg_rating: Optional[float]
    by_category: dict
    by_severity: dict
    recent_daily: List[dict]
    duplicate_rate: float


class SeedRequest(BaseModel):
    clear: bool = True
    count: int = Field(default=100, ge=10, le=500)
