import enum
from sqlalchemy import Column, Integer, String, DateTime, Boolean
from sqlalchemy.orm import relationship
from datetime import datetime
from app.database import Base

class UserRole(str, enum.Enum):
    ADMINISTRATOR = "administrator"
    PROJECT_MANAGER = "project_manager"
    SITE_ENGINEER = "site_engineer"
    CONTRACTOR = "contractor"
    CLIENT = "client"

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String(255), unique=True, index=True, nullable=False)
    hashed_password = Column(String(255), nullable=False)
    full_name = Column(String(255), nullable=False)
    phone = Column(String(50), nullable=True)
    role = Column(String(50), default=UserRole.SITE_ENGINEER.value, nullable=False)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    managed_projects = relationship("Project", back_populates="manager", foreign_keys="Project.manager_id")
    client_projects = relationship("Project", back_populates="client", foreign_keys="Project.client_id")
    contractor_workers = relationship("Worker", back_populates="contractor")
    notifications = relationship("Notification", back_populates="user")
    procurement_requests = relationship("Procurement", back_populates="requested_by")
    generated_reports = relationship("Report", back_populates="generated_by")
