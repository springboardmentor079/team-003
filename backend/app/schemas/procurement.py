from pydantic import BaseModel, ConfigDict, Field
from typing import Optional
from datetime import datetime

class ProcurementBase(BaseModel):
    project_id: int
    item_name: str
    quantity: float = Field(default=1.0, gt=0)
    unit: str = "units"
    estimated_cost: Optional[float] = Field(default=0.0, ge=0)
    actual_cost: Optional[float] = Field(default=0.0, ge=0)
    supplier_name: Optional[str] = None
    notes: Optional[str] = None

class ProcurementCreate(ProcurementBase):
    pass

class ProcurementUpdate(BaseModel):
    item_name: Optional[str] = None
    quantity: Optional[float] = Field(default=None, gt=0)
    unit: Optional[str] = None
    estimated_cost: Optional[float] = Field(default=None, ge=0)
    actual_cost: Optional[float] = Field(default=None, ge=0)
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

class VendorCreate(BaseModel):
    name: str
    contact_person: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    address: Optional[str] = None
    category: Optional[str] = None
    status: str = "active"

class VendorUpdate(BaseModel):
    name: Optional[str] = None
    contact_person: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    address: Optional[str] = None
    category: Optional[str] = None
    status: Optional[str] = None

class VendorResponse(VendorCreate):
    id: int
    created_at: datetime
    updated_at: datetime
    model_config = ConfigDict(from_attributes=True)

class PurchaseOrderCreate(BaseModel):
    project_id: int
    vendor_id: int
    procurement_id: Optional[int] = None
    expected_delivery_date: Optional[datetime] = None
    total_amount: float = Field(default=0, ge=0)
    notes: Optional[str] = None

class PurchaseOrderUpdate(BaseModel):
    vendor_id: Optional[int] = None
    expected_delivery_date: Optional[datetime] = None
    total_amount: Optional[float] = Field(default=None, ge=0)
    status: Optional[str] = None
    notes: Optional[str] = None

class PurchaseOrderResponse(PurchaseOrderCreate):
    id: int
    po_number: str
    created_by_id: int
    order_date: datetime
    status: str
    created_at: datetime
    updated_at: datetime
    model_config = ConfigDict(from_attributes=True)

class InvoiceCreate(BaseModel):
    purchase_order_id: int
    invoice_number: str
    invoice_date: Optional[datetime] = None
    due_date: Optional[datetime] = None
    amount: float = Field(gt=0)
    status: str = "pending"
    notes: Optional[str] = None

class InvoiceUpdate(BaseModel):
    invoice_number: Optional[str] = None
    invoice_date: Optional[datetime] = None
    due_date: Optional[datetime] = None
    amount: Optional[float] = Field(default=None, gt=0)
    status: Optional[str] = None
    notes: Optional[str] = None

class InvoiceResponse(InvoiceCreate):
    id: int
    created_at: datetime
    updated_at: datetime
    model_config = ConfigDict(from_attributes=True)
