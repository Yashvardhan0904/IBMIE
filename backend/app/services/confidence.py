from __future__ import annotations

import json
import os
from pathlib import Path
from typing import Any

from app.core.logging import get_logger

LOGGER = get_logger(__name__)

DEFAULT_CONFIG_PATH = Path(__file__).resolve().parents[1] / "config" / "extraction_config.json"

PATIENT_FIELDS = (
    "patient.name",
    "patient.age",
    "patient.gender",
    "patient.patient_id",
    "patient.referring_physician",
)


def load_extraction_config(config_path: str | Path | None = None) -> dict[str, Any]:
    path = Path(
        config_path
        or os.getenv("EXTRACTION_CONFIG_PATH")
        or DEFAULT_CONFIG_PATH
    )
    try:
        with path.open("r", encoding="utf-8") as handle:
            payload = json.load(handle)
        if not isinstance(payload, dict):
            raise ValueError("extraction config must be an object")
        return payload
    except Exception as exc:
        LOGGER.error(
            "Failed to load extraction config; using built-in defaults",
            extra={"path": str(path), "error": str(exc)},
        )
        return {
            "expected_fields": {
                "lab_report": [
                    "patient.name",
                    "patient.age",
                    "patient.gender",
                    "patient.referring_physician",
                    "temperature",
                    "pulse",
                    "respiratory_rate",
                    "blood_pressure",
                    "spo2",
                    "hemoglobin",
                    "wbc",
                    "neutrophils",
                    "crp",
                ]
            },
            "confidence_weights": {
                "deterministic": 0.95,
                "validated_llm": 0.85,
                "llm_numeric": 0.8,
                "llm_numeric_no_unit": 0.7,
                "llm_qualitative": 0.6,
                "ambiguous": 0.5,
            },
        }


def _patient_value(patient: Any, field_name: str) -> Any:
    if patient is None:
        return None
    if isinstance(patient, dict):
        return patient.get(field_name.split(".", 1)[1])
    return getattr(patient, field_name.split(".", 1)[1], None)


def _metric_is_present(metric: Any) -> bool:
    canonical = getattr(metric, "canonical_key", None)
    if canonical == "blood_pressure":
        return (
            getattr(metric, "systolic", None) is not None
            and getattr(metric, "diastolic", None) is not None
        )
    if getattr(metric, "numeric_value", None) is not None:
        return True
    value = getattr(metric, "value_raw", None) or getattr(metric, "value", None)
    return bool(str(value or "").strip())


def _find_metric(metrics: list[Any], canonical: str) -> Any | None:
    for metric in metrics:
        if getattr(metric, "canonical_key", None) == canonical:
            return metric
    return None


def compute_confidence(
    metrics: list[Any],
    patient: Any,
    *,
    ocr_confidence: float | None,
    ocr_used: bool,
    doc_type: str = "lab_report",
    config: dict[str, Any] | None = None,
) -> dict[str, Any]:
    """Compute three independent confidence dimensions.

    * OCR confidence comes from Tesseract (``None`` for digital text).
    * Extraction confidence is the mean confidence of fields that were found.
    * Completeness is presence over the configured expected fields, and never
      derives from confidence scores.
    """
    config = config or load_extraction_config()
    expected = list(
        (config.get("expected_fields") or {}).get(doc_type, [])
    )

    field_confidence: dict[str, float] = {}

    for field_name, confidence in getattr(patient, "field_confidence", {}).items():
        if field_name in PATIENT_FIELDS:
            field_confidence[field_name] = round(float(confidence), 4)

    for metric in metrics:
        canonical = getattr(metric, "canonical_key", None)
        key = canonical or "name:" + str(getattr(metric, "biomarker_name", "")).strip().lower()
        field_confidence[key] = round(
            float(getattr(metric, "confidence", 0.0) or 0.0), 4
        )

    present_fields: list[str] = []
    missing_fields: list[str] = []
    for field_name in expected:
        if field_name.startswith("patient."):
            present = _patient_value(patient, field_name) is not None
        else:
            metric = _find_metric(metrics, field_name)
            present = metric is not None and _metric_is_present(metric)
        if present:
            present_fields.append(field_name)
        else:
            missing_fields.append(field_name)

    completeness = (
        round(len(present_fields) / len(expected), 4) if expected else None
    )

    extraction_values = list(field_confidence.values())
    extraction = (
        round(sum(extraction_values) / len(extraction_values), 4)
        if extraction_values
        else None
    )

    return {
        "ocr": round(ocr_confidence, 4) if ocr_used and ocr_confidence is not None else None,
        "extraction": extraction,
        "completeness": completeness,
        "field_confidence": field_confidence,
        "missing_fields": missing_fields,
        "present_fields": present_fields,
        "counts": {
            "expected": len(expected),
            "present": len(present_fields),
            "missing": len(missing_fields),
        },
    }
