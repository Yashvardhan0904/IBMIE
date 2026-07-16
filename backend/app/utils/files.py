from __future__ import annotations

import re
from pathlib import Path
from uuid import UUID


def sanitize_filename(filename: str) -> str:
    cleaned = re.sub(r"[^A-Za-z0-9._-]+", "_", Path(filename).name).strip("._")
    return cleaned or "report.pdf"


def build_storage_path(report_id: UUID, filename: str) -> str:
    safe_name = sanitize_filename(filename)
    return f"reports/{report_id}/{safe_name}"
