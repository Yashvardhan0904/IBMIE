from __future__ import annotations

from datetime import datetime
from typing import Any
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field

from app.schemas.responses import PaginationMeta


class ReportBase(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    user_id: UUID | None
    original_filename: str
    storage_path: str
    uploaded_at: datetime


class ReportRead(ReportBase):
    report_json: Any = Field(..., description="The untouched JSON returned by the parser")


class ReportListItem(ReportBase):
    pass


class ReportSingleResponse(BaseModel):
    message: str
    report: ReportRead


class ReportUploadResponse(ReportSingleResponse):
    pass


class ReportDetailResponse(ReportSingleResponse):
    pass


class ReportListResponse(BaseModel):
    items: list[ReportListItem]
    pagination: PaginationMeta


class ReportDeleteResponse(BaseModel):
    message: str
    report_id: UUID
