from typing import Iterable, Optional

from sqlalchemy.orm import Session

from app.models.notification_report import Notification, NotificationType


def create_notification(
    db: Session,
    *,
    user_id: int,
    title: str,
    message: str,
    notification_type: NotificationType,
    related_entity_type: Optional[str] = None,
    related_entity_id: Optional[int] = None,
) -> Notification:
    """Add a notification to the current transaction without committing it."""
    notification = Notification(
        user_id=user_id,
        title=title,
        message=message,
        type=notification_type.value,
        related_entity_type=related_entity_type,
        related_entity_id=related_entity_id,
    )
    db.add(notification)
    return notification


def create_notifications(
    db: Session,
    *,
    user_ids: Iterable[int],
    title: str,
    message: str,
    notification_type: NotificationType,
    related_entity_type: Optional[str] = None,
    related_entity_id: Optional[int] = None,
) -> None:
    for user_id in set(user_ids):
        create_notification(
            db,
            user_id=user_id,
            title=title,
            message=message,
            notification_type=notification_type,
            related_entity_type=related_entity_type,
            related_entity_id=related_entity_id,
        )


def get_user_notifications(db: Session, user_id: int, *, unread_only: bool, skip: int, limit: int):
    query = db.query(Notification).filter(Notification.user_id == user_id)
    if unread_only:
        query = query.filter(Notification.is_read.is_(False))
    return query.order_by(Notification.created_at.desc(), Notification.id.desc()).offset(skip).limit(limit).all()


def get_unread_count(db: Session, user_id: int) -> int:
    return db.query(Notification).filter(Notification.user_id == user_id, Notification.is_read.is_(False)).count()


def mark_notification_read(db: Session, user_id: int, notification_id: int):
    notification = db.query(Notification).filter(Notification.id == notification_id, Notification.user_id == user_id).first()
    if notification:
        notification.is_read = True
    return notification


def mark_all_notifications_read(db: Session, user_id: int) -> int:
    return db.query(Notification).filter(Notification.user_id == user_id, Notification.is_read.is_(False)).update({"is_read": True})


def delete_user_notification(db: Session, user_id: int, notification_id: int) -> bool:
    notification = db.query(Notification).filter(Notification.id == notification_id, Notification.user_id == user_id).first()
    if not notification:
        return False
    db.delete(notification)
    return True
