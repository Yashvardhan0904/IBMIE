from __future__ import annotations

from fastapi import UploadFile

from app.core.exceptions import InvalidPDFError

ALLOWED_PDF_MIME_TYPES = {"application/pdf", "application/octet-stream"}


async def validate_pdf_upload(upload_file: UploadFile) -> None:
    filename = (upload_file.filename or "").lower()
    if not filename.endswith(".pdf"):
        raise InvalidPDFError("The uploaded file must have a .pdf extension")

    if upload_file.content_type not in ALLOWED_PDF_MIME_TYPES:
        raise InvalidPDFError(f"Unsupported content type: {upload_file.content_type}")

    header = await upload_file.read(5)
    await upload_file.seek(0)
    if not header.startswith(b"%PDF"):
        raise InvalidPDFError("The uploaded file does not appear to be a PDF")
