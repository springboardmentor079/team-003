from datetime import datetime
from typing import Optional

from pydantic import BaseModel, ConfigDict, Field

from app.models.notification_report import NotificationType


class NotificationCreate(BaseModel):
    user_id: int
    title: str = Field(min_length=1, max_length=255)
    message: str = Field(min_length=1)
    type: NotificationType = NotificationType.SYSTEM
    related_entity_type: Optional[str] = Field(default=None, max_length=50)
    related_entity_id: Optional[int] = None


class NotificationResponse(BaseModel):
    id: int
    title: str
    message: str
    type: NotificationType
    is_read: bool
    related_entity_type: Optional[str] = None
    related_entity_id: Optional[int] = None
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class UnreadCountResponse(BaseModel):
    unread_count: int
