import enum
from sqlalchemy import Column, Integer, String, Text, Float, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from datetime import datetime
from app.database import Base

class ProcurementStatus(str, enum.Enum):
    PENDING = "pending"
    APPROVED = "approved"
    REJECTED = "rejected"
    ORDERED = "ordered"
    DELIVERED = "delivered"

class Procurement(Base):
    __tablename__ = "procurements"

    id = Column(Integer, primary_key=True, index=True)
    project_id = Column(Integer, ForeignKey("projects.id"), nullable=False)
    requested_by_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    item_name = Column(String(255), nullable=False)
    quantity = Column(Float, default=1.0)
    unit = Column(String(50), default="units")
    estimated_cost = Column(Float, default=0.0)
    actual_cost = Column(Float, default=0.0)
    status = Column(String(50), default=ProcurementStatus.PENDING.value)
    supplier_name = Column(String(255), nullable=True)
    notes = Column(Text, nullable=True)

    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    project = relationship("Project", back_populates="procurements")
    requested_by = relationship("User", back_populates="procurement_requests")
