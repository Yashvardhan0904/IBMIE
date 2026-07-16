from __future__ import annotations

from math import ceil
from pathlib import Path
from uuid import UUID, uuid4

from fastapi import UploadFile
from sqlalchemy import func, select
from sqlalchemy.exc import SQLAlchemyError
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import get_settings
from app.core.exceptions import DatabaseOperationError, InvalidPDFError, ReportNotFoundError
from app.core.logging import get_logger
from app.core.security import validate_pdf_upload
from app.database.models import Report
from app.schemas.report import (
    ReportDeleteResponse,
    ReportDetailResponse,
    ReportListItem,
    ReportListResponse,
    ReportRead,
    ReportUploadResponse,
)
from app.schemas.responses import PaginationMeta
from app.services.parser_service import ParserService
from app.services.storage_service import StorageService
from app.utils.files import build_storage_path, sanitize_filename

LOGGER = get_logger(__name__)


class ReportService:
    def __init__(
        self,
        session: AsyncSession,
        parser_service: ParserService | None = None,
        storage_service: StorageService | None = None,
    ) -> None:
        self.session = session
        self.parser_service = parser_service or ParserService()
        self.storage_service = storage_service or StorageService()
        self.settings = get_settings()

    async def upload_report(
        self,
        upload_file: UploadFile,
        user_id: UUID | None = None,
    ) -> ReportUploadResponse:
        await validate_pdf_upload(upload_file)

        report_id = uuid4()
        original_filename = sanitize_filename(upload_file.filename or "report.pdf")
        storage_path = build_storage_path(report_id, original_filename)
        temp_path: Path | None = None

        try:
            temp_path = await self._save_upload_to_tempfile(upload_file, original_filename)
            parsed_json = await self.parser_service.parse_pdf(temp_path)
            await self.storage_service.upload_pdf(temp_path, storage_path)

            report = Report(
                id=report_id,
                user_id=user_id,
                original_filename=original_filename,
                storage_path=storage_path,
                report_json=parsed_json,
            )
            self.session.add(report)
            await self.session.commit()
            await self.session.refresh(report)

            LOGGER.info(
                "Stored report metadata in PostgreSQL",
                extra={"report_id": str(report.id), "storage_path": report.storage_path},
            )
            return ReportUploadResponse(
                message="Report uploaded successfully",
                report=self._to_schema(report, ReportRead),
            )
        except Exception as exc:
            await self.session.rollback()
            if storage_path:
                try:
                    await self.storage_service.delete_pdf(storage_path, ignore_missing=True)
                except Exception as cleanup_exc:
                    LOGGER.error(
                        "Failed to clean up uploaded storage object after an error",
                        extra={
                            "storage_path": storage_path,
                            "cleanup_error": str(cleanup_exc),
                        },
                    )

            if hasattr(exc, "status_code"):
                raise
            if isinstance(exc, SQLAlchemyError):
                raise DatabaseOperationError(str(exc)) from exc
            raise
        finally:
            if temp_path is not None:
                self._cleanup_tempfile(temp_path)

    async def get_report(self, report_id: UUID) -> ReportDetailResponse:
        report = await self._fetch_report_or_404(report_id)
        return ReportDetailResponse(
            message="Report retrieved successfully",
            report=self._to_schema(report, ReportRead),
        )

    async def list_reports(self, page: int = 1, page_size: int = 20) -> ReportListResponse:
        offset = (page - 1) * page_size
        total_statement = select(func.count()).select_from(Report)
        total = int((await self.session.execute(total_statement)).scalar_one())

        statement = (
            select(Report)
            .order_by(Report.uploaded_at.desc())
            .offset(offset)
            .limit(page_size)
        )
        rows = (await self.session.execute(statement)).scalars().all()
        total_pages = ceil(total / page_size) if total else 0

        return ReportListResponse(
            items=[self._to_schema(report, ReportListItem) for report in rows],
            pagination=PaginationMeta(
                page=page,
                page_size=page_size,
                total=total,
                total_pages=total_pages,
            ),
        )

    async def delete_report(self, report_id: UUID) -> ReportDeleteResponse:
        report = await self._fetch_report_or_404(report_id)
        await self.storage_service.delete_pdf(report.storage_path, ignore_missing=True)

        try:
            await self.session.delete(report)
            await self.session.commit()
        except SQLAlchemyError as exc:
            await self.session.rollback()
            raise DatabaseOperationError(str(exc)) from exc

        return ReportDeleteResponse(
            message="Report deleted successfully",
            report_id=report_id,
        )

    async def _fetch_report_or_404(self, report_id: UUID) -> Report:
        statement = select(Report).where(Report.id == report_id)
        report = (await self.session.execute(statement)).scalar_one_or_none()
        if report is None:
            raise ReportNotFoundError()
        return report

    def _to_schema(
        self,
        report: Report,
        schema_type: type[ReportRead] | type[ReportListItem],
    ) -> ReportRead | ReportListItem:
        return schema_type.model_validate(report, from_attributes=True)

    async def _save_upload_to_tempfile(
        self,
        upload_file: UploadFile,
        original_filename: str,
    ) -> Path:
        self.settings.uploads_dir.mkdir(parents=True, exist_ok=True)
        suffix = Path(original_filename).suffix or ".pdf"
        temp_path = self.settings.uploads_dir / f"{uuid4()}{suffix}"
        max_bytes = self.settings.max_upload_size_mb * 1024 * 1024
        bytes_written = 0

        try:
            with temp_path.open("wb") as temp_handle:
                while chunk := await upload_file.read(1024 * 1024):
                    bytes_written += len(chunk)
                    if bytes_written > max_bytes:
                        raise InvalidPDFError(
                            f"Uploaded file exceeds the maximum allowed size of {self.settings.max_upload_size_mb} MB"
                        )
                    temp_handle.write(chunk)
        except Exception:
            if temp_path.exists():
                temp_path.unlink()
            raise
        finally:
            await upload_file.seek(0)

        return temp_path

    def _cleanup_tempfile(self, temp_path: Path) -> None:
        try:
            if temp_path.exists():
                temp_path.unlink()
        except OSError as exc:
            LOGGER.warning(
                "Failed to delete temporary PDF",
                extra={"temp_path": str(temp_path), "error": str(exc)},
            )
