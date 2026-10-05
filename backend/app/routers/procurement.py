from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime

from app.database import get_db
from app.models.user import User, UserRole
from app.models.procurement import Procurement, ProcurementStatus, Vendor, PurchaseOrder, Invoice
from app.models.project import Project
from app.models.notification_report import NotificationType
from app.schemas.procurement import (ProcurementCreate, ProcurementUpdate, ProcurementResponse,
    VendorCreate, VendorUpdate, VendorResponse, PurchaseOrderCreate, PurchaseOrderUpdate,
    PurchaseOrderResponse, InvoiceCreate, InvoiceUpdate, InvoiceResponse)
from app.utils.dependencies import get_current_user, require_roles
from app.services.notifications import create_notification, create_notifications

router = APIRouter(prefix="/procurement", tags=["Procurement & Purchase Requests"])

def restrict_projects(query, model, user: User, db: Session):
    if user.role == UserRole.PROJECT_MANAGER.value:
        ids = [row.id for row in db.query(Project.id).filter(Project.manager_id == user.id).all()]
        return query.filter(model.project_id.in_(ids))
    if user.role == UserRole.CLIENT.value:
        ids = [row.id for row in db.query(Project.id).filter(Project.client_id == user.id).all()]
        return query.filter(model.project_id.in_(ids))
    if user.role == UserRole.CONTRACTOR.value and model is Procurement:
        return query.filter(Procurement.requested_by_id == user.id)
    return query

@router.get("/vendors", response_model=List[VendorResponse])
def list_vendors(search: Optional[str] = None, status_filter: Optional[str] = None,
                 current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    query = db.query(Vendor)
    if search:
        query = query.filter(Vendor.name.ilike(f"%{search}%"))
    if status_filter:
        query = query.filter(Vendor.status == status_filter)
    return query.order_by(Vendor.name).all()

@router.post("/vendors", response_model=VendorResponse, status_code=status.HTTP_201_CREATED)
def create_vendor(data: VendorCreate, current_user: User = Depends(require_roles([UserRole.ADMINISTRATOR, UserRole.PROJECT_MANAGER])), db: Session = Depends(get_db)):
    row = Vendor(**data.model_dump()); db.add(row); db.commit(); db.refresh(row); return row

@router.get("/vendors/{vendor_id}", response_model=VendorResponse)
def get_vendor(vendor_id: int, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    row = db.query(Vendor).filter(Vendor.id == vendor_id).first()
    if not row: raise HTTPException(status_code=404, detail="Vendor not found")
    return row

@router.put("/vendors/{vendor_id}", response_model=VendorResponse)
def update_vendor(vendor_id: int, data: VendorUpdate, current_user: User = Depends(require_roles([UserRole.ADMINISTRATOR, UserRole.PROJECT_MANAGER])), db: Session = Depends(get_db)):
    row = db.query(Vendor).filter(Vendor.id == vendor_id).first()
    if not row: raise HTTPException(status_code=404, detail="Vendor not found")
    for key, value in data.model_dump(exclude_unset=True).items(): setattr(row, key, value)
    db.commit(); db.refresh(row); return row

@router.delete("/vendors/{vendor_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_vendor(vendor_id: int, current_user: User = Depends(require_roles([UserRole.ADMINISTRATOR])), db: Session = Depends(get_db)):
    row = db.query(Vendor).filter(Vendor.id == vendor_id).first()
    if not row: raise HTTPException(status_code=404, detail="Vendor not found")
    if row.purchase_orders: raise HTTPException(status_code=409, detail="Vendor has purchase orders and cannot be deleted")
    db.delete(row); db.commit()

@router.get("/purchase-orders", response_model=List[PurchaseOrderResponse])
def list_purchase_orders(project_id: Optional[int] = None, status_filter: Optional[str] = None,
                         current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    query = restrict_projects(db.query(PurchaseOrder), PurchaseOrder, current_user, db)
    if project_id: query = query.filter(PurchaseOrder.project_id == project_id)
    if status_filter: query = query.filter(PurchaseOrder.status == status_filter)
    return query.order_by(PurchaseOrder.created_at.desc()).all()

@router.post("/purchase-orders", response_model=PurchaseOrderResponse, status_code=status.HTTP_201_CREATED)
def create_purchase_order(data: PurchaseOrderCreate, current_user: User = Depends(require_roles([UserRole.ADMINISTRATOR, UserRole.PROJECT_MANAGER])), db: Session = Depends(get_db)):
    project = db.query(Project).filter(Project.id == data.project_id).first()
    if not project: raise HTTPException(status_code=404, detail="Project not found")
    if current_user.role == UserRole.PROJECT_MANAGER.value and project.manager_id != current_user.id: raise HTTPException(status_code=403, detail="Project access denied")
    if not db.query(Vendor).filter(Vendor.id == data.vendor_id).first(): raise HTTPException(status_code=404, detail="Vendor not found")
    if data.procurement_id and not db.query(Procurement).filter(Procurement.id == data.procurement_id).first(): raise HTTPException(status_code=404, detail="Procurement request not found")
    if data.procurement_id:
        request_row = db.query(Procurement).filter(Procurement.id == data.procurement_id).first()
        if request_row.status != ProcurementStatus.APPROVED.value: raise HTTPException(status_code=409, detail="Only approved requests can become purchase orders")
        if db.query(PurchaseOrder).filter(PurchaseOrder.procurement_id == data.procurement_id).first(): raise HTTPException(status_code=409, detail="A purchase order already exists for this request")
    row = PurchaseOrder(**data.model_dump(), po_number=f"PO-{datetime.utcnow():%Y%m%d%H%M%S%f}", created_by_id=current_user.id, status="ordered")
    db.add(row)
    db.flush()
    if row.procurement_id:
        req = db.query(Procurement).filter(Procurement.id == row.procurement_id).first()
        req.status = ProcurementStatus.ORDERED.value
        create_notification(
            db,
            user_id=req.requested_by_id,
            title="Purchase Order Created",
            message=f"Purchase order {row.po_number} has been created for {req.item_name} on project {project.name}.",
            notification_type=NotificationType.PROCUREMENT,
            related_entity_type="purchase_order",
            related_entity_id=row.id,
        )
    db.commit()
    db.refresh(row)
    return row

@router.get("/purchase-orders/{order_id}", response_model=PurchaseOrderResponse)
def get_purchase_order(order_id: int, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    row = db.query(PurchaseOrder).filter(PurchaseOrder.id == order_id).first()
    if not row: raise HTTPException(status_code=404, detail="Purchase order not found")
    if current_user.role == UserRole.PROJECT_MANAGER.value and row.project.manager_id != current_user.id: raise HTTPException(status_code=403, detail="Project access denied")
    if current_user.role == UserRole.CLIENT.value and row.project.client_id != current_user.id: raise HTTPException(status_code=403, detail="Project access denied")
    return row

@router.put("/purchase-orders/{order_id}", response_model=PurchaseOrderResponse)
def update_purchase_order(order_id: int, data: PurchaseOrderUpdate, current_user: User = Depends(require_roles([UserRole.ADMINISTRATOR, UserRole.PROJECT_MANAGER])), db: Session = Depends(get_db)):
    row = db.query(PurchaseOrder).filter(PurchaseOrder.id == order_id).first()
    if not row: raise HTTPException(status_code=404, detail="Purchase order not found")
    if current_user.role == UserRole.PROJECT_MANAGER.value and row.project.manager_id != current_user.id: raise HTTPException(status_code=403, detail="Project access denied")
    changes = data.model_dump(exclude_unset=True)
    if changes.get("vendor_id") and not db.query(Vendor).filter(Vendor.id == changes["vendor_id"]).first(): raise HTTPException(status_code=404, detail="Vendor not found")
    if changes.get("status") not in (None, "draft", "approved", "ordered", "delivered", "cancelled"): raise HTTPException(status_code=422, detail="Invalid purchase order status")
    for key, value in changes.items(): setattr(row, key, value)
    db.commit(); db.refresh(row); return row

@router.get("/invoices", response_model=List[InvoiceResponse])
def list_invoices(status_filter: Optional[str] = None, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    query = db.query(Invoice).join(PurchaseOrder).join(Project)
    if current_user.role == UserRole.PROJECT_MANAGER.value: query = query.filter(Project.manager_id == current_user.id)
    elif current_user.role == UserRole.CLIENT.value: query = query.filter(Project.client_id == current_user.id)
    if status_filter: query = query.filter(Invoice.status == status_filter)
    return query.order_by(Invoice.created_at.desc()).all()

@router.post("/invoices", response_model=InvoiceResponse, status_code=status.HTTP_201_CREATED)
def create_invoice(data: InvoiceCreate, current_user: User = Depends(require_roles([UserRole.ADMINISTRATOR, UserRole.PROJECT_MANAGER])), db: Session = Depends(get_db)):
    order = db.query(PurchaseOrder).filter(PurchaseOrder.id == data.purchase_order_id).first()
    if not order: raise HTTPException(status_code=404, detail="Purchase order not found")
    if current_user.role == UserRole.PROJECT_MANAGER.value and order.project.manager_id != current_user.id: raise HTTPException(status_code=403, detail="Project access denied")
    row = Invoice(**data.model_dump()); db.add(row); db.commit(); db.refresh(row); return row

@router.get("/invoices/{invoice_id}", response_model=InvoiceResponse)
def get_invoice(invoice_id: int, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    row = db.query(Invoice).filter(Invoice.id == invoice_id).first()
    if not row: raise HTTPException(status_code=404, detail="Invoice not found")
    if current_user.role == UserRole.PROJECT_MANAGER.value and row.purchase_order.project.manager_id != current_user.id: raise HTTPException(status_code=403, detail="Project access denied")
    if current_user.role == UserRole.CLIENT.value and row.purchase_order.project.client_id != current_user.id: raise HTTPException(status_code=403, detail="Project access denied")
    return row

@router.put("/invoices/{invoice_id}", response_model=InvoiceResponse)
def update_invoice(invoice_id: int, data: InvoiceUpdate, current_user: User = Depends(require_roles([UserRole.ADMINISTRATOR, UserRole.PROJECT_MANAGER])), db: Session = Depends(get_db)):
    row = db.query(Invoice).filter(Invoice.id == invoice_id).first()
    if not row: raise HTTPException(status_code=404, detail="Invoice not found")
    if current_user.role == UserRole.PROJECT_MANAGER.value and row.purchase_order.project.manager_id != current_user.id: raise HTTPException(status_code=403, detail="Project access denied")
    changes = data.model_dump(exclude_unset=True)
    if changes.get("status") not in (None, "pending", "approved", "paid", "overdue"): raise HTTPException(status_code=422, detail="Invalid invoice status")
    for key, value in changes.items(): setattr(row, key, value)
    db.commit(); db.refresh(row); return row

@router.get("", response_model=List[ProcurementResponse])
def get_procurements(
    skip: int = 0,
    limit: int = 100,
    project_id: Optional[int] = None,
    status_filter: Optional[str] = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    query = restrict_projects(db.query(Procurement), Procurement, current_user, db)
    if project_id:
        query = query.filter(Procurement.project_id == project_id)
    if status_filter:
        query = query.filter(Procurement.status == status_filter)

    return query.offset(skip).limit(limit).all()

@router.post("", response_model=ProcurementResponse, status_code=status.HTTP_201_CREATED)
def create_procurement_request(
    procurement_in: ProcurementCreate,
    current_user: User = Depends(require_roles([UserRole.ADMINISTRATOR, UserRole.PROJECT_MANAGER, UserRole.SITE_ENGINEER, UserRole.CONTRACTOR])),
    db: Session = Depends(get_db)
):
    project = db.query(Project).filter(Project.id == procurement_in.project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    if current_user.role == UserRole.PROJECT_MANAGER.value and project.manager_id != current_user.id:
        raise HTTPException(status_code=403, detail="Project access denied")
    if current_user.role == UserRole.CLIENT.value:
        raise HTTPException(status_code=403, detail="Clients cannot submit procurement requests")
    db_procurement = Procurement(
        **procurement_in.model_dump(),
        requested_by_id=current_user.id,
        status=ProcurementStatus.PENDING.value
    )
    db.add(db_procurement)
    db.flush()

    reviewer_ids = [user.id for user in db.query(User).filter(User.is_active.is_(True), User.role == UserRole.ADMINISTRATOR.value).all()]
    if project.manager_id:
        reviewer_ids.append(project.manager_id)
    create_notifications(
        db,
        user_ids=[user_id for user_id in reviewer_ids if user_id != current_user.id],
        title="New Procurement Request",
        message=f"{current_user.full_name} submitted a request for {db_procurement.item_name} on project {project.name}.",
        notification_type=NotificationType.PROCUREMENT,
        related_entity_type="procurement_request",
        related_entity_id=db_procurement.id,
    )
    db.commit()
    db.refresh(db_procurement)

    return db_procurement

@router.put("/{procurement_id}/status", response_model=ProcurementResponse)
def update_procurement_status(
    procurement_id: int,
    new_status: str,
    actual_cost: Optional[float] = None,
    current_user: User = Depends(require_roles([UserRole.ADMINISTRATOR, UserRole.PROJECT_MANAGER])),
    db: Session = Depends(get_db)
):
    procurement = db.query(Procurement).filter(Procurement.id == procurement_id).first()
    if not procurement:
        raise HTTPException(status_code=404, detail="Procurement request not found")
    if current_user.role == UserRole.PROJECT_MANAGER.value and procurement.project.manager_id != current_user.id:
        raise HTTPException(status_code=403, detail="Project access denied")

    if new_status not in {item.value for item in ProcurementStatus}:
        raise HTTPException(status_code=422, detail="Invalid procurement status")

    transitions = {"pending": {"approved", "rejected"}, "approved": {"ordered", "rejected"}, "rejected": {"pending"}, "ordered": {"delivered", "completed"}, "delivered": {"completed"}, "completed": set()}
    changed = new_status != procurement.status
    if changed and new_status not in transitions.get(procurement.status, set()):
        raise HTTPException(status_code=409, detail=f"Cannot change procurement from {procurement.status} to {new_status}")

    previous_status = procurement.status
    procurement.status = new_status
    if actual_cost is not None:
        procurement.actual_cost = actual_cost

    if changed and new_status in {"approved", "rejected", "delivered", "completed"}:
        title = {
            "approved": "Procurement Request Approved",
            "rejected": "Procurement Request Rejected",
            "delivered": "Procurement Delivered",
            "completed": "Procurement Completed",
        }[new_status]
        create_notification(
            db,
            user_id=procurement.requested_by_id,
            title=title,
            message=f"Your procurement request for {procurement.item_name} on project {procurement.project.name} changed from {previous_status} to {new_status}.",
            notification_type=NotificationType.PROCUREMENT,
            related_entity_type="procurement_request",
            related_entity_id=procurement.id,
        )
    db.commit()
    db.refresh(procurement)

    return procurement

@router.put("/{procurement_id}", response_model=ProcurementResponse)
def update_procurement(procurement_id: int, procurement_in: ProcurementUpdate,
                        current_user: User = Depends(require_roles([UserRole.ADMINISTRATOR, UserRole.PROJECT_MANAGER, UserRole.SITE_ENGINEER, UserRole.CONTRACTOR])),
                        db: Session = Depends(get_db)):
    row = db.query(Procurement).filter(Procurement.id == procurement_id).first()
    if not row: raise HTTPException(status_code=404, detail="Procurement request not found")
    if current_user.role == UserRole.PROJECT_MANAGER.value and row.project.manager_id != current_user.id: raise HTTPException(status_code=403, detail="Project access denied")
    if current_user.role == UserRole.CONTRACTOR.value and row.requested_by_id != current_user.id:
        raise HTTPException(status_code=403, detail="Only the requester may edit this request")
    changes = procurement_in.model_dump(exclude_unset=True)
    if changes.get("status") is not None: raise HTTPException(status_code=403, detail="Use the status endpoint to approve or reject requests")
    for key, value in changes.items(): setattr(row, key, value)
    db.commit(); db.refresh(row); return row

@router.delete("/{procurement_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_procurement(
    procurement_id: int,
    current_user: User = Depends(require_roles([UserRole.ADMINISTRATOR, UserRole.PROJECT_MANAGER])),
    db: Session = Depends(get_db)
):
    procurement = db.query(Procurement).filter(Procurement.id == procurement_id).first()
    if not procurement:
        raise HTTPException(status_code=404, detail="Procurement request not found")
    if current_user.role == UserRole.PROJECT_MANAGER.value and procurement.project.manager_id != current_user.id:
        raise HTTPException(status_code=403, detail="Project access denied")
    db.delete(procurement)
    db.commit()
    return None
