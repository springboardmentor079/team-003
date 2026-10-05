import enum
from sqlalchemy import Column, Integer, String, Text, Boolean, DateTime, ForeignKey, JSON, Index
from sqlalchemy.orm import relationship
from datetime import datetime
from app.database import Base

class NotificationType(str, enum.Enum):
    PROJECT = "project"
    TASK = "task"
    PROCUREMENT = "procurement"
    ATTENDANCE = "attendance"
    DEADLINE = "deadline"
    SYSTEM = "system"


class Notification(Base):
    __tablename__ = "notifications"
    __table_args__ = (
        Index("ix_notifications_user_read", "user_id", "is_read"),
        Index("ix_notifications_user_created", "user_id", "created_at"),
    )

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    title = Column(String(255), nullable=False)
    message = Column(Text, nullable=False)
    is_read = Column(Boolean, default=False, nullable=False, index=True)
    type = Column(String(50), default=NotificationType.SYSTEM.value, nullable=False)
    related_entity_type = Column(String(50), nullable=True)
    related_entity_id = Column(Integer, nullable=True)

    created_at = Column(DateTime, default=datetime.utcnow, nullable=False, index=True)

    # Relationships
    user = relationship("User", back_populates="notifications")


class Report(Base):
    __tablename__ = "reports"

    id = Column(Integer, primary_key=True, index=True)
    project_id = Column(Integer, ForeignKey("projects.id"), nullable=False)
    generated_by_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    title = Column(String(255), nullable=False)
    report_type = Column(String(50), nullable=False) # budget, progress, resource, procurement, summary
    content_json = Column(JSON, nullable=True)
    summary_notes = Column(Text, nullable=True)

    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    project = relationship("Project", back_populates="reports")
    generated_by = relationship("User", back_populates="generated_reports")


class Document(Base):
    __tablename__ = "documents"

    id = Column(Integer, primary_key=True, index=True)
    project_id = Column(Integer, ForeignKey("projects.id"), nullable=False)
    title = Column(String(255), nullable=False)
    category = Column(String(100), default="General") # Blueprint, Contract, Permit, Inspection
    file_path = Column(String(500), nullable=False)
    uploaded_by = Column(String(255), nullable=True)
    uploaded_by_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    original_filename = Column(String(255), nullable=True)
    content_type = Column(String(150), nullable=True)
    file_size = Column(Integer, nullable=True)

    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    project = relationship("Project", back_populates="documents")
    uploader = relationship("User", back_populates="uploaded_documents")
