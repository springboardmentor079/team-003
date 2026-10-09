from datetime import datetime
from typing import Optional

from pydantic import BaseModel, ConfigDict


class DocumentResponse(BaseModel):
    id: int
    project_id: int
    title: str
    category: str
    original_filename: Optional[str] = None
    content_type: Optional[str] = None
    file_size: Optional[int] = None
    uploaded_by_id: Optional[int] = None
    uploaded_by: Optional[str] = None
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)
