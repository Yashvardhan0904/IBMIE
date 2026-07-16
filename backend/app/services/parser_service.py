from __future__ import annotations

import asyncio
import importlib
import json
import sys
from pathlib import Path
from typing import Any, Callable

from app.core.exceptions import ParserServiceError
from app.core.logging import get_logger

LOGGER = get_logger(__name__)
REPO_ROOT = Path(__file__).resolve().parents[3]
if str(REPO_ROOT) not in sys.path:
    sys.path.insert(0, str(REPO_ROOT))


class ParserService:
    def __init__(self) -> None:
        self._parser_callable = self._resolve_parser_callable()

    def _resolve_parser_callable(self) -> Callable[[str], Any]:
        try:
            parser_module = importlib.import_module("parser")
        except Exception as exc:
            raise ParserServiceError("Could not import the existing parser module") from exc

        candidate_names = ("parse", "parse_report", "parse_medical_pdf")
        for candidate_name in candidate_names:
            candidate = getattr(parser_module, candidate_name, None)
            if callable(candidate):
                LOGGER.info(
                    "Parser callable resolved",
                    extra={"callable": candidate_name},
                )
                return candidate

        nested_parser = getattr(parser_module, "parser", None)
        for candidate_name in candidate_names:
            candidate = getattr(nested_parser, candidate_name, None)
            if callable(candidate):
                LOGGER.info(
                    "Nested parser callable resolved",
                    extra={"callable": candidate_name},
                )
                return candidate

        raise ParserServiceError(
            "No supported parser entry point was found. Expected parse, parse_report, or parse_medical_pdf."
        )

    async def parse_pdf(self, pdf_path: Path) -> Any:
        return await asyncio.to_thread(self._parse_sync, pdf_path)

    def _parse_sync(self, pdf_path: Path) -> Any:
        try:
            result = self._parser_callable(str(pdf_path))
        except Exception as exc:
            raise ParserServiceError(str(exc)) from exc

        if isinstance(result, str):
            try:
                return json.loads(result)
            except json.JSONDecodeError as exc:
                raise ParserServiceError("Parser returned a non-JSON string") from exc

        return result
