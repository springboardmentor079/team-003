from datetime import date, datetime

from sqlalchemy import func, or_
from sqlalchemy.orm import Session

from app.models.inventory import Inventory
from app.models.notification_report import Report
from app.models.procurement import Invoice, Procurement, PurchaseOrder, Vendor
from app.models.project import MilestoneStatus, Project, ProjectMilestone
from app.models.resource import Resource
from app.models.user import User, UserRole
from app.models.workforce import Attendance, Worker


def _distribution(rows, preferred_order=None):
    values = {str(label): float(count or 0) for label, count in rows}
    labels = [label for label in (preferred_order or []) if label in values]
    labels.extend(sorted(label for label in values if label not in labels))
    return {"labels": labels, "values": [values[label] for label in labels]}


def visible_project_ids(db: Session, user: User) -> list[int]:
    query = db.query(Project.id)
    if user.role == UserRole.PROJECT_MANAGER.value:
        query = query.filter(Project.manager_id == user.id)
    elif user.role == UserRole.CLIENT.value:
        query = query.filter(Project.client_id == user.id)
    elif user.role == UserRole.CONTRACTOR.value:
        procurement_ids = db.query(Procurement.project_id).filter(Procurement.requested_by_id == user.id)
        attendance_ids = db.query(Attendance.project_id).join(Worker).filter(Worker.contractor_id == user.id)
        query = query.filter(Project.id.in_(procurement_ids.union(attendance_ids)))
    elif user.role not in {UserRole.ADMINISTRATOR.value, UserRole.SITE_ENGINEER.value}:
        return []
    return [project_id for (project_id,) in query.all()]


def _worker_ids(db: Session, user: User, project_ids: list[int]) -> list[int]:
    query = db.query(Worker.id)
    if user.role == UserRole.CONTRACTOR.value:
        query = query.filter(Worker.contractor_id == user.id)
    elif user.role in {UserRole.PROJECT_MANAGER.value, UserRole.CLIENT.value}:
        query = query.filter(Worker.id.in_(db.query(Attendance.worker_id).filter(Attendance.project_id.in_(project_ids))))
    elif user.role not in {UserRole.ADMINISTRATOR.value, UserRole.SITE_ENGINEER.value}:
        return []
    return [worker_id for (worker_id,) in query.all()]


def build_dashboard(db: Session, user: User):
    project_ids = visible_project_ids(db, user)
    project_scope = Project.id.in_(project_ids)

    project_status_rows = db.query(Project.status, func.count(Project.id)).filter(project_scope).group_by(Project.status).all()
    project_status = {status: count for status, count in project_status_rows}
    project_progress_rows = (
        db.query(
            Project.id, Project.name, Project.status, Project.budget, Project.spent_budget,
            func.avg(ProjectMilestone.completion_percentage).label("progress"), Project.updated_at,
        )
        .outerjoin(ProjectMilestone, ProjectMilestone.project_id == Project.id)
        .filter(project_scope)
        .group_by(Project.id)
        .order_by(Project.updated_at.desc())
        .all()
    )
    progress_points = [{
        "id": row.id, "name": row.name, "status": row.status,
        "progress": round(float(row.progress), 2) if row.progress is not None else None,
        "budget": float(row.budget or 0), "spent_budget": float(row.spent_budget or 0),
    } for row in project_progress_rows]
    recorded_progress = [row["progress"] for row in progress_points if row["progress"] is not None]
    delayed_projects = db.query(func.count(func.distinct(Project.id))).outerjoin(ProjectMilestone).filter(
        project_scope,
        or_(ProjectMilestone.status == MilestoneStatus.DELAYED.value,
            (Project.end_date < datetime.utcnow()) & ~Project.status.in_(["completed", "cancelled"])),
    ).scalar() or 0

    procurement_query = db.query(Procurement).filter(Procurement.project_id.in_(project_ids))
    if user.role == UserRole.CONTRACTOR.value:
        procurement_query = procurement_query.filter(Procurement.requested_by_id == user.id)
    procurement_status_rows = procurement_query.with_entities(Procurement.status, func.count(Procurement.id)).group_by(Procurement.status).all()
    procurement_status = {status: count for status, count in procurement_status_rows}
    procurement_ids = [procurement_id for (procurement_id,) in procurement_query.with_entities(Procurement.id).all()]
    purchase_order_query = db.query(PurchaseOrder).filter(PurchaseOrder.project_id.in_(project_ids))
    if user.role == UserRole.CONTRACTOR.value:
        purchase_order_query = purchase_order_query.filter(PurchaseOrder.procurement_id.in_(procurement_ids))
    purchase_order_ids = [order_id for (order_id,) in purchase_order_query.with_entities(PurchaseOrder.id).all()]
    invoice_total = db.query(func.coalesce(func.sum(Invoice.amount), 0.0)).filter(Invoice.purchase_order_id.in_(purchase_order_ids)).scalar() or 0.0
    vendor_count = db.query(func.count(func.distinct(PurchaseOrder.vendor_id))).filter(PurchaseOrder.id.in_(purchase_order_ids)).scalar() or 0
    recent_procurement_rows = procurement_query.join(Project).with_entities(
        Procurement.id, Project.name, Procurement.item_name, Procurement.status, Procurement.created_at
    ).order_by(Procurement.created_at.desc()).limit(5).all()

    worker_ids = _worker_ids(db, user, project_ids)
    workforce_status_rows = db.query(Worker.is_active, func.count(Worker.id)).filter(Worker.id.in_(worker_ids)).group_by(Worker.is_active).all()
    workforce_status = {status: count for status, count in workforce_status_rows}
    workforce_trade_rows = db.query(Worker.trade, func.count(Worker.id)).filter(Worker.id.in_(worker_ids)).group_by(Worker.trade).order_by(func.count(Worker.id).desc()).all()
    attendance_query = db.query(Attendance.status, func.count(Attendance.id)).filter(
        Attendance.date == date.today(), Attendance.project_id.in_(project_ids), Attendance.worker_id.in_(worker_ids)
    ).group_by(Attendance.status)
    attendance_rows = attendance_query.all()
    attendance_status = {status: count for status, count in attendance_rows}

    resource_query = db.query(Resource).filter(Resource.project_id.in_(project_ids))
    resource_status_rows = resource_query.with_entities(Resource.status, func.count(Resource.id)).group_by(Resource.status).all()
    resource_status = {status: count for status, count in resource_status_rows}
    resource_type_rows = resource_query.with_entities(Resource.resource_type, func.count(Resource.id)).group_by(Resource.resource_type).all()

    budget_total, budget_spent = db.query(
        func.coalesce(func.sum(Project.budget), 0.0), func.coalesce(func.sum(Project.spent_budget), 0.0)
    ).filter(project_scope).one()
    budget_total = float(budget_total or 0); budget_spent = float(budget_spent or 0)
    low_stock = db.query(func.count(Inventory.id)).filter(
        Inventory.project_id.in_(project_ids), Inventory.quantity <= Inventory.min_threshold_quantity
    ).scalar() or 0

    administration = None
    if user.role == UserRole.ADMINISTRATOR.value:
        administration = {
            "total_users": db.query(func.count(User.id)).scalar() or 0,
            "active_users": db.query(func.count(User.id)).filter(User.is_active.is_(True)).scalar() or 0,
            "generated_reports": db.query(func.count(Report.id)).scalar() or 0,
            "vendors": db.query(func.count(Vendor.id)).scalar() or 0,
        }

    return {
        "user_role": user.role, "full_name": user.full_name, "generated_at": datetime.utcnow(),
        "projects": {
            "total": sum(project_status.values()), "active": project_status.get("in_progress", 0),
            "completed": project_status.get("completed", 0), "planned": project_status.get("planning", 0),
            "delayed": delayed_projects,
            "average_progress": round(sum(recorded_progress) / len(recorded_progress), 2) if recorded_progress else None,
        },
        "workforce": {
            "total": sum(workforce_status.values()), "active": workforce_status.get("active", 0),
            "present_today": attendance_status.get("present", 0), "absent_today": attendance_status.get("absent", 0),
        },
        "resources": {
            "total": sum(resource_status.values()), "available": resource_status.get("available", 0),
            "allocated": resource_status.get("allocated", 0), "maintenance": resource_status.get("maintenance", 0),
        },
        "procurement": {
            "total_requests": sum(procurement_status.values()), "pending": procurement_status.get("pending", 0),
            "approved": procurement_status.get("approved", 0), "rejected": procurement_status.get("rejected", 0),
            "ordered": procurement_status.get("ordered", 0), "delivered": procurement_status.get("delivered", 0),
            "completed": procurement_status.get("completed", 0), "purchase_orders": len(purchase_order_ids),
            "vendors": vendor_count,
        },
        "financial": {
            "budget_total": budget_total, "budget_spent": budget_spent,
            "budget_remaining": budget_total - budget_spent,
            "budget_utilization_percentage": round(budget_spent / budget_total * 100, 2) if budget_total else None,
            "procurement_expenditure": round(float(invoice_total), 2),
            "procurement_expenditure_source": "invoice_total",
        },
        "inventory": {"low_stock": low_stock}, "administration": administration,
        "charts": {
            "project_status": _distribution(project_status_rows, ["planning", "in_progress", "on_hold", "completed", "cancelled"]),
            "project_progress": [point for point in progress_points if point["progress"] is not None][:10],
            "procurement_status": _distribution(procurement_status_rows, ["pending", "approved", "rejected", "ordered", "delivered", "completed"]),
            "resource_status": _distribution(resource_status_rows, ["available", "allocated", "maintenance", "decommissioned"]),
            "resource_types": _distribution(resource_type_rows),
            "workforce_trades": _distribution([(trade or "Unspecified", count) for trade, count in workforce_trade_rows]),
            "attendance_today": _distribution(attendance_rows, ["present", "absent", "half_day", "leave", "overtime"]),
        },
        "recent_projects": progress_points[:5],
        "recent_procurement": [{
            "id": row.id, "project": row.name, "item": row.item_name,
            "status": row.status, "created_at": row.created_at,
        } for row in recent_procurement_rows],
    }
