from __future__ import annotations

from uuid import UUID

from fastapi import APIRouter, Depends, File, Form, Query, UploadFile, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.database.database import get_db_session
from app.schemas.report import (
    ReportDeleteResponse,
    ReportDetailResponse,
    ReportListResponse,
    ReportUploadResponse,
)
from app.services.report_service import ReportService

router = APIRouter(prefix="/api/v1/reports", tags=["reports"])


def get_report_service(
    session: AsyncSession = Depends(get_db_session),
) -> ReportService:
    return ReportService(session=session)


@router.post(
    "/upload",
    response_model=ReportUploadResponse,
    status_code=status.HTTP_201_CREATED,
)
async def upload_report(
    file: UploadFile = File(...),
    user_id: UUID | None = Form(default=None),
    report_service: ReportService = Depends(get_report_service),
) -> ReportUploadResponse:
    return await report_service.upload_report(file, user_id)


@router.get("/{report_id}", response_model=ReportDetailResponse)
async def get_report(
    report_id: UUID,
    report_service: ReportService = Depends(get_report_service),
) -> ReportDetailResponse:
    return await report_service.get_report(report_id)


@router.get("", response_model=ReportListResponse)
async def list_reports(
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=20, ge=1, le=100),
    report_service: ReportService = Depends(get_report_service),
) -> ReportListResponse:
    return await report_service.list_reports(page=page, page_size=page_size)


@router.delete("/{report_id}", response_model=ReportDeleteResponse)
async def delete_report(
    report_id: UUID,
    report_service: ReportService = Depends(get_report_service),
) -> ReportDeleteResponse:
    return await report_service.delete_report(report_id)
