from typing import Optional

from fastapi import APIRouter, Depends, File, Form, UploadFile, status
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.user import User
from app.schemas.document import DocumentResponse
from app.services.documents import document_file, get_document, list_documents, remove_document, save_document
from app.utils.dependencies import get_current_user


router = APIRouter(prefix="/documents", tags=["Document Management"])


@router.get("", response_model=list[DocumentResponse])
def documents(project_id: Optional[int] = None, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    return list_documents(db, current_user, project_id)


@router.get("/{document_id}", response_model=DocumentResponse)
def document_details(document_id: int, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    return get_document(db, current_user, document_id)


@router.post("", response_model=DocumentResponse, status_code=status.HTTP_201_CREATED)
def upload_document(
    project_id: int = Form(...), title: str = Form(...), category: str = Form("General"),
    file: UploadFile = File(...), current_user: User = Depends(get_current_user), db: Session = Depends(get_db),
):
    return save_document(db, current_user, project_id, title, category, file)


@router.get("/{document_id}/download")
def download_document(document_id: int, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    row, path = document_file(db, current_user, document_id)
    return FileResponse(path, media_type=row.content_type or "application/octet-stream", filename=row.original_filename)


@router.delete("/{document_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_document(document_id: int, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    remove_document(db, current_user, document_id)
