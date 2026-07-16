from __future__ import annotations


class IBMIEError(Exception):
    status_code = 500
    default_detail = "An unexpected error occurred"

    def __init__(self, detail: str | None = None) -> None:
        self.detail = detail or self.default_detail
        super().__init__(self.detail)


class InvalidPDFError(IBMIEError):
    status_code = 400
    default_detail = "The uploaded file is not a valid PDF"


class ParserServiceError(IBMIEError):
    status_code = 502
    default_detail = "Parser service failed to process the PDF"


class StorageServiceError(IBMIEError):
    status_code = 502
    default_detail = "Failed to upload or delete the file in Supabase Storage"


class ReportNotFoundError(IBMIEError):
    status_code = 404
    default_detail = "Report not found"


class DatabaseOperationError(IBMIEError):
    status_code = 500
    default_detail = "Database operation failed"
