from pydantic import BaseModel, ConfigDict
from typing import Optional, List
from datetime import datetime

# Milestone Schemas
class MilestoneBase(BaseModel):
    title: str
    description: Optional[str] = None
    due_date: Optional[datetime] = None
    completion_percentage: Optional[float] = 0.0
    status: Optional[str] = "not_started"

class MilestoneCreate(MilestoneBase):
    pass

class MilestoneUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    due_date: Optional[datetime] = None
    completion_percentage: Optional[float] = None
    status: Optional[str] = None

class MilestoneResponse(MilestoneBase):
    id: int
    project_id: int
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)

# Project Schemas
class ProjectBase(BaseModel):
    name: str
    description: Optional[str] = None
    location: Optional[str] = None
    start_date: Optional[datetime] = None
    end_date: Optional[datetime] = None
    budget: Optional[float] = 0.0
    spent_budget: Optional[float] = 0.0
    status: Optional[str] = "planning"
    manager_id: Optional[int] = None
    client_id: Optional[int] = None

class ProjectCreate(ProjectBase):
    pass

class ProjectUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    location: Optional[str] = None
    start_date: Optional[datetime] = None
    end_date: Optional[datetime] = None
    budget: Optional[float] = None
    spent_budget: Optional[float] = None
    status: Optional[str] = None
    manager_id: Optional[int] = None
    client_id: Optional[int] = None

class ProjectResponse(ProjectBase):
    id: int
    created_at: datetime
    updated_at: datetime
    milestones: List[MilestoneResponse] = []

    model_config = ConfigDict(from_attributes=True)
