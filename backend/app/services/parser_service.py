from __future__ import annotations

import asyncio
import json
import os
import re
from pathlib import Path
from typing import Any, Callable, Literal

import httpx
from pydantic import BaseModel, ConfigDict, Field, field_validator

from app.core.exceptions import ParserServiceError
from app.core.logging import get_logger
from app.schemas.prescription import PrescriptionExtractionSchema
from app.services.confidence import compute_confidence, load_extraction_config
from app.services.normalization import (
    canonical_key,
    deduplicate_metrics,
    display_name,
    normalize_metric_value,
)
from app.services.ocr_service import OCRService, OcrResult
from app.services.patient_extractor import (
    ExtractedPatient,
    extract_patient,
    merge_patients,
    normalize_gender,
    parse_age,
    sanitize_patient_dict,
)
from app.services.reference_ranges import (
    ReferenceRangeEvaluator,
    apply_reference_ranges,
)

LOGGER = get_logger(__name__)
GROQ_MODEL = os.getenv("GROQ_MODEL", "openai/gpt-oss-120b")
GROQ_CHAT_COMPLETIONS_URL = "https://api.groq.com/openai/v1/chat/completions"

SYSTEM_PROMPT = (
    "You are an advanced clinical data extraction engine. Your job is to extract all health "
    "biomarkers, lab tests, and patient parameters from the provided text into a structured JSON "
    "format. Extract only facts that are explicitly present. Never invent, infer, or guess missing "
    "patient information. Never drop metrics, values, or units. Return valid JSON matching the "
    "schema properties exactly."
)

DocumentType = Literal["lab_report", "prescription"]
MetricStatus = Literal["NORMAL", "HIGH", "LOW", "UNSPECIFIED"]
StatusSource = Literal["reference_range", "document", "unavailable"]
LLMCallable = Callable[[str, DocumentType], str]


class RangeBounds(BaseModel):
    low: float | None = None
    high: float | None = None


class ReferenceRangeSchema(BaseModel):
    low: float | None = None
    high: float | None = None
    unit: str | None = None
    source: str | None = None
    systolic: RangeBounds | None = None
    diastolic: RangeBounds | None = None


class PatientDemographics(BaseModel):
    model_config = ConfigDict(extra="ignore")

    name: str | None = None
    age: int | None = None
    gender: str | None = None
    patient_id: str | None = None
    referring_physician: str | None = None

    @field_validator("age", mode="before")
    @classmethod
    def validate_age(cls, value: Any) -> int | None:
        if value is None or value == "":
            return None
        return parse_age(value)

    @field_validator("gender", mode="before")
    @classmethod
    def validate_gender(cls, value: Any) -> str | None:
        return normalize_gender(value)

    @field_validator(
        "name",
        "patient_id",
        "referring_physician",
        mode="before",
    )
    @classmethod
    def clean_optional_text(cls, value: Any) -> str | None:
        if value is None:
            return None
        cleaned = str(value).strip()
        return cleaned or None


class MedicalMetric(BaseModel):
    model_config = ConfigDict(validate_assignment=True)

    biomarker_name: str = Field(
        description="The standardized name of the test or metric (e.g., Hemoglobin, WBC Count, Creatinine)."
    )
    extracted_abbreviation: str | None = Field(
        default=None,
        description="The abbreviation as it appeared in the report, if any (e.g., Hb, Hgb, RBC).",
    )
    value: str = Field(
        description="The exact raw value recorded (e.g., 14.2, Negative, 118/76, 15,200)."
    )
    value_raw: str | None = Field(
        default=None,
        description="Original text value exactly as extracted from the document.",
    )
    value_normalized: str | None = Field(
        default=None,
        description="Normalized value with units factored out (e.g., 118/76, 15200).",
    )
    numeric_value: float | None = Field(
        default=None,
        description="Primary numeric value after normalisation, or null if not numeric.",
    )
    systolic: float | None = Field(
        default=None, description="Systolic component for compound blood pressure."
    )
    diastolic: float | None = Field(
        default=None, description="Diastolic component for compound blood pressure."
    )
    systolic_status: MetricStatus | None = None
    diastolic_status: MetricStatus | None = None
    unit: str | None = Field(
        default=None,
        description="The normalized measurement unit (e.g., g/dL, mg/dL, mmHg).",
    )
    unit_raw: str | None = Field(
        default=None, description="The unit exactly as it appeared in the document."
    )
    comparator: str | None = Field(
        default=None, description="Comparator such as '<' or '>' when present."
    )
    reference_range: ReferenceRangeSchema | None = None
    status: MetricStatus = Field(
        default="UNSPECIFIED",
        description="Clinical status from the reference-range layer.",
    )
    status_source: StatusSource = "unavailable"
    confidence: float = 0.0
    canonical_key: str | None = None

    @field_validator("value", mode="before")
    @classmethod
    def coerce_value_to_string(cls, value: Any) -> str:
        if isinstance(value, (int, float)):
            return str(value)
        return str(value) if value is not None else ""

    @field_validator("status", mode="before")
    @classmethod
    def normalize_status(cls, value: Any) -> str:
        status = str(value or "UNSPECIFIED").upper()
        return status if status in {"NORMAL", "HIGH", "LOW", "UNSPECIFIED"} else "UNSPECIFIED"

    @field_validator("biomarker_name", mode="before")
    @classmethod
    def clean_name(cls, value: Any) -> str:
        return str(value or "").strip()


class ConfidenceMetrics(BaseModel):
    ocr: float | None = None
    extraction: float | None = None
    completeness: float | None = None
    field_confidence: dict[str, float] = Field(default_factory=dict)
    missing_fields: list[str] = Field(default_factory=list)
    present_fields: list[str] = Field(default_factory=list)
    counts: dict[str, int] = Field(default_factory=dict)


class ExtractionSource(BaseModel):
    used_ocr: bool = False
    ocr_confidence: float | None = None
    page_count: int = 0
    ocr_pages: list[int] = Field(default_factory=list)


class LabReportExtractionSchema(BaseModel):
    patient: PatientDemographics = Field(default_factory=PatientDemographics)
    patient_demographics_found: bool = False
    metrics: list[MedicalMetric] = Field(default_factory=list)
    confidence: ConfidenceMetrics = Field(default_factory=ConfidenceMetrics)
    source: ExtractionSource = Field(default_factory=ExtractionSource)


class ParserService:
    async def parse_pdf(
        self,
        pdf_path: Path,
        doc_type: DocumentType = "lab_report",
        *,
        llm_callable: LLMCallable | None = None,
    ) -> LabReportExtractionSchema | PrescriptionExtractionSchema:
        return await asyncio.to_thread(
            self._parse_sync, pdf_path, doc_type, llm_callable
        )

    def _parse_sync(
        self,
        pdf_path: Path,
        doc_type: DocumentType,
        llm_callable: LLMCallable | None = None,
    ) -> LabReportExtractionSchema | PrescriptionExtractionSchema:
        try:
            return parse_medical_pdf(
                pdf_path, doc_type, llm_callable=llm_callable
            )
        except Exception as exc:
            LOGGER.exception(
                "Parser pipeline failed",
                extra={"path": str(pdf_path), "doc_type": doc_type, "error": str(exc)},
            )
            raise ParserServiceError(str(exc)) from exc


def extract_pdf_text(pdf_path: str | Path) -> str:
    """Backward-compatible text extraction using the shared OCR service."""
    return OCRService.extract_document(pdf_path).text


def build_prompt_by_type(report_text: str, doc_type: DocumentType) -> str:
    if doc_type == "prescription":
        return (
            "You are an expert clinical data parsing engine specialized in prescriptions.\n"
            "Extract only facts that are explicitly present in the prescription text.\n\n"
            "Rules:\n"
            "- Do not guess, infer, or normalize drug names beyond what is written.\n"
            "- Extract exact dosages, frequencies, and administration instructions.\n"
            "- Identify any follow-up intervals mentioned.\n"
            "- Return valid JSON matching the requested prescription schema exactly.\n\n"
            f"Prescription text:\n{report_text}"
        )

    return (
        "You are an expert clinical data parsing engine.\n"
        "Extract every medical test, biomarker, vital sign, and patient demographic present in "
        "the document text.\n\n"
        "Strict formatting rules:\n"
        "- Return a root JSON object with keys: 'patient', 'patient_demographics_found', and 'metrics'.\n"
        "- 'patient' must be an object with keys: 'name', 'age', 'gender', 'patient_id', and "
        "'referring_physician'. Use null for every value that is not explicitly written. Never guess.\n"
        "- 'age' must be an integer number of years, or null. Never use 0 for a missing age.\n"
        "- 'metrics' must be an array. Each item must have: 'biomarker_name', 'extracted_abbreviation', "
        "'value', 'unit', and 'status'.\n"
        "- Preserve the measured value exactly as written, including compound values such as "
        "'118/76' and values with thousands separators such as '15,200'.\n"
        "- 'status' is advisory only; use 'UNSPECIFIED' when you are unsure. The application "
        "re-validates status against configurable reference ranges.\n"
        "- Do not omit any biomarker or numerical result. Do not duplicate a result.\n"
        "- Return valid JSON only (no markdown, no prose).\n\n"
        f"Document text:\n{report_text}"
    )


def call_groq(report_text: str, api_key: str, doc_type: DocumentType) -> str:
    payload = {
        "model": GROQ_MODEL,
        "messages": [
            {"role": "system", "content": SYSTEM_PROMPT},
            {"role": "user", "content": build_prompt_by_type(report_text, doc_type)},
        ],
        "temperature": 0,
        "response_format": {"type": "json_object"},
    }
    headers = {
        "Authorization": f"Bearer {api_key}",
        "Content-Type": "application/json",
    }

    response = httpx.post(
        GROQ_CHAT_COMPLETIONS_URL,
        headers=headers,
        json=payload,
        timeout=120,
    )
    try:
        response.raise_for_status()
    except httpx.HTTPStatusError as exc:
        raise RuntimeError(f"Groq API error {response.status_code}: {response.text}") from exc

    return str(response.json()["choices"][0]["message"]["content"])


def _invoke_llm(
    report_text: str,
    doc_type: DocumentType,
    llm_callable: LLMCallable | None,
) -> str:
    if llm_callable is not None:
        return llm_callable(report_text, doc_type)

    api_key = os.getenv("GROQ_API_KEY")
    if not api_key:
        raise RuntimeError("GROQ_API_KEY is not set in the environment")
    return call_groq(report_text, api_key, doc_type)


def normalize_groq_output(content: str) -> dict[str, Any]:
    """Normalise structural differences in LLM JSON output.

    Accepts the current schema, the legacy tests/results shape, and a bare
    array of metrics. Patient data is preserved rather than collapsed into a
    boolean.
    """
    try:
        raw = json.loads(content)
    except json.JSONDecodeError as exc:
        LOGGER.error(
            "LLM returned invalid JSON",
            extra={"snippet": content[:500], "error": str(exc)},
        )
        raise RuntimeError(f"LLM returned invalid JSON: {exc}") from exc

    patient_raw: dict[str, Any] | None = None
    if isinstance(raw, dict):
        for key in ("patient", "patient_demographics", "demographics", "patient_details"):
            candidate = raw.get(key)
            if isinstance(candidate, dict):
                patient_raw = candidate
                break

    if isinstance(raw, list):
        test_items = raw
        patient_demographics_found = False
    elif isinstance(raw, dict) and isinstance(raw.get("metrics"), list):
        test_items = raw["metrics"]
        patient_demographics_found = bool(
            raw.get("patient_demographics_found", False) or patient_raw
        )
    elif isinstance(raw, dict):
        test_items = raw.get("tests") or raw.get("results") or []
        if not isinstance(test_items, list):
            test_items = []
        patient_demographics_found = bool(
            raw.get("patient_demographics_found", False) or patient_raw
        )
    else:
        raise RuntimeError("LLM returned an unsupported JSON value")

    metrics: list[dict[str, Any]] = []
    for item in test_items:
        if not isinstance(item, dict):
            continue

        test_name = str(
            item.get("biomarker_name") or item.get("name") or item.get("test") or ""
        ).strip()
        if not test_name:
            continue

        abbreviation = item.get("extracted_abbreviation") or item.get("abbreviation")
        match = re.match(r"^(.*)\(([^)]+)\)\s*$", test_name)
        if match:
            test_name = match.group(1).strip()
            candidate = match.group(2).strip()
            looks_like_abbreviation = (
                bool(candidate)
                and len(candidate) <= 8
                and (candidate.isupper() or " " not in candidate)
            )
            if not abbreviation and looks_like_abbreviation:
                abbreviation = candidate or None

        status = str(item.get("status") or "UNSPECIFIED").upper()
        if status not in {"NORMAL", "HIGH", "LOW", "UNSPECIFIED"}:
            status = "UNSPECIFIED"

        extracted_value = (
            item.get("value")
            if item.get("value") is not None
            else item.get("result", "")
        )
        systolic = item.get("systolic")
        diastolic = item.get("diastolic")
        if (
            extracted_value in (None, "")
            and systolic is not None
            and diastolic is not None
        ):
            extracted_value = f"{systolic}/{diastolic}"

        metrics.append(
            {
                "biomarker_name": test_name,
                "extracted_abbreviation": abbreviation,
                "value": str(extracted_value if extracted_value is not None else ""),
                "unit": item.get("unit") or item.get("units"),
                "status": status,
                "value_raw": item.get("value_raw") or item.get("raw_value"),
                "unit_raw": item.get("unit_raw"),
                "value_normalized": item.get("value_normalized"),
                "numeric_value": item.get("numeric_value"),
                "systolic": systolic,
                "diastolic": diastolic,
                "canonical_key": item.get("canonical_key"),
                "confidence": item.get("confidence"),
            }
        )

    return {
        "patient": patient_raw,
        "patient_demographics_found": patient_demographics_found,
        "metrics": metrics,
    }


def _confidence_for_metric(
    normalized: Any, canonical: str | None, config: dict[str, Any]
) -> float:
    weights = config.get("confidence_weights", {})
    if canonical == "blood_pressure" and normalized.systolic is not None:
        return float(weights.get("validated_llm", 0.85))
    if normalized.numeric_value is not None:
        if normalized.unit:
            return float(weights.get("validated_llm", 0.85))
        return float(weights.get("llm_numeric_no_unit", 0.7))
    if normalized.value_raw:
        return float(weights.get("llm_qualitative", 0.6))
    return float(weights.get("ambiguous", 0.5))


def _build_metrics(
    raw_metrics: list[dict[str, Any]],
    config: dict[str, Any],
) -> list[MedicalMetric]:
    metrics: list[MedicalMetric] = []

    for item in raw_metrics:
        name = str(item.get("biomarker_name") or "").strip()
        if not name:
            continue

        abbreviation = item.get("extracted_abbreviation")
        canonical = item.get("canonical_key") or canonical_key(name, abbreviation)
        raw_value = item.get("value")
        unit = item.get("unit")
        normalized = normalize_metric_value(
            raw_value,
            name=name,
            abbreviation=abbreviation,
            unit=unit,
            canonical=canonical,
        )

        supplied_systolic = item.get("systolic")
        supplied_diastolic = item.get("diastolic")
        if (
            canonical == "blood_pressure"
            and supplied_systolic is not None
            and supplied_diastolic is not None
            and normalized.systolic is None
        ):
            try:
                normalized.systolic = float(supplied_systolic)
                normalized.diastolic = float(supplied_diastolic)
                normalized.numeric_value = normalized.systolic
                normalized.value_normalized = (
                    f"{normalized.systolic:g}/{normalized.diastolic:g}"
                )
            except (TypeError, ValueError):
                LOGGER.warning(
                    "Invalid systolic/diastolic values from LLM",
                    extra={"metric": name, "systolic": supplied_systolic, "diastolic": supplied_diastolic},
                )

        status = str(item.get("status") or "UNSPECIFIED").upper()
        if status not in {"NORMAL", "HIGH", "LOW", "UNSPECIFIED"}:
            status = "UNSPECIFIED"

        metric = MedicalMetric(
            biomarker_name=display_name(canonical, name),
            extracted_abbreviation=abbreviation,
            value=str(raw_value) if raw_value is not None else "",
            value_raw=item.get("value_raw") or (str(raw_value) if raw_value is not None else ""),
            value_normalized=item.get("value_normalized") or normalized.value_normalized,
            numeric_value=(
                item.get("numeric_value")
                if item.get("numeric_value") is not None
                else normalized.numeric_value
            ),
            systolic=normalized.systolic if normalized.systolic is not None else item.get("systolic"),
            diastolic=normalized.diastolic if normalized.diastolic is not None else item.get("diastolic"),
            unit=normalized.unit,
            unit_raw=item.get("unit_raw") or normalized.unit_raw,
            comparator=normalized.comparator,
            status=status,
            status_source="unavailable",
            confidence=(
                float(item["confidence"])
                if item.get("confidence") is not None
                else _confidence_for_metric(normalized, canonical, config)
            ),
            canonical_key=canonical,
        )
        metrics.append(metric)

    return metrics


def _resolve_patient(report_text: str, raw_patient: Any) -> ExtractedPatient:
    deterministic = extract_patient(report_text)
    llm_patient = sanitize_patient_dict(raw_patient if isinstance(raw_patient, dict) else None)
    merged = merge_patients(deterministic, llm_patient)
    LOGGER.info(
        "Patient demographics resolved",
        extra={
            "found": merged.has_any,
            "fields": [key for key, value in merged.to_dict().items() if value is not None],
        },
    )
    return merged


def parse_medical_text(
    report_text: str,
    doc_type: DocumentType = "lab_report",
    *,
    llm_callable: LLMCallable | None = None,
    evaluator: ReferenceRangeEvaluator | None = None,
    extraction_config: dict[str, Any] | None = None,
    ocr_result: OcrResult | None = None,
) -> LabReportExtractionSchema | PrescriptionExtractionSchema:
    if not report_text or not report_text.strip():
        raise ValueError("No readable text was extracted from the document")

    config = extraction_config or load_extraction_config()
    content = _invoke_llm(report_text, doc_type, llm_callable)

    if doc_type == "prescription":
        try:
            return PrescriptionExtractionSchema.model_validate_json(content)
        except Exception as exc:
            LOGGER.error(
                "Prescription extraction validation failed",
                extra={"snippet": content[:500], "error": str(exc)},
            )
            raise RuntimeError(f"Invalid prescription extraction output: {exc}") from exc

    normalized_raw = normalize_groq_output(content)
    metrics = _build_metrics(normalized_raw.get("metrics", []), config)
    LOGGER.info("Metrics extracted", extra={"count": len(metrics)})

    patient = _resolve_patient(report_text, normalized_raw.get("patient"))

    metrics = deduplicate_metrics(metrics)
    apply_reference_ranges(
        metrics,
        age=patient.age,
        gender=patient.gender,
        evaluator=evaluator,
    )

    confidence = compute_confidence(
        metrics,
        patient,
        ocr_confidence=ocr_result.ocr_confidence if ocr_result else None,
        ocr_used=ocr_result.used_ocr if ocr_result else False,
        doc_type=doc_type,
        config=config,
    )

    schema = LabReportExtractionSchema(
        patient=PatientDemographics(**patient.to_dict()),
        patient_demographics_found=patient.has_any,
        metrics=metrics,
        confidence=ConfidenceMetrics(**confidence),
        source=ExtractionSource(
            used_ocr=ocr_result.used_ocr if ocr_result else False,
            ocr_confidence=ocr_result.ocr_confidence if ocr_result else None,
            page_count=ocr_result.page_count if ocr_result else 0,
            ocr_pages=ocr_result.ocr_pages if ocr_result else [],
        ),
    )

    LOGGER.info(
        "Structured extraction completed",
        extra={
            "metrics": len(schema.metrics),
            "demographics_found": schema.patient_demographics_found,
            "extraction_confidence": schema.confidence.extraction,
            "completeness": schema.confidence.completeness,
            "used_ocr": schema.source.used_ocr,
        },
    )
    return schema


def parse_medical_pdf(
    pdf_path: str | Path,
    doc_type: DocumentType = "lab_report",
    *,
    llm_callable: LLMCallable | None = None,
    evaluator: ReferenceRangeEvaluator | None = None,
    extraction_config: dict[str, Any] | None = None,
) -> LabReportExtractionSchema | PrescriptionExtractionSchema:
    pdf_file = Path(pdf_path)
    if not pdf_file.exists():
        raise FileNotFoundError(f"PDF file not found: {pdf_path}")

    ocr_result = OCRService.extract_document(pdf_file)
    report_text = ocr_result.text
    if not report_text:
        raise ValueError("No readable text was extracted from the PDF")

    return parse_medical_text(
        report_text,
        doc_type,
        llm_callable=llm_callable,
        evaluator=evaluator,
        extraction_config=extraction_config,
        ocr_result=ocr_result,
    )
