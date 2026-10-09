from pathlib import Path
from uuid import uuid4
from zipfile import BadZipFile, ZipFile

from fastapi import HTTPException, UploadFile
from sqlalchemy.orm import Session, joinedload

from app.config import settings
from app.models.notification_report import Document
from app.models.project import Project
from app.models.user import User, UserRole
from app.services.dashboard import visible_project_ids


ALLOWED_EXTENSIONS = {".pdf", ".doc", ".docx", ".xls", ".xlsx", ".csv", ".png", ".jpg", ".jpeg"}
MAX_UPLOAD_BYTES = settings.MAX_UPLOAD_SIZE_MB * 1024 * 1024
UPLOAD_DIR = Path(settings.UPLOAD_DIR)
if not UPLOAD_DIR.is_absolute():
    UPLOAD_DIR = (Path(__file__).resolve().parents[2] / UPLOAD_DIR).resolve()
else:
    UPLOAD_DIR = UPLOAD_DIR.resolve()


def _project(db: Session, project_id: int, user: User) -> Project:
    project = db.query(Project).filter(Project.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    if project.id not in visible_project_ids(db, user):
        raise HTTPException(status_code=403, detail="Project access denied")
    return project


def _document(db: Session, document_id: int, user: User) -> Document:
    row = db.query(Document).options(joinedload(Document.project)).filter(
        Document.id == document_id,
        Document.original_filename.is_not(None),
        Document.uploaded_by_id.is_not(None),
        Document.file_size.is_not(None),
    ).first()
    if not row:
        raise HTTPException(status_code=404, detail="Document not found")
    if row.project_id not in visible_project_ids(db, user):
        raise HTTPException(status_code=403, detail="Document access denied")
    return row


def _stored_path(row: Document) -> Path:
    raw_path = Path(row.file_path or "")
    if not raw_path.name:
        raise HTTPException(status_code=404, detail="Document file not found")
    path = raw_path.resolve() if raw_path.is_absolute() else (UPLOAD_DIR / raw_path).resolve()
    try:
        path.relative_to(UPLOAD_DIR)
    except ValueError:
        raise HTTPException(status_code=404, detail="Document file not found")
    return path


def _validate_file_content(path: Path, extension: str) -> None:
    header = path.read_bytes()[:16]
    if extension == ".pdf" and not header.startswith(b"%PDF-"):
        raise HTTPException(status_code=422, detail="File content does not match the PDF extension")
    if extension == ".png" and not header.startswith(b"\x89PNG\r\n\x1a\n"):
        raise HTTPException(status_code=422, detail="File content does not match the PNG extension")
    if extension in {".jpg", ".jpeg"} and not header.startswith(b"\xff\xd8\xff"):
        raise HTTPException(status_code=422, detail="File content does not match the JPEG extension")
    if extension in {".doc", ".xls"} and not header.startswith(b"\xd0\xcf\x11\xe0\xa1\xb1\x1a\xe1"):
        raise HTTPException(status_code=422, detail="File content does not match the Office extension")
    if extension in {".docx", ".xlsx"}:
        try:
            with ZipFile(path) as archive:
                names = set(archive.namelist())
                required_prefix = "word/" if extension == ".docx" else "xl/"
                if "[Content_Types].xml" not in names or not any(name.startswith(required_prefix) for name in names):
                    raise HTTPException(status_code=422, detail="File content does not match the Office extension")
        except BadZipFile:
            raise HTTPException(status_code=422, detail="File content does not match the Office extension")
    if extension == ".csv":
        sample = path.read_bytes()[:8192]
        try:
            sample.decode("utf-8-sig")
        except UnicodeDecodeError:
            raise HTTPException(status_code=422, detail="CSV files must use UTF-8 text")
        if b"\x00" in sample:
            raise HTTPException(status_code=422, detail="File content does not match the CSV extension")


def list_documents(db: Session, user: User, project_id: int | None = None):
    visible_ids = visible_project_ids(db, user)
    if project_id is not None:
        _project(db, project_id, user)
        visible_ids = [project_id]
    return (
        db.query(Document)
        .options(joinedload(Document.uploader))
        .filter(
            Document.project_id.in_(visible_ids),
            Document.original_filename.is_not(None),
            Document.uploaded_by_id.is_not(None),
            Document.file_size.is_not(None),
        )
        .order_by(Document.created_at.desc())
        .all()
    )


def get_document(db: Session, user: User, document_id: int):
    return _document(db, document_id, user)


def save_document(db: Session, user: User, project_id: int, title: str, category: str, upload: UploadFile):
    if user.role not in {
        UserRole.ADMINISTRATOR.value, UserRole.PROJECT_MANAGER.value,
        UserRole.SITE_ENGINEER.value, UserRole.CONTRACTOR.value,
    }:
        raise HTTPException(status_code=403, detail="This role cannot upload documents")
    _project(db, project_id, user)
    original_name = (upload.filename or "").replace("\\", "/").split("/")[-1][:255]
    extension = Path(original_name).suffix.lower()
    if not original_name or extension not in ALLOWED_EXTENSIONS:
        raise HTTPException(status_code=422, detail="File type is not allowed")
    clean_title = title.strip()
    if not clean_title:
        raise HTTPException(status_code=422, detail="Document title is required")
    stored_name = f"{uuid4().hex}{extension}"
    UPLOAD_DIR.mkdir(parents=True, exist_ok=True)
    temporary = UPLOAD_DIR / f".{stored_name}.uploading"
    target = UPLOAD_DIR / stored_name
    size = 0
    try:
        with temporary.open("xb") as destination:
            while chunk := upload.file.read(1024 * 1024):
                size += len(chunk)
                if size > MAX_UPLOAD_BYTES:
                    raise HTTPException(status_code=413, detail=f"File exceeds {settings.MAX_UPLOAD_SIZE_MB} MB limit")
                destination.write(chunk)
        if size == 0:
            raise HTTPException(status_code=422, detail="Empty files are not allowed")
        _validate_file_content(temporary, extension)
        temporary.replace(target)
        row = Document(
            project_id=project_id, title=clean_title[:255], category=(category.strip() or "General")[:100],
            file_path=stored_name, uploaded_by=user.full_name, uploaded_by_id=user.id,
            original_filename=original_name, content_type=upload.content_type, file_size=size,
        )
        db.add(row); db.commit(); db.refresh(row)
        return row
    except Exception:
        db.rollback(); temporary.unlink(missing_ok=True); target.unlink(missing_ok=True)
        raise
    finally:
        upload.file.close()


def document_file(db: Session, user: User, document_id: int):
    row = _document(db, document_id, user)
    path = _stored_path(row)
    if not path.is_file():
        raise HTTPException(status_code=404, detail="Document file not found")
    return row, path


def remove_document(db: Session, user: User, document_id: int):
    row = _document(db, document_id, user)
    can_delete = (
        user.role == UserRole.ADMINISTRATOR.value
        or row.uploaded_by_id == user.id
        or (user.role == UserRole.PROJECT_MANAGER.value and row.project.manager_id == user.id)
    )
    if not can_delete:
        raise HTTPException(status_code=403, detail="Only the uploader, project manager, or administrator may delete this document")
    try:
        path = _stored_path(row)
    except HTTPException:
        path = None
    staged = None
    if path and path.is_file():
        staged = UPLOAD_DIR / f".{path.name}.{uuid4().hex}.deleting"
        path.replace(staged)
    try:
        db.delete(row); db.commit()
    except Exception:
        db.rollback()
        if staged and staged.exists() and path:
            staged.replace(path)
        raise
    if staged:
        staged.unlink(missing_ok=True)
