from pydantic import BaseModel, ConfigDict
from typing import Optional
from datetime import datetime, date

# Worker Schemas
class WorkerBase(BaseModel):
    name: str
    trade: str
    phone: Optional[str] = None
    daily_rate: Optional[float] = 0.0
    is_active: Optional[str] = "active"
    contractor_id: Optional[int] = None

class WorkerCreate(WorkerBase):
    pass

class WorkerUpdate(BaseModel):
    name: Optional[str] = None
    trade: Optional[str] = None
    phone: Optional[str] = None
    daily_rate: Optional[float] = None
    is_active: Optional[str] = None
    contractor_id: Optional[int] = None

class WorkerResponse(WorkerBase):
    id: int
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)

# Attendance Schemas
class AttendanceBase(BaseModel):
    worker_id: int
    project_id: int
    date: date
    status: Optional[str] = "present"
    hours_worked: Optional[float] = 8.0
    notes: Optional[str] = None

class AttendanceCreate(AttendanceBase):
    pass

class AttendanceUpdate(BaseModel):
    status: Optional[str] = None
    hours_worked: Optional[float] = None
    notes: Optional[str] = None

class AttendanceResponse(AttendanceBase):
    id: int
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)
