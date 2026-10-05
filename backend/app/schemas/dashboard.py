from datetime import datetime
from typing import Optional

from pydantic import BaseModel


class Distribution(BaseModel):
    labels: list[str]
    values: list[float]


class ProjectProgressPoint(BaseModel):
    id: int
    name: str
    status: str
    progress: Optional[float]
    budget: float
    spent_budget: float


class RecentProcurement(BaseModel):
    id: int
    project: str
    item: str
    status: str
    created_at: datetime


class DashboardResponse(BaseModel):
    user_role: str
    full_name: str
    generated_at: datetime
    projects: dict
    workforce: dict
    resources: dict
    procurement: dict
    financial: dict
    inventory: dict
    administration: Optional[dict]
    charts: dict[str, Distribution | list[ProjectProgressPoint]]
    recent_projects: list[ProjectProgressPoint]
    recent_procurement: list[RecentProcurement]

