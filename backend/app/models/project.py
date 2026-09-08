import enum
from sqlalchemy import Column, Integer, String, Text, Float, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from datetime import datetime
from app.database import Base

class ProjectStatus(str, enum.Enum):
    PLANNING = "planning"
    IN_PROGRESS = "in_progress"
    ON_HOLD = "on_hold"
    COMPLETED = "completed"
    CANCELLED = "cancelled"

class MilestoneStatus(str, enum.Enum):
    NOT_STARTED = "not_started"
    IN_PROGRESS = "in_progress"
    COMPLETED = "completed"
    DELAYED = "delayed"

class Project(Base):
    __tablename__ = "projects"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), index=True, nullable=False)
    description = Column(Text, nullable=True)
    location = Column(String(255), nullable=True)
    start_date = Column(DateTime, nullable=True)
    end_date = Column(DateTime, nullable=True)
    budget = Column(Float, default=0.0)
    spent_budget = Column(Float, default=0.0)
    status = Column(String(50), default=ProjectStatus.PLANNING.value)
    
    manager_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    client_id = Column(Integer, ForeignKey("users.id"), nullable=True)

    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    manager = relationship("User", back_populates="managed_projects", foreign_keys=[manager_id])
    client = relationship("User", back_populates="client_projects", foreign_keys=[client_id])
    milestones = relationship("ProjectMilestone", back_populates="project", cascade="all, delete-orphan")
    resources = relationship("Resource", back_populates="project")
    inventory_items = relationship("Inventory", back_populates="project")
    procurements = relationship("Procurement", back_populates="project")
    attendance_records = relationship("Attendance", back_populates="project")
    reports = relationship("Report", back_populates="project")
    documents = relationship("Document", back_populates="project")


class ProjectMilestone(Base):
    __tablename__ = "project_milestones"

    id = Column(Integer, primary_key=True, index=True)
    project_id = Column(Integer, ForeignKey("projects.id"), nullable=False)
    title = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    due_date = Column(DateTime, nullable=True)
    completion_percentage = Column(Float, default=0.0)
    status = Column(String(50), default=MilestoneStatus.NOT_STARTED.value)

    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    project = relationship("Project", back_populates="milestones")
