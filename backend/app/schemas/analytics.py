from pydantic import BaseModel, ConfigDict
from typing import Optional, Dict, Any, List
from datetime import datetime

class ReportCreate(BaseModel):
    project_id: int
    title: str
    report_type: str # budget, progress, resource, procurement, summary
    summary_notes: Optional[str] = None
    content_json: Optional[Dict[str, Any]] = None

class ReportResponse(BaseModel):
    id: int
    project_id: int
    generated_by_id: int
    title: str
    report_type: str
    content_json: Optional[Dict[str, Any]] = None
    summary_notes: Optional[str] = None
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)

class DocumentCreate(BaseModel):
    project_id: int
    title: str
    category: Optional[str] = "General"
    file_path: str
    uploaded_by: Optional[str] = None

class DocumentResponse(BaseModel):
    id: int
    project_id: int
    title: str
    category: str
    uploaded_by: Optional[str] = None
    uploaded_by_id: Optional[int] = None
    original_filename: Optional[str] = None
    content_type: Optional[str] = None
    file_size: Optional[int] = None
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)

# Aggregated Dashboard & Analytics Schemas
class ProjectAnalyticsSummary(BaseModel):
    project_id: int
    project_name: str
    total_budget: float
    spent_budget: float
    budget_remaining: float
    budget_utilization_percentage: float
    total_milestones: int
    completed_milestones: int
    overall_progress_percentage: float
    active_resources: int
    total_workers_today: int
    pending_procurements: int
