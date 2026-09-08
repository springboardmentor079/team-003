from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional

from app.database import get_db
from app.models.user import User, UserRole
from app.models.procurement import Procurement, ProcurementStatus
from app.models.notification_report import Notification
from app.schemas.procurement import ProcurementCreate, ProcurementUpdate, ProcurementResponse
from app.utils.dependencies import get_current_user, require_roles

router = APIRouter(prefix="/procurement", tags=["Procurement & Purchase Requests"])

@router.get("", response_model=List[ProcurementResponse])
def get_procurements(
    skip: int = 0,
    limit: int = 100,
    project_id: Optional[int] = None,
    status_filter: Optional[str] = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    query = db.query(Procurement)
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
    db_procurement = Procurement(
        **procurement_in.model_dump(),
        requested_by_id=current_user.id,
        status=ProcurementStatus.PENDING.value
    )
    db.add(db_procurement)
    db.commit()
    db.refresh(db_procurement)

    # Notify administrators/project managers about new request
    notif = Notification(
        user_id=current_user.id,
        title=f"Procurement Request: {db_procurement.item_name}",
        message=f"New purchase request for {db_procurement.quantity} {db_procurement.unit} of {db_procurement.item_name} submitted by {current_user.full_name}.",
        type="info"
    )
    db.add(notif)
    db.commit()

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

    procurement.status = new_status
    if actual_cost is not None:
        procurement.actual_cost = actual_cost

    db.commit()
    db.refresh(procurement)

    # Notify requester of status change
    notif = Notification(
        user_id=procurement.requested_by_id,
        title=f"Procurement Update: {procurement.item_name}",
        message=f"Your procurement request for '{procurement.item_name}' status has been updated to '{new_status}'.",
        type="info" if new_status in ["approved", "ordered", "delivered"] else "alert"
    )
    db.add(notif)
    db.commit()

    return procurement

@router.delete("/{procurement_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_procurement(
    procurement_id: int,
    current_user: User = Depends(require_roles([UserRole.ADMINISTRATOR, UserRole.PROJECT_MANAGER])),
    db: Session = Depends(get_db)
):
    procurement = db.query(Procurement).filter(Procurement.id == procurement_id).first()
    if not procurement:
        raise HTTPException(status_code=404, detail="Procurement request not found")
    db.delete(procurement)
    db.commit()
    return None
