import enum
from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey, Date
from sqlalchemy.orm import relationship
from datetime import datetime, date
from app.database import Base

class AttendanceStatus(str, enum.Enum):
    PRESENT = "present"
    ABSENT = "absent"
    HALF_DAY = "half_day"
    LEAVE = "leave"
    OVERTIME = "overtime"

class Worker(Base):
    __tablename__ = "workers"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False)
    trade = Column(String(100), nullable=False) # e.g. Mason, Electrician, Carpenter, Welder
    phone = Column(String(50), nullable=True)
    daily_rate = Column(Float, default=0.0)
    is_active = Column(String(50), default="active")
    
    contractor_id = Column(Integer, ForeignKey("users.id"), nullable=True)

    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    contractor = relationship("User", back_populates="contractor_workers")
    attendance_records = relationship("Attendance", back_populates="worker", cascade="all, delete-orphan")


class Attendance(Base):
    __tablename__ = "attendance"

    id = Column(Integer, primary_key=True, index=True)
    worker_id = Column(Integer, ForeignKey("workers.id"), nullable=False)
    project_id = Column(Integer, ForeignKey("projects.id"), nullable=False)
    date = Column(Date, default=date.today, nullable=False)
    status = Column(String(50), default=AttendanceStatus.PRESENT.value)
    hours_worked = Column(Float, default=8.0)
    notes = Column(String(255), nullable=True)

    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    worker = relationship("Worker", back_populates="attendance_records")
    project = relationship("Project", back_populates="attendance_records")
