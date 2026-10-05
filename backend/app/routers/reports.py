from fastapi import APIRouter, Depends, HTTPException, Query, status, UploadFile, File, Form
from fastapi.responses import FileResponse, Response
from sqlalchemy.orm import Session
from datetime import date
from typing import List, Optional

from app.database import get_db
from app.models.user import User, UserRole
from app.models.project import Project
from app.models.notification_report import Report
from app.models.resource import Resource
from app.models.workforce import Worker, Attendance
from app.models.procurement import Procurement
from app.models.inventory import Inventory
from app.schemas.analytics import ReportCreate, ReportResponse
from app.schemas.document import DocumentResponse
from app.schemas.reporting import ReportResult
from app.services.documents import document_file, list_documents, remove_document, save_document
from app.services.reporting import generate_report
from app.utils.dependencies import get_current_user, require_roles

router = APIRouter(prefix="/reports", tags=["Reporting Service"])

def project_is_visible(project: Project, user: User) -> bool:
    if user.role == UserRole.ADMINISTRATOR.value: return True
    if user.role == UserRole.PROJECT_MANAGER.value: return project.manager_id == user.id
    if user.role == UserRole.CLIENT.value: return project.client_id == user.id
    return True

# ================= Reports Endpoints =================

def report_filters(
    project_id: Optional[int] = None,
    status_filter: Optional[str] = Query(None, alias="status"),
    vendor_id: Optional[int] = None,
    date_from: Optional[date] = None,
    date_to: Optional[date] = None,
):
    return {
        "project_id": project_id,
        "status": status_filter,
        "vendor_id": vendor_id,
        "date_from": date_from,
        "date_to": date_to,
    }


@router.get("/project-progress", response_model=ReportResult)
def get_project_progress_report(filters: dict = Depends(report_filters), current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    return generate_report(db, current_user, "project-progress", **filters)


@router.get("/resources", response_model=ReportResult)
def get_resource_report(filters: dict = Depends(report_filters), current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    return generate_report(db, current_user, "resources", **filters)


@router.get("/workforce", response_model=ReportResult)
def get_workforce_report(filters: dict = Depends(report_filters), current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    return generate_report(db, current_user, "workforce", **filters)


@router.get("/procurement", response_model=ReportResult)
def get_procurement_report(filters: dict = Depends(report_filters), current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    return generate_report(db, current_user, "procurement", **filters)


@router.get("/budget-cost", response_model=ReportResult)
def get_budget_cost_report(filters: dict = Depends(report_filters), current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    return generate_report(db, current_user, "budget-cost", **filters)


@router.get("/exports/{report_type}")
def export_live_report(
    report_type: str,
    format: str = Query(..., pattern="^(pdf|xlsx)$"),
    filters: dict = Depends(report_filters),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    from app.utils.report_export import export_live_report_bytes

    report = generate_report(db, current_user, report_type, **filters)
    payload, media_type, extension = export_live_report_bytes(report, format)
    filename = f"buildtrack_{report_type.replace('-', '_')}_{date.today().isoformat()}.{extension}"
    return Response(payload, media_type=media_type, headers={"Content-Disposition": f'attachment; filename="{filename}"'})

@router.get("", response_model=List[ReportResponse])
def get_reports(
    project_id: Optional[int] = None,
    report_type: Optional[str] = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    query = db.query(Report)
    if current_user.role == UserRole.PROJECT_MANAGER.value:
        query = query.join(Project).filter(Project.manager_id == current_user.id)
    elif current_user.role == UserRole.CLIENT.value:
        query = query.join(Project).filter(Project.client_id == current_user.id)
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
    if not project_is_visible(project, current_user): raise HTTPException(status_code=403, detail="Project access denied")

    if report_in.report_type not in {"budget", "progress", "resource", "procurement", "workforce", "summary"}:
        raise HTTPException(status_code=422, detail="Unsupported report type")
    common = {"project_name": project.name, "status": project.status}
    if report_in.report_type == "budget":
        report_data = {**common, "budget": project.budget or 0, "spent": project.spent_budget or 0, "remaining": max(0, (project.budget or 0) - (project.spent_budget or 0))}
    elif report_in.report_type == "progress":
        report_data = {**common, "milestones": [{"title": m.title, "status": m.status, "completion_percentage": m.completion_percentage, "due_date": m.due_date.isoformat() if m.due_date else None} for m in project.milestones]}
    elif report_in.report_type == "resource":
        report_data = {**common, "resources": [{"name": r.name, "type": r.resource_type, "status": r.status, "cost_per_hour": r.cost_per_hour} for r in db.query(Resource).filter(Resource.project_id == project.id).all()]}
    elif report_in.report_type == "procurement":
        report_data = {**common, "procurements": [{"item": p.item_name, "quantity": p.quantity, "estimated_cost": p.estimated_cost, "actual_cost": p.actual_cost, "status": p.status, "supplier": p.supplier_name} for p in db.query(Procurement).filter(Procurement.project_id == project.id).all()]}
    elif report_in.report_type == "workforce":
        report_data = {**common, "attendance_records": [{"worker_id": a.worker_id, "date": a.date.isoformat(), "status": a.status, "hours_worked": a.hours_worked} for a in db.query(Attendance).filter(Attendance.project_id == project.id).all()], "worker_count": db.query(Worker).count()}
    else:
        report_data = {**common, "budget": project.budget or 0, "spent": project.spent_budget or 0, "milestones": len(project.milestones), "resources": db.query(Resource).filter(Resource.project_id == project.id).count(), "procurements": db.query(Procurement).filter(Procurement.project_id == project.id).count(), "attendance_records": db.query(Attendance).filter(Attendance.project_id == project.id).count()}
    db_report = Report(
        project_id=report_in.project_id,
        generated_by_id=current_user.id,
        title=report_in.title,
        report_type=report_in.report_type,
        summary_notes=report_in.summary_notes,
        content_json=report_data,
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
    if not project_is_visible(report.project, current_user): raise HTTPException(status_code=403, detail="Project access denied")
    return report

# Compatibility aliases for clients using the earlier report-scoped document URLs.
@router.get("/documents/project/{project_id}", response_model=List[DocumentResponse], include_in_schema=False)
def get_project_documents(project_id: int, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    return list_documents(db, current_user, project_id)


@router.post("/documents/upload", response_model=DocumentResponse, status_code=status.HTTP_201_CREATED, include_in_schema=False)
def upload_document(project_id: int = Form(...), title: str = Form(...), category: str = Form("General"), file: UploadFile = File(...), current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    return save_document(db, current_user, project_id, title, category, file)


@router.get("/documents/{document_id}/download", include_in_schema=False)
def download_document(document_id: int, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    row, path = document_file(db, current_user, document_id)
    return FileResponse(path, media_type=row.content_type or "application/octet-stream", filename=row.original_filename)


@router.delete("/documents/{document_id}", status_code=status.HTTP_204_NO_CONTENT, include_in_schema=False)
def delete_document(document_id: int, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    remove_document(db, current_user, document_id)

@router.get("/{report_id}/export")
def export_report(report_id: int, format: str = "pdf", current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    row = db.query(Report).filter(Report.id == report_id).first()
    if not row: raise HTTPException(status_code=404, detail="Report not found")
    if not project_is_visible(row.project, current_user): raise HTTPException(status_code=403, detail="Project access denied")
    fmt = format.lower()
    if fmt not in {"pdf", "xlsx"}: raise HTTPException(status_code=422, detail="format must be pdf or xlsx")
    from app.utils.report_export import export_report_bytes
    payload, media_type, extension = export_report_bytes(row, fmt)
    return Response(payload, media_type=media_type, headers={"Content-Disposition": f'attachment; filename="report-{row.id}.{extension}"'})
