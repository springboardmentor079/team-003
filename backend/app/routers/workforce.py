from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import date

from app.database import get_db
from app.models.user import User, UserRole
from app.models.workforce import Worker, Attendance
from app.models.project import Project
from app.models.notification_report import NotificationType
from app.schemas.workforce import (
    WorkerCreate, WorkerUpdate, WorkerResponse,
    AttendanceCreate, AttendanceUpdate, AttendanceResponse
)
from app.utils.dependencies import get_current_user, require_roles
from app.services.notifications import create_notifications

router = APIRouter(prefix="/workforce", tags=["Workforce & Attendance Tracking"])

# ================= Workers Endpoints =================

@router.get("/workers", response_model=List[WorkerResponse])
def get_workers(
    skip: int = 0,
    limit: int = 100,
    trade: Optional[str] = None,
    contractor_id: Optional[int] = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    query = db.query(Worker)
    if current_user.role == UserRole.CONTRACTOR.value:
        query = query.filter(Worker.contractor_id == current_user.id)
    elif contractor_id:
        query = query.filter(Worker.contractor_id == contractor_id)

    if trade:
        query = query.filter(Worker.trade == trade)

    return query.offset(skip).limit(limit).all()

@router.post("/workers", response_model=WorkerResponse, status_code=status.HTTP_201_CREATED)
def create_worker(
    worker_in: WorkerCreate,
    current_user: User = Depends(require_roles([UserRole.ADMINISTRATOR, UserRole.PROJECT_MANAGER, UserRole.SITE_ENGINEER, UserRole.CONTRACTOR])),
    db: Session = Depends(get_db)
):
    db_worker = Worker(**worker_in.model_dump())
    if current_user.role == UserRole.CONTRACTOR.value and not db_worker.contractor_id:
        db_worker.contractor_id = current_user.id

    db.add(db_worker)
    db.commit()
    db.refresh(db_worker)
    return db_worker

@router.put("/workers/{worker_id}", response_model=WorkerResponse)
def update_worker(
    worker_id: int,
    worker_in: WorkerUpdate,
    current_user: User = Depends(require_roles([UserRole.ADMINISTRATOR, UserRole.PROJECT_MANAGER, UserRole.CONTRACTOR])),
    db: Session = Depends(get_db)
):
    worker = db.query(Worker).filter(Worker.id == worker_id).first()
    if not worker:
        raise HTTPException(status_code=404, detail="Worker not found")

    update_data = worker_in.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(worker, field, value)

    db.commit()
    db.refresh(worker)
    return worker

@router.delete("/workers/{worker_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_worker(
    worker_id: int,
    current_user: User = Depends(require_roles([UserRole.ADMINISTRATOR, UserRole.PROJECT_MANAGER])),
    db: Session = Depends(get_db)
):
    worker = db.query(Worker).filter(Worker.id == worker_id).first()
    if not worker:
        raise HTTPException(status_code=404, detail="Worker not found")
    db.delete(worker)
    db.commit()
    return None

# ================= Attendance Endpoints =================

@router.get("/attendance", response_model=List[AttendanceResponse])
def get_attendance_logs(
    skip: int = 0,
    limit: int = 100,
    project_id: Optional[int] = None,
    worker_id: Optional[int] = None,
    log_date: Optional[date] = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    query = db.query(Attendance)
    if project_id:
        query = query.filter(Attendance.project_id == project_id)
    if worker_id:
        query = query.filter(Attendance.worker_id == worker_id)
    if log_date:
        query = query.filter(Attendance.date == log_date)

    return query.offset(skip).limit(limit).all()

@router.post("/attendance", response_model=AttendanceResponse, status_code=status.HTTP_201_CREATED)
def record_attendance(
    attendance_in: AttendanceCreate,
    current_user: User = Depends(require_roles([UserRole.ADMINISTRATOR, UserRole.PROJECT_MANAGER, UserRole.SITE_ENGINEER, UserRole.CONTRACTOR])),
    db: Session = Depends(get_db)
):
    # Check if attendance already exists for worker on that date
    existing = db.query(Attendance).filter(
        Attendance.worker_id == attendance_in.worker_id,
        Attendance.date == attendance_in.date
    ).first()

    if existing:
        # Update existing record
        for field, value in attendance_in.model_dump().items():
            setattr(existing, field, value)
        saved = existing
    else:
        db_attendance = Attendance(**attendance_in.model_dump())
        db.add(db_attendance)
        db.flush()
        saved = db_attendance

    project = db.query(Project).filter(Project.id == saved.project_id).first()
    worker = db.query(Worker).filter(Worker.id == saved.worker_id).first()
    recipients = {project.manager_id if project else None, worker.contractor_id if worker else None} - {None, current_user.id}
    if saved.status in {AttendanceStatus.ABSENT.value, AttendanceStatus.LEAVE.value}:
        create_notifications(
            db,
            user_ids=recipients,
            title=f"Attendance Alert: {worker.name if worker else 'Worker'}",
            message=f"{saved.status.title()} attendance recorded for {saved.date.isoformat()} at {project.name if project else 'project'}.",
            notification_type=NotificationType.ATTENDANCE,
            related_entity_type="attendance",
            related_entity_id=saved.id,
        )
    db.commit()
    db.refresh(saved)
    return saved
