from __future__ import annotations

import json
from pathlib import Path
from typing import Any

from app.services.normalization import canonical_key, normalize_metric_value
from app.services.parser_service import MedicalMetric

FIXTURES = Path(__file__).resolve().parent / "fixtures"

PNEUMONIA_METRICS: list[dict[str, Any]] = [
    {"biomarker_name": "Temperature", "value": "38.6", "unit": "°C", "status": "UNSPECIFIED"},
    {"biomarker_name": "Pulse", "value": "108", "unit": "beats/min", "status": "UNSPECIFIED"},
    {"biomarker_name": "Respiratory rate", "value": "26", "unit": "breaths/min", "status": "UNSPECIFIED"},
    {"biomarker_name": "Blood pressure", "value": "118/76", "unit": "mmHg", "status": "UNSPECIFIED"},
    {"biomarker_name": "SpOz (room air)", "value": "91", "unit": "%", "status": "UNSPECIFIED"},
    {"biomarker_name": "Hemoglobin", "value": "13.4", "unit": "g/dL", "status": "UNSPECIFIED"},
    {"biomarker_name": "Total WBC count", "value": "15,200", "unit": "cells/uL", "status": "UNSPECIFIED"},
    {"biomarker_name": "Neutrophils", "value": "82", "unit": "%", "status": "UNSPECIFIED"},
    {"biomarker_name": "CRP", "value": "68", "unit": "mg/L", "status": "UNSPECIFIED"},
]

PNEUMONIA_PATIENT = {
    "name": "SAMPLE PATIENT",
    "age": 58,
    "gender": "Male",
    "patient_id": "DEMO-PT-2026-0417",
    "referring_physician": "Dr. A. Sharma",
}


def make_metric(
    name: str,
    value: Any,
    unit: str | None = None,
    *,
    status: str = "UNSPECIFIED",
    abbreviation: str | None = None,
    confidence: float = 0.8,
) -> MedicalMetric:
    canonical = canonical_key(name, abbreviation)
    normalized = normalize_metric_value(
        value,
        name=name,
        abbreviation=abbreviation,
        unit=unit,
        canonical=canonical,
    )
    return MedicalMetric(
        biomarker_name=name,
        extracted_abbreviation=abbreviation,
        value=str(value) if value is not None else "",
        value_raw=normalized.value_raw,
        value_normalized=normalized.value_normalized,
        numeric_value=normalized.numeric_value,
        systolic=normalized.systolic,
        diastolic=normalized.diastolic,
        unit=normalized.unit,
        unit_raw=normalized.unit_raw,
        comparator=normalized.comparator,
        status=status,
        confidence=confidence,
        canonical_key=canonical,
    )


def fake_llm(
    metrics: list[dict[str, Any]],
    patient: dict[str, Any] | None = None,
):
    payload = {
        "patient": patient or {},
        "patient_demographics_found": bool(patient),
        "metrics": metrics,
    }

    def call(_text: str, _doc_type: str) -> str:
        return json.dumps(payload)

    return call


def read_fixture(name: str) -> str:
    return (FIXTURES / name).read_text(encoding="utf-8")
