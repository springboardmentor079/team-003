import enum
from sqlalchemy import Column, Integer, String, Text, Float, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from datetime import datetime
from app.database import Base

class ResourceStatus(str, enum.Enum):
    AVAILABLE = "available"
    ALLOCATED = "allocated"
    MAINTENANCE = "maintenance"
    DECOMMISSIONED = "decommissioned"

class ResourceType(str, enum.Enum):
    EQUIPMENT = "equipment"
    MACHINERY = "machinery"
    VEHICLE = "vehicle"
    TOOL = "tool"

class Resource(Base):
    __tablename__ = "resources"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False, index=True)
    resource_type = Column(String(50), default=ResourceType.EQUIPMENT.value)
    serial_number = Column(String(100), unique=True, nullable=True)
    cost_per_hour = Column(Float, default=0.0)
    status = Column(String(50), default=ResourceStatus.AVAILABLE.value)
    
    project_id = Column(Integer, ForeignKey("projects.id"), nullable=True)
    notes = Column(Text, nullable=True)

    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    project = relationship("Project", back_populates="resources")
