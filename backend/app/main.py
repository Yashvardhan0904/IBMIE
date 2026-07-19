from __future__ import annotations

from contextlib import asynccontextmanager

from fastapi import FastAPI, Request
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.api.reports import router as reports_router
from app.api.prescriptions import router as prescriptions_router  # <-- Import the new router
from app.api.chat import router as chat_router
from app.core.config import get_settings
from app.core.exceptions import VitalisError
from app.core.logging import configure_logging, get_logger
from app.database.database import init_db

settings = get_settings()
configure_logging(settings.log_level)
LOGGER = get_logger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    LOGGER.info("Starting Vitalis backend")
    await init_db()
    yield
    LOGGER.info("Shutting down Vitalis backend")


app = FastAPI(
    title=settings.app_name,
    version=settings.app_version,
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins or ["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.exception_handler(VitalisError)
async def vitalis_error_handler(_: Request, exc: VitalisError) -> JSONResponse:
    return JSONResponse(status_code=exc.status_code, content={"detail": exc.detail})


@app.exception_handler(RequestValidationError)
async def validation_error_handler(_: Request, exc: RequestValidationError) -> JSONResponse:
    return JSONResponse(status_code=422, content={"detail": exc.errors()})


@app.get("/health")
async def health_check() -> dict[str, str]:
    return {"status": "ok"}


# Register both clean, separate routers
app.include_router(reports_router)
app.include_router(prescriptions_router)
app.include_router(chat_router)
