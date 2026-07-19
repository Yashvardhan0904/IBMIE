from __future__ import annotations

import os
from functools import lru_cache
from pathlib import Path

from dotenv import load_dotenv
from pydantic import BaseModel, ConfigDict, Field, field_validator

PROJECT_ROOT = Path(__file__).resolve().parents[3]
BACKEND_ROOT = PROJECT_ROOT / "backend"

env_file = PROJECT_ROOT / ".env"
if env_file.exists():
    load_dotenv(env_file, override=False)


class Settings(BaseModel):
    model_config = ConfigDict(extra="ignore")

    app_name: str = "Vitalis Backend"
    app_version: str = "0.1.0"
    environment: str = Field(default="development")
    supabase_url: str
    supabase_key: str
    supabase_database_uri: str
    supabase_storage_bucket: str
    cors_origins_raw: str = Field(default="")
    log_level: str = Field(default="INFO")
    max_upload_size_mb: int = Field(default=25, ge=1)
    request_timeout_seconds: float = Field(default=120.0, gt=0)

    @field_validator(
        "supabase_url",
        "supabase_key",
        "supabase_database_uri",
        "supabase_storage_bucket",
    )
    @classmethod
    def validate_required_value(cls, value: str) -> str:
        if not value or not value.strip():
            raise ValueError("This environment variable must be set")
        return value.strip()

    @property
    def cors_origins(self) -> list[str]:
        return [item.strip() for item in self.cors_origins_raw.split(",") if item.strip()]

    @property
    def uploads_dir(self) -> Path:
        return BACKEND_ROOT / "uploads"


@lru_cache(maxsize=1)
def get_settings() -> Settings:
    return Settings(
        app_name=os.getenv("APP_NAME", "Vitalis Backend"),
        app_version=os.getenv("APP_VERSION", "0.1.0"),
        environment=os.getenv("ENVIRONMENT", "development"),
        supabase_url=os.getenv("SUPABASE_URL", ""),
        supabase_key=os.getenv("SUPABASE_KEY", ""),
        supabase_database_uri=os.getenv("SUPABASE_DATABASE_URI", ""),
        supabase_storage_bucket=os.getenv("SUPABASE_STORAGE_BUCKET", ""),
        cors_origins_raw=os.getenv("CORS_ORIGINS", ""),
        log_level=os.getenv("LOG_LEVEL", "INFO"),
        max_upload_size_mb=int(os.getenv("MAX_UPLOAD_SIZE_MB", "25")),
        request_timeout_seconds=float(os.getenv("REQUEST_TIMEOUT_SECONDS", "120")),
    )
