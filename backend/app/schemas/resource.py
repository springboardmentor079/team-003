from pydantic import BaseModel, ConfigDict
from typing import Optional
from datetime import datetime

class ResourceBase(BaseModel):
    name: str
    resource_type: Optional[str] = "equipment"
    serial_number: Optional[str] = None
    cost_per_hour: Optional[float] = 0.0
    status: Optional[str] = "available"
    project_id: Optional[int] = None
    notes: Optional[str] = None

class ResourceCreate(ResourceBase):
    pass

class ResourceUpdate(BaseModel):
    name: Optional[str] = None
    resource_type: Optional[str] = None
    serial_number: Optional[str] = None
    cost_per_hour: Optional[float] = None
    status: Optional[str] = None
    project_id: Optional[int] = None
    notes: Optional[str] = None

class ResourceResponse(ResourceBase):
    id: int
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)
