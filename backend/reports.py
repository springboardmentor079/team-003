from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional

from app.database import get_db
from app.models.user import User, UserRole
from app.models.project import Project
from app.models.notification_report import Report, Document
from app.schemas.analytics import (
    ReportCreate, ReportResponse, DocumentCreate, DocumentResponse
)
from app.utils.dependencies import get_current_user, require_roles

router = APIRouter(prefix="/reports", tags=["Reporting Service & Document Management"])

# ================= Reports Endpoints =================

@router.get("", response_model=List[ReportResponse])
def get_reports(
    project_id: Optional[int] = None,
    report_type: Optional[str] = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    query = db.query(Report)
    if project_id:
        query = query.filter(Report.project_id == project_id)
    if report_type:
        query = query.filter(Report.report_type == report_type)
    return query.order_by(Report.created_at.desc()).all()

@router.post("/generate", response_model=ReportResponse, status_code=status.HTTP_201_CREATED)
def generate_project_report(
    report_in: ReportCreate,
    current_user: User = Depends(require_roles([UserRole.ADMINISTRATOR, UserRole.PROJECT_MANAGER, UserRole.SITE_ENGINEER])),
    db: Session = Depends(get_db)
):
    project = db.query(Project).filter(Project.id == report_in.project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    db_report = Report(
        project_id=report_in.project_id,
        generated_by_id=current_user.id,
        title=report_in.title,
        report_type=report_in.report_type,
        summary_notes=report_in.summary_notes,
        content_json=report_in.content_json or {
            "project_name": project.name,
            "status": project.status,
            "budget": project.budget,
            "spent": project.spent_budget
        }
    )
    db.add(db_report)
    db.commit()
    db.refresh(db_report)
    return db_report

@router.get("/{report_id}", response_model=ReportResponse)
def get_report_by_id(
    report_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    report = db.query(Report).filter(Report.id == report_id).first()
    if not report:
        raise HTTPException(status_code=404, detail="Report not found")
    return report

# ================= Documents Endpoints =================

@router.get("/documents/project/{project_id}", response_model=List[DocumentResponse])
def get_project_documents(
    project_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    return db.query(Document).filter(Document.project_id == project_id).all()

@router.post("/documents", response_model=DocumentResponse, status_code=status.HTTP_201_CREATED)
def upload_document_record(
    doc_in: DocumentCreate,
    current_user: User = Depends(require_roles([UserRole.ADMINISTRATOR, UserRole.PROJECT_MANAGER, UserRole.SITE_ENGINEER])),
    db: Session = Depends(get_db)
):
    db_doc = Document(
        **doc_in.model_dump(),
        uploaded_by=current_user.full_name
    )
    db.add(db_doc)
    db.commit()
    db.refresh(db_doc)
    return db_doc
