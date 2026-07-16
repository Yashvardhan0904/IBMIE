from __future__ import annotations

import asyncio
from pathlib import Path
from urllib.parse import quote

import httpx

from app.core.config import get_settings
from app.core.exceptions import StorageServiceError
from app.core.logging import get_logger

LOGGER = get_logger(__name__)


class StorageService:
    def __init__(self) -> None:
        self.settings = get_settings()

    def _build_headers(self) -> dict[str, str]:
        return {
            "apikey": self.settings.supabase_key,
            "Authorization": f"Bearer {self.settings.supabase_key}",
            "Content-Type": "application/pdf",
            "x-upsert": "false",
        }

    def _object_url(self, storage_path: str) -> str:
        encoded_path = quote(storage_path, safe="/")
        return (
            f"{self.settings.supabase_url.rstrip('/')}/storage/v1/object/"
            f"{self.settings.supabase_storage_bucket}/{encoded_path}"
        )

    async def upload_pdf(self, file_path: Path, storage_path: str) -> str:
        file_bytes = await asyncio.to_thread(file_path.read_bytes)
        url = self._object_url(storage_path)

        async with httpx.AsyncClient(timeout=self.settings.request_timeout_seconds) as client:
            response = await client.post(
                url,
                headers=self._build_headers(),
                content=file_bytes,
            )

        if response.status_code >= 400:
            raise StorageServiceError(
                f"Supabase Storage upload failed with status {response.status_code}: {response.text}"
            )

        LOGGER.info(
            "Uploaded PDF to Supabase Storage",
            extra={"storage_path": storage_path},
        )
        return storage_path

    async def delete_pdf(self, storage_path: str, ignore_missing: bool = True) -> None:
        url = self._object_url(storage_path)

        async with httpx.AsyncClient(timeout=self.settings.request_timeout_seconds) as client:
            response = await client.delete(url, headers=self._build_headers())

        if response.status_code == 404 and ignore_missing:
            LOGGER.warning(
                "Storage object was already missing",
                extra={"storage_path": storage_path},
            )
            return

        if response.status_code >= 400:
            raise StorageServiceError(
                f"Supabase Storage delete failed with status {response.status_code}: {response.text}"
            )

        LOGGER.info(
            "Deleted PDF from Supabase Storage",
            extra={"storage_path": storage_path},
        )
