from pydantic import BaseModel, ConfigDict
from typing import Optional
from datetime import datetime

class ProcurementBase(BaseModel):
    project_id: int
    item_name: str
    quantity: float = 1.0
    unit: str = "units"
    estimated_cost: Optional[float] = 0.0
    actual_cost: Optional[float] = 0.0
    supplier_name: Optional[str] = None
    notes: Optional[str] = None

class ProcurementCreate(ProcurementBase):
    pass

class ProcurementUpdate(BaseModel):
    item_name: Optional[str] = None
    quantity: Optional[float] = None
    unit: Optional[str] = None
    estimated_cost: Optional[float] = None
    actual_cost: Optional[float] = None
    status: Optional[str] = None
    supplier_name: Optional[str] = None
    notes: Optional[str] = None

class ProcurementResponse(ProcurementBase):
    id: int
    requested_by_id: int
    status: str
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)
