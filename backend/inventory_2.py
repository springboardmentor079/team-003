from pydantic import BaseModel, ConfigDict
from typing import Optional
from datetime import datetime

class InventoryBase(BaseModel):
    project_id: int
    item_name: str
    category: Optional[str] = "General"
    unit: str
    quantity: float = 0.0
    min_threshold_quantity: Optional[float] = 10.0
    unit_cost: Optional[float] = 0.0
    supplier_name: Optional[str] = None
    location: Optional[str] = None

class InventoryCreate(InventoryBase):
    pass

class InventoryUpdate(BaseModel):
    item_name: Optional[str] = None
    category: Optional[str] = None
    unit: Optional[str] = None
    quantity: Optional[float] = None
    min_threshold_quantity: Optional[float] = None
    unit_cost: Optional[float] = None
    supplier_name: Optional[str] = None
    location: Optional[str] = None

class InventoryResponse(InventoryBase):
    id: int
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)
