from datetime import datetime
from typing import Any, Dict, List

from pydantic import BaseModel


class ReportResult(BaseModel):
    report_type: str
    generated_at: datetime
    filters: Dict[str, Any]
    summary: Dict[str, Any]
    data: List[Dict[str, Any]]

