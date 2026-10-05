from typing import List

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.user import User
from app.schemas.notification import NotificationResponse, UnreadCountResponse
from app.services import notifications as notification_service
from app.utils.dependencies import get_current_user

router = APIRouter(prefix="/notifications", tags=["Notifications & System Alerts"])


@router.get("", response_model=List[NotificationResponse])
def get_current_user_notifications(
    unread_only: bool = False,
    skip: int = Query(default=0, ge=0),
    limit: int = Query(default=50, ge=1, le=100),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return notification_service.get_user_notifications(
        db, current_user.id, unread_only=unread_only, skip=skip, limit=limit
    )


@router.get("/unread-count", response_model=UnreadCountResponse)
def get_unread_count(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return {"unread_count": notification_service.get_unread_count(db, current_user.id)}


@router.patch("/read-all")
@router.put("/mark-all-read", include_in_schema=False)
def mark_all_as_read(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    updated = notification_service.mark_all_notifications_read(db, current_user.id)
    db.commit()
    return {"message": "All notifications marked as read", "updated_count": updated}


@router.patch("/{notification_id}/read", response_model=NotificationResponse)
@router.put("/{notification_id}/read", response_model=NotificationResponse, include_in_schema=False)
def mark_notification_as_read(
    notification_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    notification = notification_service.mark_notification_read(db, current_user.id, notification_id)
    if not notification:
        raise HTTPException(status_code=404, detail="Notification not found")
    db.commit()
    db.refresh(notification)
    return notification


@router.delete("/{notification_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_notification(
    notification_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if not notification_service.delete_user_notification(db, current_user.id, notification_id):
        raise HTTPException(status_code=404, detail="Notification not found")
    db.commit()
