from datetime import date, datetime, time
from typing import Any, Optional

from fastapi import HTTPException
from sqlalchemy.orm import Session, joinedload

from app.models.procurement import Invoice, Procurement, PurchaseOrder, Vendor
from app.models.project import Project
from app.models.resource import Resource
from app.models.user import User, UserRole
from app.models.workforce import Attendance, Worker


REPORT_TYPES = {"project-progress", "resources", "workforce", "procurement", "budget-cost"}


def _visible_projects_query(db: Session, user: User):
    if user.role not in {
        UserRole.ADMINISTRATOR.value,
        UserRole.PROJECT_MANAGER.value,
        UserRole.SITE_ENGINEER.value,
        UserRole.CONTRACTOR.value,
        UserRole.CLIENT.value,
    }:
        raise HTTPException(status_code=403, detail="Reports are not available for this role")
    query = db.query(Project)
    if user.role == UserRole.PROJECT_MANAGER.value:
        query = query.filter(Project.manager_id == user.id)
    elif user.role == UserRole.CLIENT.value:
        query = query.filter(Project.client_id == user.id)
    return query


def _visible_project_ids(db: Session, user: User) -> list[int]:
    return [row.id for row in _visible_projects_query(db, user).all()]


def _validate_filters(
    db: Session,
    user: User,
    project_id: Optional[int],
    vendor_id: Optional[int],
    date_from: Optional[date],
    date_to: Optional[date],
) -> None:
    if date_from and date_to and date_from > date_to:
        raise HTTPException(status_code=422, detail="date_from must be on or before date_to")
    if project_id is not None:
        project = db.query(Project).filter(Project.id == project_id).first()
        if not project:
            raise HTTPException(status_code=404, detail="Project not found")
        if project.id not in _visible_project_ids(db, user):
            raise HTTPException(status_code=403, detail="Project access denied")
    if vendor_id is not None and not db.query(Vendor).filter(Vendor.id == vendor_id).first():
        raise HTTPException(status_code=404, detail="Vendor not found")


def _date_bounds(date_from: Optional[date], date_to: Optional[date]):
    start = datetime.combine(date_from, time.min) if date_from else None
    end = datetime.combine(date_to, time.max) if date_to else None
    return start, end


def _result(report_type: str, filters: dict[str, Any], summary: dict[str, Any], data: list[dict[str, Any]]):
    return {
        "report_type": report_type,
        "generated_at": datetime.utcnow(),
        "filters": {key: value.isoformat() if isinstance(value, date) else value for key, value in filters.items() if value is not None},
        "summary": summary,
        "data": data,
    }


def project_progress_report(db: Session, user: User, *, project_id=None, status=None, date_from=None, date_to=None):
    _validate_filters(db, user, project_id, None, date_from, date_to)
    query = _visible_projects_query(db, user).options(joinedload(Project.manager), joinedload(Project.milestones))
    if project_id is not None:
        query = query.filter(Project.id == project_id)
    if status:
        query = query.filter(Project.status == status)
    start, end = _date_bounds(date_from, date_to)
    if start:
        query = query.filter(Project.start_date >= start)
    if end:
        query = query.filter(Project.end_date <= end)
    rows = []
    for project in query.order_by(Project.name).all():
        milestones = project.milestones
        completed = sum(m.status == "completed" for m in milestones)
        delayed = sum(m.status == "delayed" for m in milestones)
        progress = round(sum((m.completion_percentage or 0) for m in milestones) / len(milestones), 2) if milestones else None
        rows.append({
            "project_id": project.id, "project_name": project.name, "status": project.status,
            "start_date": project.start_date, "end_date": project.end_date,
            "project_manager": project.manager.full_name if project.manager else None,
            "progress_percentage": progress, "total_milestones": len(milestones),
            "completed_milestones": completed, "pending_milestones": len(milestones) - completed,
            "delayed_milestones": delayed,
        })
    return _result("project-progress", locals_filter(project_id, status, None, date_from, date_to), {
        "total_projects": len(rows), "active_projects": sum(r["status"] == "in_progress" for r in rows),
        "completed_projects": sum(r["status"] == "completed" for r in rows),
        "delayed_milestones": sum(r["delayed_milestones"] for r in rows),
    }, rows)


def resource_report(db: Session, user: User, *, project_id=None, status=None, date_from=None, date_to=None):
    _validate_filters(db, user, project_id, None, date_from, date_to)
    ids = _visible_project_ids(db, user)
    query = db.query(Resource).options(joinedload(Resource.project))
    if user.role in {UserRole.PROJECT_MANAGER.value, UserRole.CLIENT.value}:
        query = query.filter(Resource.project_id.in_(ids))
    if project_id is not None:
        query = query.filter(Resource.project_id == project_id)
    if status:
        query = query.filter(Resource.status == status)
    start, end = _date_bounds(date_from, date_to)
    if start:
        query = query.filter(Resource.created_at >= start)
    if end:
        query = query.filter(Resource.created_at <= end)
    rows = [{
        "resource_id": r.id, "resource_name": r.name, "resource_type": r.resource_type,
        "project": r.project.name if r.project else None, "status": r.status,
        "cost_per_hour": r.cost_per_hour, "serial_number": r.serial_number,
    } for r in query.order_by(Resource.name).all()]
    return _result("resources", locals_filter(project_id, status, None, date_from, date_to), {
        "total_resources": len(rows), "available": sum(r["status"] == "available" for r in rows),
        "allocated": sum(r["status"] == "allocated" for r in rows),
        "maintenance": sum(r["status"] == "maintenance" for r in rows),
    }, rows)


def workforce_report(db: Session, user: User, *, project_id=None, status=None, date_from=None, date_to=None):
    _validate_filters(db, user, project_id, None, date_from, date_to)
    ids = _visible_project_ids(db, user)
    attendance_query = db.query(Attendance).options(joinedload(Attendance.project)).filter(Attendance.project_id.in_(ids))
    if project_id is not None:
        attendance_query = attendance_query.filter(Attendance.project_id == project_id)
    if date_from:
        attendance_query = attendance_query.filter(Attendance.date >= date_from)
    if date_to:
        attendance_query = attendance_query.filter(Attendance.date <= date_to)
    attendance = attendance_query.all()
    worker_ids = {record.worker_id for record in attendance}
    worker_query = db.query(Worker)
    if user.role == UserRole.CONTRACTOR.value:
        worker_query = worker_query.filter(Worker.contractor_id == user.id)
    if project_id is not None or date_from or date_to or user.role in {UserRole.PROJECT_MANAGER.value, UserRole.CLIENT.value}:
        worker_query = worker_query.filter(Worker.id.in_(worker_ids))
    if status:
        worker_query = worker_query.filter(Worker.is_active == status)
    records_by_worker: dict[int, list[Attendance]] = {}
    for record in attendance:
        records_by_worker.setdefault(record.worker_id, []).append(record)
    rows = []
    for worker in worker_query.order_by(Worker.name).all():
        records = records_by_worker.get(worker.id, [])
        rows.append({
            "worker_id": worker.id, "worker_name": worker.name, "trade": worker.trade,
            "workforce_status": worker.is_active,
            "projects": sorted({record.project.name for record in records if record.project}),
            "attendance_records": len(records), "present": sum(r.status == "present" for r in records),
            "absent": sum(r.status == "absent" for r in records), "half_day": sum(r.status == "half_day" for r in records),
            "leave": sum(r.status == "leave" for r in records), "overtime": sum(r.status == "overtime" for r in records),
            "hours_worked": round(sum(r.hours_worked or 0 for r in records), 2),
        })
    return _result("workforce", locals_filter(project_id, status, None, date_from, date_to), {
        "total_workers": len(rows), "active_workers": sum(r["workforce_status"] == "active" for r in rows),
        "present_records": sum(r["present"] for r in rows), "absent_records": sum(r["absent"] for r in rows),
        "hours_worked": round(sum(r["hours_worked"] for r in rows), 2),
    }, rows)


def procurement_report(db: Session, user: User, *, project_id=None, vendor_id=None, status=None, date_from=None, date_to=None):
    _validate_filters(db, user, project_id, vendor_id, date_from, date_to)
    ids = _visible_project_ids(db, user)
    query = db.query(Procurement).options(joinedload(Procurement.project), joinedload(Procurement.requested_by)).filter(Procurement.project_id.in_(ids))
    if user.role == UserRole.CONTRACTOR.value:
        query = query.filter(Procurement.requested_by_id == user.id)
    if project_id is not None:
        query = query.filter(Procurement.project_id == project_id)
    if status:
        query = query.filter(Procurement.status == status)
    start, end = _date_bounds(date_from, date_to)
    if start:
        query = query.filter(Procurement.created_at >= start)
    if end:
        query = query.filter(Procurement.created_at <= end)
    procurements = query.order_by(Procurement.created_at.desc()).all()
    procurement_ids = [row.id for row in procurements]
    po_query = db.query(PurchaseOrder).options(joinedload(PurchaseOrder.vendor), joinedload(PurchaseOrder.invoices)).filter(PurchaseOrder.procurement_id.in_(procurement_ids))
    if vendor_id is not None:
        po_query = po_query.filter(PurchaseOrder.vendor_id == vendor_id)
    orders = {row.procurement_id: row for row in po_query.all()}
    if vendor_id is not None:
        procurements = [row for row in procurements if row.id in orders]
    rows = []
    for request in procurements:
        order = orders.get(request.id)
        invoices = order.invoices if order else []
        rows.append({
            "request_id": request.id, "project": request.project.name, "requester": request.requested_by.full_name,
            "item": request.item_name, "quantity": request.quantity, "unit": request.unit,
            "estimated_cost": request.estimated_cost, "actual_cost": request.actual_cost, "status": request.status,
            "supplier": order.vendor.name if order and order.vendor else request.supplier_name,
            "purchase_order": order.po_number if order else None, "po_amount": order.total_amount if order else None,
            "invoice_numbers": [invoice.invoice_number for invoice in invoices],
            "invoice_amount": round(sum(invoice.amount for invoice in invoices), 2),
            "request_date": request.created_at, "order_date": order.order_date if order else None,
        })
    return _result("procurement", locals_filter(project_id, status, vendor_id, date_from, date_to), {
        "total_requests": len(rows), "pending": sum(r["status"] == "pending" for r in rows),
        "approved": sum(r["status"] == "approved" for r in rows), "rejected": sum(r["status"] == "rejected" for r in rows),
        "completed": sum(r["status"] == "completed" for r in rows),
        "purchase_orders": sum(r["purchase_order"] is not None for r in rows),
        "estimated_cost": round(sum(r["estimated_cost"] or 0 for r in rows), 2),
        "purchase_order_cost": round(sum(r["po_amount"] or 0 for r in rows), 2),
        "invoice_cost": round(sum(r["invoice_amount"] or 0 for r in rows), 2),
    }, rows)


def budget_cost_report(db: Session, user: User, *, project_id=None, date_from=None, date_to=None):
    _validate_filters(db, user, project_id, None, date_from, date_to)
    query = _visible_projects_query(db, user)
    if project_id is not None:
        query = query.filter(Project.id == project_id)
    start, end = _date_bounds(date_from, date_to)
    if start:
        query = query.filter(Project.start_date >= start)
    if end:
        query = query.filter(Project.end_date <= end)
    projects = query.order_by(Project.name).all()
    project_ids = [project.id for project in projects]
    procurements_by_project: dict[int, list[Procurement]] = {}
    for procurement in db.query(Procurement).filter(Procurement.project_id.in_(project_ids)).all():
        procurements_by_project.setdefault(procurement.project_id, []).append(procurement)
    orders_by_project: dict[int, list[PurchaseOrder]] = {}
    orders_query = db.query(PurchaseOrder).options(joinedload(PurchaseOrder.invoices)).filter(PurchaseOrder.project_id.in_(project_ids))
    for order in orders_query.all():
        orders_by_project.setdefault(order.project_id, []).append(order)
    rows = []
    for project in projects:
        procurements = procurements_by_project.get(project.id, [])
        orders = orders_by_project.get(project.id, [])
        budget = project.budget or 0
        spent = project.spent_budget or 0
        rows.append({
            "project_id": project.id, "project_name": project.name, "planned_budget": budget,
            "recorded_spend": spent, "remaining_budget": budget - spent,
            "budget_utilization_percentage": round(spent / budget * 100, 2) if budget else None,
            "procurement_estimated_cost": round(sum(p.estimated_cost or 0 for p in procurements), 2),
            "procurement_actual_cost": round(sum(p.actual_cost or 0 for p in procurements), 2),
            "purchase_order_total": round(sum(o.total_amount or 0 for o in orders), 2),
            "invoice_total": round(sum(i.amount or 0 for o in orders for i in o.invoices), 2),
        })
    return _result("budget-cost", locals_filter(project_id, None, None, date_from, date_to), {
        "projects": len(rows), "planned_budget": round(sum(r["planned_budget"] for r in rows), 2),
        "recorded_spend": round(sum(r["recorded_spend"] for r in rows), 2),
        "remaining_budget": round(sum(r["remaining_budget"] for r in rows), 2),
        "purchase_order_total": round(sum(r["purchase_order_total"] for r in rows), 2),
        "invoice_total": round(sum(r["invoice_total"] for r in rows), 2),
    }, rows)


def locals_filter(project_id, status, vendor_id, date_from, date_to):
    return {"project_id": project_id, "status": status, "vendor_id": vendor_id, "date_from": date_from, "date_to": date_to}


def generate_report(db: Session, user: User, report_type: str, **filters):
    functions = {
        "project-progress": project_progress_report,
        "resources": resource_report,
        "workforce": workforce_report,
        "procurement": procurement_report,
        "budget-cost": budget_cost_report,
    }
    if report_type not in functions:
        raise HTTPException(status_code=404, detail="Report type not found")
    allowed_statuses = {
        "project-progress": {"planning", "in_progress", "on_hold", "completed", "cancelled"},
        "resources": {"available", "allocated", "maintenance", "decommissioned"},
        "workforce": {"active", "inactive"},
        "procurement": {"pending", "approved", "rejected", "ordered", "delivered", "completed"},
        "budget-cost": set(),
    }[report_type]
    if filters.get("status") and filters["status"] not in allowed_statuses:
        raise HTTPException(status_code=422, detail=f"Invalid status for {report_type} report")
    accepted = {
        "project-progress": {"project_id", "status", "date_from", "date_to"},
        "resources": {"project_id", "status", "date_from", "date_to"},
        "workforce": {"project_id", "status", "date_from", "date_to"},
        "procurement": {"project_id", "vendor_id", "status", "date_from", "date_to"},
        "budget-cost": {"project_id", "date_from", "date_to"},
    }[report_type]
    return functions[report_type](db, user, **{key: value for key, value in filters.items() if key in accepted})
