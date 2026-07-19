from __future__ import annotations

import asyncio
import json
import os
import re
from pathlib import Path
from typing import Any, Literal

import httpx
import pytesseract
from pdf2image import convert_from_bytes
from pydantic import BaseModel, Field, field_validator
from pypdf import PdfReader

from app.core.exceptions import ParserServiceError
from app.core.logging import get_logger
from app.schemas.prescription import PrescriptionExtractionSchema

LOGGER = get_logger(__name__)
GROQ_MODEL = os.getenv("GROQ_MODEL", "openai/gpt-oss-120b")
GROQ_CHAT_COMPLETIONS_URL = "https://api.groq.com/openai/v1/chat/completions"

SYSTEM_PROMPT = (
    "You are an advanced clinical data extraction engine. Your job is to extract all health biomarkers, "
    "lab tests, and patient parameters from the provided text into a structured JSON format. "
    "Never drop metrics, values, or units. Return valid JSON matching the schema properties exactly."
)

DocumentType = Literal["lab_report", "prescription"]


class MedicalMetric(BaseModel):
    biomarker_name: str = Field(
        description="The standardized name of the test or metric (e.g., Hemoglobin, WBC Count, Creatinine)."
    )
    extracted_abbreviation: str | None = Field(
        default=None,
        description="The abbreviation as it appeared in the report, if any (e.g., Hb, Hgb, RBC).",
    )
    value: str = Field(
        description="The exact numerical or qualitative value recorded (e.g., 14.2, Negative, 5.5)."
    )
    unit: str | None = Field(
        default=None,
        description="The measurement unit associated with the value (e.g., g/dL, mg/dL, 10^3/uL).",
    )
    status: Literal["NORMAL", "HIGH", "LOW", "UNSPECIFIED"] = Field(
        description="The clinical status flag relative to standard reference ranges."
    )

    # FIXED: Type casting layer to safeguard against integers/floats returned by LLM
    @field_validator("value", mode="before")
    @classmethod
    def coerce_value_to_string(cls, v: Any) -> str:
        if isinstance(v, (int, float)):
            return str(v)
        return str(v) if v is not None else ""


class LabReportExtractionSchema(BaseModel):
    patient_demographics_found: bool = Field(
        description="True if patient name or metadata is explicitly present on the document."
    )
    metrics: list[MedicalMetric] = Field(
        description="A comprehensive array containing all medical biomarkers extracted from the lab report pages."
    )


class ParserService:
    async def parse_pdf(self, pdf_path: Path, doc_type: DocumentType = "lab_report") -> LabReportExtractionSchema | PrescriptionExtractionSchema:
        return await asyncio.to_thread(self._parse_sync, pdf_path, doc_type)

    def _parse_sync(self, pdf_path: Path, doc_type: DocumentType) -> LabReportExtractionSchema | PrescriptionExtractionSchema:
        try:
            parsed = parse_medical_pdf(pdf_path, doc_type)
        except Exception as exc:
            raise ParserServiceError(str(exc)) from exc
        return parsed


def extract_pdf_text(pdf_path: str | Path) -> str:
    pdf_file = Path(pdf_path)
    reader = PdfReader(str(pdf_file))
    pages: list[str] = []

    for page in reader.pages:
        text = page.extract_text() or ""
        if text.strip():
            pages.append(text.strip())

    native_text = "\n\n".join(pages).strip()
    
    if len(native_text) > 50:
        return native_text

    LOGGER.info(f"Native extraction returned insufficient text ({len(native_text)} chars). Falling back to OCR processing.")
    ocr_pages: list[str] = []
    try:
        file_bytes = pdf_file.read_bytes()
        images = convert_from_bytes(file_bytes, dpi=150)
        for i, image in enumerate(images):
            page_text = pytesseract.image_to_string(image)
            if page_text.strip():
                ocr_pages.append(f"--- Page {i+1} ---\n{page_text.strip()}")
    except Exception as e:
        LOGGER.error(f"OCR Execution Error while processing {pdf_file.name}: {str(e)}")
        raise ValueError("Failed to process scanned document text layers.") from e

    return "\n\n".join(ocr_pages).strip()


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
        "Extract every medical test, biomarker, and health metric present in the document text.\n\n"
        "Strict Formatting Rules:\n"
        "- Return a root JSON object with two keys: 'patient_demographics_found' (boolean) and 'metrics' (array of objects).\n"
        "- Each object inside the 'metrics' list MUST have exactly these keys: 'biomarker_name', 'extracted_abbreviation', 'value', 'unit', and 'status'.\n"
        "- 'status' must be exactly one of: 'NORMAL', 'HIGH', 'LOW', or 'UNSPECIFIED'.\n"
        "- Ensure absolutely no biomarkers or numerical results are missing or excluded from the output list.\n\n"
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


def normalize_groq_output(content: str) -> dict[str, Any]:
    """
    Parses LLM output cleanly. Normalizes structural mapping differences and ensures 
    safe field representations before explicit validation checks execute.
    """
    raw = json.loads(content)
    
    # Check if LLM matched our target structure directly
    if isinstance(raw, dict) and "metrics" in raw and isinstance(raw["metrics"], list):
        for metric in raw["metrics"]:
            if isinstance(metric, dict):
                # Safe fallback to guarantee string data structure mapping
                if "value" in metric and metric["value"] is not None:
                    metric["value"] = str(metric["value"])
                
                status = str(metric.get("status", "UNSPECIFIED")).upper()
                metric["status"] = status if status in {"NORMAL", "HIGH", "LOW", "UNSPECIFIED"} else "UNSPECIFIED"
        return {
            "patient_demographics_found": bool(raw.get("patient_demographics_found", False)),
            "metrics": raw["metrics"]
        }
        
    # Legacy Fallback pipeline parsing
    test_items = raw.get("tests") or raw.get("results") or []
    if not isinstance(test_items, list) and isinstance(raw, list):
        test_items = raw
    elif not isinstance(test_items, list):
        test_items = []

    metrics: list[dict[str, Any]] = []
    for item in test_items:
        if not isinstance(item, dict):
            continue

        test_name = str(item.get("biomarker_name") or item.get("name") or item.get("test") or "").strip()
        if not test_name:
            continue
            
        abbreviation = item.get("extracted_abbreviation") or item.get("abbreviation")
        match = re.match(r"^(.*)\(([^)]+)\)\s*$", test_name)
        if match:
            test_name = match.group(1).strip()
            abbreviation = match.group(2).strip() or None

        status = str(item.get("status") or "UNSPECIFIED").upper()
        if status not in {"NORMAL", "HIGH", "LOW", "UNSPECIFIED"}:
            status = "UNSPECIFIED"

        extracted_value = item.get("value") if item.get("value") is not None else item.get("result", "")

        metrics.append(
            {
                "biomarker_name": test_name,
                "extracted_abbreviation": abbreviation,
                "value": str(extracted_value),
                "unit": item.get("unit"),
                "status": status,
            }
        )

    return {
        "patient_demographics_found": bool(raw.get("patient_demographics_found", False) or raw.get("patient")),
        "metrics": metrics,
    }


def parse_medical_pdf(pdf_path: str | Path, doc_type: DocumentType) -> LabReportExtractionSchema | PrescriptionExtractionSchema:
    api_key = os.getenv("GROQ_API_KEY")
    if not api_key:
        raise RuntimeError("GROQ_API_KEY is not set in the environment")

    pdf_file = Path(pdf_path)
    if not pdf_file.exists():
        raise FileNotFoundError(f"PDF file not found: {pdf_path}")

    report_text = extract_pdf_text(pdf_file)
    if not report_text:
        raise ValueError("No readable text was extracted from the PDF")

    content = call_groq(report_text, api_key, doc_type)
    
    if doc_type == "prescription":
        return PrescriptionExtractionSchema.model_validate_json(content)
    
    return LabReportExtractionSchema.model_validate(normalize_groq_output(content))