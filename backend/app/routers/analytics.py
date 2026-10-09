from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import Dict, Any, List
from datetime import date

from app.database import get_db
from app.models.user import User, UserRole
from app.models.project import Project, ProjectMilestone, MilestoneStatus
from app.models.resource import Resource, ResourceStatus
from app.models.inventory import Inventory
from app.models.workforce import Worker, Attendance, AttendanceStatus
from app.models.procurement import Procurement, ProcurementStatus
from app.schemas.analytics import ProjectAnalyticsSummary
from app.schemas.dashboard import DashboardResponse
from app.services.dashboard import build_dashboard, visible_project_ids
from app.utils.dependencies import get_current_user

router = APIRouter(prefix="/analytics", tags=["Real-time Analytics & Dashboards"])

@router.get("/project/{project_id}", response_model=ProjectAnalyticsSummary)
def get_project_analytics(
    project_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    project = db.query(Project).filter(Project.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    if project.id not in visible_project_ids(db, current_user):
        raise HTTPException(status_code=403, detail="Project access denied")

    # Milestone stats
    milestones = db.query(ProjectMilestone).filter(ProjectMilestone.project_id == project_id).all()
    total_milestones = len(milestones)
    completed_milestones = sum(1 for m in milestones if m.status == MilestoneStatus.COMPLETED.value)
    
    if total_milestones > 0:
        progress_pct = sum(m.completion_percentage for m in milestones) / total_milestones
    else:
        progress_pct = 0.0

    # Budget stats
    spent = project.spent_budget or 0.0
    budget = project.budget or 0.0
    remaining = max(0.0, budget - spent)
    utilization_pct = (spent / budget * 100) if budget > 0 else 0.0

    # Resources count
    active_resources = db.query(Resource).filter(
        Resource.project_id == project_id,
        Resource.status == ResourceStatus.ALLOCATED.value
    ).count()

    # Worker attendance today
    today_workers = db.query(Attendance).filter(
        Attendance.project_id == project_id,
        Attendance.date == date.today(),
        Attendance.status != AttendanceStatus.ABSENT.value
    ).count()

    # Pending procurements
    pending_procurements = db.query(Procurement).filter(
        Procurement.project_id == project_id,
        Procurement.status == ProcurementStatus.PENDING.value
    ).count()

    return {
        "project_id": project.id,
        "project_name": project.name,
        "total_budget": budget,
        "spent_budget": spent,
        "budget_remaining": remaining,
        "budget_utilization_percentage": round(utilization_pct, 2),
        "total_milestones": total_milestones,
        "completed_milestones": completed_milestones,
        "overall_progress_percentage": round(progress_pct, 2),
        "active_resources": active_resources,
        "total_workers_today": today_workers,
        "pending_procurements": pending_procurements
    }

@router.get("/dashboard/role-summary", response_model=DashboardResponse)
def get_role_dashboard_summary(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    return build_dashboard(db, current_user)
