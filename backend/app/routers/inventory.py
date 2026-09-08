from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional

from app.database import get_db
from app.models.user import User, UserRole
from app.models.inventory import Inventory
from app.models.notification_report import Notification
from app.schemas.inventory import InventoryCreate, InventoryUpdate, InventoryResponse
from app.utils.dependencies import get_current_user, require_roles

router = APIRouter(prefix="/inventory", tags=["Material Inventory & Stock Monitoring"])

@router.get("", response_model=List[InventoryResponse])
def get_inventory_items(
    skip: int = 0,
    limit: int = 100,
    project_id: Optional[int] = None,
    category: Optional[str] = None,
    low_stock_only: bool = False,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    query = db.query(Inventory)
    if project_id:
        query = query.filter(Inventory.project_id == project_id)
    if category:
        query = query.filter(Inventory.category == category)
    if low_stock_only:
        query = query.filter(Inventory.quantity <= Inventory.min_threshold_quantity)

    return query.offset(skip).limit(limit).all()

@router.post("", response_model=InventoryResponse, status_code=status.HTTP_201_CREATED)
def add_inventory_item(
    inventory_in: InventoryCreate,
    current_user: User = Depends(require_roles([UserRole.ADMINISTRATOR, UserRole.PROJECT_MANAGER, UserRole.SITE_ENGINEER])),
    db: Session = Depends(get_db)
):
    db_item = Inventory(**inventory_in.model_dump())
    db.add(db_item)
    db.commit()
    db.refresh(db_item)

    # Check if created with low stock and raise alert notification
    if db_item.quantity <= db_item.min_threshold_quantity:
        notif = Notification(
            user_id=current_user.id,
            title=f"Low Stock Alert: {db_item.item_name}",
            message=f"Material '{db_item.item_name}' quantity ({db_item.quantity} {db_item.unit}) is below minimum threshold ({db_item.min_threshold_quantity} {db_item.unit}).",
            type="warning"
        )
        db.add(notif)
        db.commit()

    return db_item

@router.get("/{item_id}", response_model=InventoryResponse)
def get_inventory_item(
    item_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    item = db.query(Inventory).filter(Inventory.id == item_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Inventory item not found")
    return item

@router.put("/{item_id}", response_model=InventoryResponse)
def update_inventory_item(
    item_id: int,
    inventory_in: InventoryUpdate,
    current_user: User = Depends(require_roles([UserRole.ADMINISTRATOR, UserRole.PROJECT_MANAGER, UserRole.SITE_ENGINEER])),
    db: Session = Depends(get_db)
):
    item = db.query(Inventory).filter(Inventory.id == item_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Inventory item not found")

    update_data = inventory_in.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(item, field, value)

    db.commit()
    db.refresh(item)

    # Check for low stock threshold after update
    if item.quantity <= item.min_threshold_quantity:
        notif = Notification(
            user_id=current_user.id,
            title=f"Low Stock Alert: {item.item_name}",
            message=f"Material '{item.item_name}' quantity ({item.quantity} {item.unit}) is below minimum threshold ({item.min_threshold_quantity} {item.unit}).",
            type="warning"
        )
        db.add(notif)
        db.commit()

    return item

@router.delete("/{item_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_inventory_item(
    item_id: int,
    current_user: User = Depends(require_roles([UserRole.ADMINISTRATOR, UserRole.PROJECT_MANAGER])),
    db: Session = Depends(get_db)
):
    item = db.query(Inventory).filter(Inventory.id == item_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Inventory item not found")
    db.delete(item)
    db.commit()
    return None
