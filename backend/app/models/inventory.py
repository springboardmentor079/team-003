from sqlalchemy import Column, Integer, String, Text, Float, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from datetime import datetime
from app.database import Base

class Inventory(Base):
    __tablename__ = "inventory"

    id = Column(Integer, primary_key=True, index=True)
    project_id = Column(Integer, ForeignKey("projects.id"), nullable=False)
    item_name = Column(String(255), nullable=False, index=True)
    category = Column(String(100), nullable=True) # e.g. Raw Material, Safety Gear, Hardware
    unit = Column(String(50), nullable=False) # e.g. Bags, Tons, Units, Meters
    quantity = Column(Float, default=0.0)
    min_threshold_quantity = Column(Float, default=10.0)
    unit_cost = Column(Float, default=0.0)
    supplier_name = Column(String(255), nullable=True)
    location = Column(String(255), nullable=True) # Site warehouse location

    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    project = relationship("Project", back_populates="inventory_items")
