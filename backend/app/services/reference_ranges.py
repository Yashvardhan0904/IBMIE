from __future__ import annotations

import json
import os
from pathlib import Path
from typing import Any

from app.core.logging import get_logger

LOGGER = get_logger(__name__)

DEFAULT_CONFIG_PATH = Path(__file__).resolve().parents[1] / "config" / "reference_ranges.json"

STATUS_RANK = {"UNSPECIFIED": 0, "NORMAL": 1, "LOW": 2, "HIGH": 3}
VALID_DOCUMENT_STATUSES = {"NORMAL", "HIGH", "LOW"}


class ReferenceRangeEvaluator:
    """Config-driven reference-range validation layer.

    Ranges are loaded once from JSON and can be overridden with
    ``REFERENCE_RANGES_PATH``. Missing values never become ``NORMAL``.
    """

    def __init__(self, config_path: str | Path | None = None) -> None:
        path = Path(
            config_path
            or os.getenv("REFERENCE_RANGES_PATH")
            or DEFAULT_CONFIG_PATH
        )
        self.config_path = path
        self.analytes: dict[str, dict[str, Any]] = {}
        self._load(path)

    def _load(self, path: Path) -> None:
        try:
            with path.open("r", encoding="utf-8") as handle:
                payload = json.load(handle)
            analytes = payload.get("analytes", {})
            if not isinstance(analytes, dict):
                raise ValueError("'analytes' must be an object")
            self.analytes = analytes
            LOGGER.info(
                "Reference ranges loaded",
                extra={"path": str(path), "analytes": len(analytes)},
            )
        except Exception as exc:
            LOGGER.error(
                "Failed to load reference ranges; status validation disabled",
                extra={"path": str(path), "error": str(exc)},
            )
            self.analytes = {}

    def evaluate_metric(
        self,
        metric: Any,
        *,
        age: int | None = None,
        gender: str | None = None,
    ) -> None:
        canonical = getattr(metric, "canonical_key", None)
        analyte = self.analytes.get(canonical or "")
        if not analyte:
            self._apply_document_fallback(metric, reason="no_reference_range")
            return

        if canonical == "blood_pressure":
            self._evaluate_blood_pressure(metric, analyte)
            return

        numeric = getattr(metric, "numeric_value", None)
        if numeric is None:
            self._apply_document_fallback(metric, reason="numeric_value_missing")
            return

        config_unit = analyte.get("unit")
        metric_unit = getattr(metric, "unit", None)
        if not self._units_compatible(metric_unit, config_unit):
            self._apply_document_fallback(metric, reason="unit_mismatch")
            return

        bounds = self._resolve_bounds(analyte, age, gender)
        if bounds is None:
            self._apply_document_fallback(metric, reason="no_matching_range")
            return

        low, high = bounds
        status = classify(numeric, low, high, getattr(metric, "comparator", None))
        metric.status = status
        metric.status_source = "reference_range"
        metric.reference_range = {
            "low": low,
            "high": high,
            "unit": config_unit or metric_unit,
            "source": "config",
            "systolic": None,
            "diastolic": None,
        }

    def _evaluate_blood_pressure(self, metric: Any, analyte: dict[str, Any]) -> None:
        systolic = getattr(metric, "systolic", None)
        diastolic = getattr(metric, "diastolic", None)
        systolic_cfg = analyte.get("systolic", {})
        diastolic_cfg = analyte.get("diastolic", {})

        if systolic is None or diastolic is None:
            metric.status = "UNSPECIFIED"
            metric.status_source = "unavailable"
            metric.reference_range = {
                "low": None,
                "high": None,
                "unit": analyte.get("unit", metric.unit),
                "source": "config",
                "systolic": {
                    "low": systolic_cfg.get("low"),
                    "high": systolic_cfg.get("high"),
                },
                "diastolic": {
                    "low": diastolic_cfg.get("low"),
                    "high": diastolic_cfg.get("high"),
                },
            }
            return

        systolic_status = classify(
            systolic, systolic_cfg.get("low"), systolic_cfg.get("high")
        )
        diastolic_status = classify(
            diastolic, diastolic_cfg.get("low"), diastolic_cfg.get("high")
        )
        overall = max(
            (systolic_status, diastolic_status),
            key=lambda status: STATUS_RANK.get(status, 0),
        )

        metric.systolic_status = systolic_status
        metric.diastolic_status = diastolic_status
        metric.status = overall
        metric.status_source = "reference_range"
        metric.reference_range = {
            "low": None,
            "high": None,
            "unit": analyte.get("unit", metric.unit),
            "source": "config",
            "systolic": {
                "low": systolic_cfg.get("low"),
                "high": systolic_cfg.get("high"),
            },
            "diastolic": {
                "low": diastolic_cfg.get("low"),
                "high": diastolic_cfg.get("high"),
            },
        }

    def _apply_document_fallback(self, metric: Any, *, reason: str) -> None:
        document_status = str(getattr(metric, "status", "UNSPECIFIED")).upper()
        numeric = getattr(metric, "numeric_value", None)
        systolic = getattr(metric, "systolic", None)
        diastolic = getattr(metric, "diastolic", None)
        has_value = numeric is not None or (systolic is not None and diastolic is not None)

        if (
            has_value
            and document_status in VALID_DOCUMENT_STATUSES
        ):
            metric.status = document_status
            metric.status_source = "document"
        elif (
            not has_value
            and document_status in {"HIGH", "LOW"}
        ):
            # An explicit abnormal flag on a qualitative result can be kept;
            # a missing value must never be silently marked NORMAL.
            metric.status = document_status
            metric.status_source = "document"
        else:
            metric.status = "UNSPECIFIED"
            metric.status_source = "unavailable"

        if getattr(metric, "reference_range", None) is None:
            metric.reference_range = {
                "low": None,
                "high": None,
                "unit": getattr(metric, "unit", None),
                "source": f"unavailable:{reason}",
                "systolic": None,
                "diastolic": None,
            }

    @staticmethod
    def _units_compatible(metric_unit: str | None, config_unit: str | None) -> bool:
        if not config_unit:
            return True
        if not metric_unit:
            # Reports often omit units for vitals; the value is still usable.
            return True
        return _normalise_unit(metric_unit) == _normalise_unit(config_unit)

    @staticmethod
    def _resolve_bounds(
        analyte: dict[str, Any], age: int | None, gender: str | None
    ) -> tuple[float | None, float | None] | None:
        gender_key = (gender or "").strip().lower()

        for band in analyte.get("age_bands", []) or []:
            min_age = band.get("min_age")
            max_age = band.get("max_age")
            if age is None:
                continue
            if min_age is not None and age < min_age:
                continue
            if max_age is not None and age > max_age:
                continue
            by_gender = band.get("by_gender") or {}
            if gender_key in by_gender:
                bounds = by_gender[gender_key]
                return bounds.get("low"), bounds.get("high")
            if "low" in band or "high" in band:
                return band.get("low"), band.get("high")

        by_gender = analyte.get("by_gender") or {}
        if gender_key in by_gender:
            bounds = by_gender[gender_key]
            return bounds.get("low"), bounds.get("high")

        default = analyte.get("default")
        if isinstance(default, dict):
            return default.get("low"), default.get("high")

        if "low" in analyte or "high" in analyte:
            return analyte.get("low"), analyte.get("high")

        return None


def _normalise_unit(unit: str) -> str:
    return (
        str(unit)
        .strip()
        .lower()
        .replace("µ", "u")
        .replace("μ", "u")
    )


def classify(
    value: float,
    low: float | None,
    high: float | None,
    comparator: str | None = None,
) -> str:
    if value is None:
        return "UNSPECIFIED"

    if comparator in {"<", "≤", "<="}:
        if high is not None and value > high:
            return "HIGH"
        return "NORMAL"
    if comparator in {">", "≥", ">="}:
        if high is not None and value >= high:
            return "HIGH"
        if low is not None and value < low:
            return "LOW"
        return "NORMAL"

    if high is not None and value > high:
        return "HIGH"
    if low is not None and value < low:
        return "LOW"
    return "NORMAL"


_DEFAULT_EVALUATOR: ReferenceRangeEvaluator | None = None


def get_reference_evaluator() -> ReferenceRangeEvaluator:
    global _DEFAULT_EVALUATOR
    if _DEFAULT_EVALUATOR is None:
        _DEFAULT_EVALUATOR = ReferenceRangeEvaluator()
    return _DEFAULT_EVALUATOR


def apply_reference_ranges(
    metrics: list[Any],
    *,
    age: int | None = None,
    gender: str | None = None,
    evaluator: ReferenceRangeEvaluator | None = None,
) -> list[Any]:
    evaluator = evaluator or get_reference_evaluator()
    for metric in metrics:
        try:
            evaluator.evaluate_metric(metric, age=age, gender=gender)
        except Exception as exc:
            LOGGER.error(
                "Reference-range evaluation failed for metric",
                extra={
                    "metric": getattr(metric, "biomarker_name", None),
                    "error": str(exc),
                },
            )
            metric.status = "UNSPECIFIED"
            metric.status_source = "unavailable"
    return metrics
