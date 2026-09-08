from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional

from app.database import get_db
from app.models.user import User, UserRole
from app.models.project import Project, ProjectMilestone
from app.schemas.project import (
    ProjectCreate, ProjectUpdate, ProjectResponse,
    MilestoneCreate, MilestoneUpdate, MilestoneResponse
)
from app.utils.dependencies import get_current_user, require_roles

router = APIRouter(prefix="/projects", tags=["Project Management & Milestones"])

@router.get("", response_model=List[ProjectResponse])
def get_projects(
    skip: int = 0,
    limit: int = 100,
    status_filter: Optional[str] = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    query = db.query(Project)
    
    # Clients only see their own projects
    if current_user.role == UserRole.CLIENT.value:
        query = query.filter(Project.client_id == current_user.id)
    # Project Managers see projects where they are assigned manager
    elif current_user.role == UserRole.PROJECT_MANAGER.value:
        query = query.filter(Project.manager_id == current_user.id)

    if status_filter:
        query = query.filter(Project.status == status_filter)

    return query.offset(skip).limit(limit).all()

@router.post("", response_model=ProjectResponse, status_code=status.HTTP_201_CREATED)
def create_project(
    project_in: ProjectCreate,
    current_user: User = Depends(require_roles([UserRole.ADMINISTRATOR, UserRole.PROJECT_MANAGER])),
    db: Session = Depends(get_db)
):
    db_project = Project(**project_in.model_dump())
    db.add(db_project)
    db.commit()
    db.refresh(db_project)
    return db_project

@router.get("/{project_id}", response_model=ProjectResponse)
def get_project_details(
    project_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    project = db.query(Project).filter(Project.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    return project

@router.put("/{project_id}", response_model=ProjectResponse)
def update_project(
    project_id: int,
    project_in: ProjectUpdate,
    current_user: User = Depends(require_roles([UserRole.ADMINISTRATOR, UserRole.PROJECT_MANAGER])),
    db: Session = Depends(get_db)
):
    project = db.query(Project).filter(Project.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    update_data = project_in.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(project, field, value)

    db.commit()
    db.refresh(project)
    return project

@router.delete("/{project_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_project(
    project_id: int,
    current_user: User = Depends(require_roles([UserRole.ADMINISTRATOR])),
    db: Session = Depends(get_db)
):
    project = db.query(Project).filter(Project.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    db.delete(project)
    db.commit()
    return None

# ================= Milestone Sub-Routes =================

@router.get("/{project_id}/milestones", response_model=List[MilestoneResponse])
def get_project_milestones(
    project_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    return db.query(ProjectMilestone).filter(ProjectMilestone.project_id == project_id).all()

@router.post("/{project_id}/milestones", response_model=MilestoneResponse, status_code=status.HTTP_201_CREATED)
def create_milestone(
    project_id: int,
    milestone_in: MilestoneCreate,
    current_user: User = Depends(require_roles([UserRole.ADMINISTRATOR, UserRole.PROJECT_MANAGER, UserRole.SITE_ENGINEER])),
    db: Session = Depends(get_db)
):
    project = db.query(Project).filter(Project.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    db_milestone = ProjectMilestone(
        project_id=project_id,
        **milestone_in.model_dump()
    )
    db.add(db_milestone)
    db.commit()
    db.refresh(db_milestone)
    return db_milestone

@router.put("/milestones/{milestone_id}", response_model=MilestoneResponse)
def update_milestone(
    milestone_id: int,
    milestone_in: MilestoneUpdate,
    current_user: User = Depends(require_roles([UserRole.ADMINISTRATOR, UserRole.PROJECT_MANAGER, UserRole.SITE_ENGINEER])),
    db: Session = Depends(get_db)
):
    milestone = db.query(ProjectMilestone).filter(ProjectMilestone.id == milestone_id).first()
    if not milestone:
        raise HTTPException(status_code=404, detail="Milestone not found")

    update_data = milestone_in.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(milestone, field, value)

    db.commit()
    db.refresh(milestone)
    return milestone

@router.delete("/milestones/{milestone_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_milestone(
    milestone_id: int,
    current_user: User = Depends(require_roles([UserRole.ADMINISTRATOR, UserRole.PROJECT_MANAGER])),
    db: Session = Depends(get_db)
):
    milestone = db.query(ProjectMilestone).filter(ProjectMilestone.id == milestone_id).first()
    if not milestone:
        raise HTTPException(status_code=404, detail="Milestone not found")
    db.delete(milestone)
    db.commit()
    return None
