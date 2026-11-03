from __future__ import annotations

import re
from dataclasses import dataclass, field
from typing import Any

MISSING_TOKENS = {
    "",
    "-",
    "--",
    "n/a",
    "na",
    "nil",
    "none",
    "not available",
    "not done",
    "unknown",
}

CANONICAL_ALIASES: dict[str, tuple[str, ...]] = {
    "blood_pressure": (
        "bloodpressure",
        "bp",
        "bp systolic diastolic",
        "systolicdiastolic",
        "systolic diastolic blood pressure",
    ),
    "temperature": (
        "temperature",
        "temp",
        "bodytemperature",
        "bodytemp",
        "temperaturecelsius",
    ),
    "pulse": (
        "pulse",
        "pulserate",
        "heartrate",
        "hr",
        "heartratepulse",
        "beatsperminute",
    ),
    "respiratory_rate": (
        "respiratoryrate",
        "respiratory",
        "respirationrate",
        "resp",
        "resprate",
        "rr",
        "breathingrate",
    ),
    "spo2": (
        "spo2",
        "spoz",
        "sp02",
        "spo2roomair",
        "oxygensaturation",
        "o2saturation",
        "sao2",
        "oxygensat",
        "o2sat",
    ),
    "hemoglobin": (
        "hemoglobin",
        "haemoglobin",
        "hb",
        "hgb",
        "hemoglobinconcentration",
        "hbconcentration",
    ),
    "wbc": (
        "wbc",
        "wbccount",
        "totalwbccount",
        "whitebloodcellcount",
        "whitebloodcells",
        "tlc",
        "totalleucocytecount",
        "totalleukocytecount",
        "leucocytecount",
        "leukocytecount",
    ),
    "neutrophils": (
        "neutrophils",
        "neutrophil",
        "neutrophilcount",
        "neutrophilspercent",
        "neutrophils",
        "polymorphs",
    ),
    "crp": (
        "crp",
        "creactiveprotein",
        "c reactive protein",
        "hs CRP".lower().replace(" ", ""),
        "crpquantitative",
    ),
    "fasting_glucose": (
        "fastingbloodglucose",
        "fastingglucose",
        "fbg",
        "fbs",
        "fastingbloodsugar",
    ),
    "post_prandial_glucose": (
        "postprandialbloodglucose",
        "postprandialglucose",
        "ppbg",
        "ppbs",
        "postprandialbloodsugar",
        "postprandial",
    ),
    "random_glucose": (
        "randomsugar",
        "randombloodsugar",
        "randombloodglucose",
        "randomglucose",
        "rbs",
    ),
    "hba1c": (
        "hba1c",
        "a1c",
        "glycatedhemoglobin",
        "glycosylatedhemoglobin",
    ),
    "estimated_average_glucose": (
        "estimatedaverageglucose",
        "eag",
        "averageglucose",
    ),
}

METRIC_DISPLAY_NAMES: dict[str, str] = {
    "blood_pressure": "Blood Pressure",
    "temperature": "Temperature",
    "pulse": "Pulse",
    "respiratory_rate": "Respiratory Rate",
    "spo2": "SpO2",
    "hemoglobin": "Hemoglobin",
    "wbc": "Total WBC Count",
    "neutrophils": "Neutrophils",
    "crp": "CRP",
    "fasting_glucose": "Fasting Blood Glucose",
    "post_prandial_glucose": "Post Prandial Blood Glucose",
    "random_glucose": "Random Blood Sugar",
    "hba1c": "HbA1c",
    "estimated_average_glucose": "Estimated Average Glucose",
}


ALIAS_LOOKUP: dict[str, str] = {}
for _canonical, _aliases in CANONICAL_ALIASES.items():
    ALIAS_LOOKUP[_canonical.replace("_", "")] = _canonical
    for _alias in _aliases:
        ALIAS_LOOKUP[_alias.replace(" ", "").replace("_", "").lower()] = _canonical


UNIT_ALIASES: dict[str, str] = {
    "mmhg": "mmHg",
    "mm hg": "mmHg",
    "millimetersofmercury": "mmHg",
    "°c": "°C",
    "degc": "°C",
    "deg c": "°C",
    "celsius": "°C",
    "degreecelsius": "°C",
    "°f": "°F",
    "deg f": "°F",
    "degf": "°F",
    "degrees f": "°F",
    "degreesf": "°F",
    "fahrenheit": "°F",
    "degreefahrenheit": "°F",
    "degree fahrenheit": "°F",
    "%": "%",
    "percent": "%",
    "bpm": "beats/min",
    "beats/min": "beats/min",
    "beats/minute": "beats/min",
    "beats per minute": "beats/min",
    "breaths/min": "breaths/min",
    "breaths/minute": "breaths/min",
    "breaths per minute": "breaths/min",
    "resp/min": "breaths/min",
    "g/dl": "g/dL",
    "gm/dl": "g/dL",
    "gms/dl": "g/dL",
    "gram/dl": "g/dL",
    "g/l": "g/dL",
    "mg/dl": "mg/dL",
    "mg/l": "mg/L",
    "u/l": "U/L",
    "iu/l": "U/L",
    "mmol/l": "mmol/L",
    "cells/ul": "cells/µL",
    "cells/µl": "cells/µL",
    "cells/mcl": "cells/µL",
    "cells/mm3": "cells/µL",
    "10^3/ul": "cells/µL",
    "10^3/µl": "cells/µL",
    "10*3/ul": "cells/µL",
    "x10^3/ul": "cells/µL",
    "x10^3/µl": "cells/µL",
    "10^9/l": "cells/µL",
    "k/ul": "cells/µL",
    "k/µl": "cells/µL",
}

# Multipliers applied when a unit is normalised (value * factor).
# Keys are lower-cased with micro signs normalised to "u".
UNIT_FACTORS: dict[str, float] = {
    "g/l": 0.1,
    "10^3/ul": 1000.0,
    "x10^3/ul": 1000.0,
    "10^9/l": 1000.0,
    "k/ul": 1000.0,
}

COMPOUND_RE = re.compile(
    r"(?P<systolic>\d{2,3}(?:[.,]\d+)?)\s*(?:/|over)\s*(?P<diastolic>\d{2,3}(?:[.,]\d+)?)",
    re.IGNORECASE,
)
NUMBER_RE = re.compile(r"[-+]?\d+(?:[.,]\d+)?")
THOUSANDS_RE = re.compile(r"^\d{1,3}(?:,\d{3})+(?:\.\d+)?$")
DECIMAL_COMMA_RE = re.compile(r"^\d+,\d{1,2}$")
COMPARATOR_RE = re.compile(r"^\s*(<=|>=|≤|≥|<|>|=|~)\s*")


@dataclass
class ParsedMeasurement:
    numeric: float | None = None
    systolic: float | None = None
    diastolic: float | None = None
    comparator: str | None = None
    raw: str = ""
    normalized_text: str | None = None


@dataclass
class NormalizedMetricValue:
    value_raw: str
    value_normalized: str | None = None
    numeric_value: float | None = None
    systolic: float | None = None
    diastolic: float | None = None
    unit: str | None = None
    unit_raw: str | None = None
    comparator: str | None = None
    notes: list[str] = field(default_factory=list)


def _compact_name(value: str) -> str:
    cleaned = value.lower()
    for source, target in (
        ("µ", "u"),
        ("μ", "u"),
        ("₂", "2"),
        ("²", "2"),
        ("°", ""),
        ("°c", "c"),
    ):
        cleaned = cleaned.replace(source, target)
    cleaned = re.sub(r"\([^)]*\)", " ", cleaned)
    cleaned = re.sub(r"[^a-z0-9]+", "", cleaned)
    return cleaned


def canonical_key(name: str | None, abbreviation: str | None = None) -> str | None:
    for candidate in (abbreviation, name):
        if not candidate:
            continue
        compact = _compact_name(str(candidate))
        if not compact:
            continue
        if compact in ALIAS_LOOKUP:
            return ALIAS_LOOKUP[compact]
        # Handle decorated names such as "SpO2 (room air)".
        for alias, canonical in ALIAS_LOOKUP.items():
            if len(alias) >= 3 and (compact.startswith(alias) or compact.endswith(alias)):
                return canonical
    return None


def display_name(canonical: str | None, fallback: str) -> str:
    """Return a stable, human-readable name for a recognized analyte."""
    if canonical:
        preferred = METRIC_DISPLAY_NAMES.get(canonical)
        if preferred:
            return preferred
    return fallback


def _numeric_text(value: str) -> str:
    cleaned = value.strip().replace("\u2212", "-").replace("\u00a0", " ")
    cleaned = cleaned.replace(" ", "")
    if THOUSANDS_RE.match(cleaned):
        return cleaned.replace(",", "")
    if DECIMAL_COMMA_RE.match(cleaned):
        return cleaned.replace(",", ".")
    return cleaned.replace(",", "")


def parse_measurement(value: Any, *, allow_compound: bool = True) -> ParsedMeasurement:
    raw = "" if value is None else str(value).strip()
    if not raw or raw.lower() in MISSING_TOKENS:
        return ParsedMeasurement(raw=raw)

    if isinstance(value, bool):
        return ParsedMeasurement(raw=raw)

    comparator = None
    comparator_match = COMPARATOR_RE.match(raw)
    working = raw
    if comparator_match:
        comparator = comparator_match.group(1)
        working = raw[comparator_match.end() :]

    if allow_compound:
        compound = COMPOUND_RE.search(working)
        if compound:
            systolic = _to_float(_numeric_text(compound.group("systolic")))
            diastolic = _to_float(_numeric_text(compound.group("diastolic")))
            if (
                systolic is not None
                and diastolic is not None
                and 40 <= systolic <= 400
                and 20 <= diastolic <= 300
            ):
                return ParsedMeasurement(
                    numeric=systolic,
                    systolic=systolic,
                    diastolic=diastolic,
                    comparator=comparator,
                    raw=raw,
                    normalized_text=f"{format_number(systolic)}/{format_number(diastolic)}",
                )

    numeric_match = NUMBER_RE.search(working)
    if not numeric_match:
        return ParsedMeasurement(raw=raw, comparator=comparator)

    numeric = _to_float(_numeric_text(numeric_match.group(0)))
    return ParsedMeasurement(
        numeric=numeric,
        comparator=comparator,
        raw=raw,
        normalized_text=format_number(numeric),
    )


def _to_float(value: str | None) -> float | None:
    if value in (None, ""):
        return None
    try:
        return float(value)
    except (TypeError, ValueError):
        return None


def format_number(value: float | int | None) -> str | None:
    if value is None:
        return None
    number = float(value)
    if number.is_integer():
        return str(int(number))
    return f"{number:.10g}"


def normalize_unit(
    unit: str | None, canonical: str | None = None
) -> tuple[str | None, float]:
    if unit is None:
        return None, 1.0

    cleaned = str(unit).strip()
    if not cleaned:
        return None, 1.0
    cleaned = (
        cleaned.replace("µ", "u")
        .replace("μ", "u")
        .replace("／", "/")
        .replace("\u00a0", " ")
    )
    lowered = re.sub(r"\s+", " ", cleaned.lower()).strip()

    factor = UNIT_FACTORS.get(lowered, 1.0)
    alias_target = UNIT_ALIASES.get(lowered)
    if alias_target:
        return alias_target, factor

    if lowered in {"c", "f"}:
        return ("°C" if lowered == "c" else "°F"), factor

    if lowered in {"/min", "min-1", "min^-1", "per min"}:
        if canonical == "respiratory_rate":
            return "breaths/min", factor
        if canonical == "pulse":
            return "beats/min", factor
        return "/min", factor

    # Preserve unrecognised units as-is instead of silently dropping them.
    return cleaned, factor


def normalize_metric_value(
    raw_value: Any,
    *,
    name: str | None = None,
    abbreviation: str | None = None,
    unit: str | None = None,
    canonical: str | None = None,
) -> NormalizedMetricValue:
    canonical = canonical or canonical_key(name, abbreviation)
    unit_raw = unit
    unit_normalized, factor = normalize_unit(unit, canonical)

    measurement = parse_measurement(raw_value, allow_compound=True)
    result = NormalizedMetricValue(
        value_raw=str(raw_value).strip() if raw_value is not None else "",
        unit=unit_normalized,
        unit_raw=unit_raw,
        comparator=measurement.comparator,
    )

    is_bp = canonical == "blood_pressure"
    if is_bp:
        if measurement.systolic is not None and measurement.diastolic is not None:
            result.systolic = measurement.systolic * factor
            result.diastolic = measurement.diastolic * factor
            result.numeric_value = result.systolic
            result.value_normalized = (
                f"{format_number(result.systolic)}/{format_number(result.diastolic)}"
            )
        elif measurement.numeric is not None:
            result.numeric_value = measurement.numeric * factor
            result.value_normalized = format_number(result.numeric_value)
            result.notes.append("blood_pressure_incomplete")
        else:
            result.value_normalized = result.value_raw or None
            result.notes.append("blood_pressure_missing")
    else:
        if measurement.numeric is not None:
            result.numeric_value = measurement.numeric * factor
            if canonical == "temperature" and result.unit == "°F":
                result.numeric_value = round((result.numeric_value - 32) * 5 / 9, 2)
                result.unit = "°C"
                result.notes.append("converted_from_fahrenheit")
            prefix = measurement.comparator or ""
            result.value_normalized = f"{prefix}{format_number(result.numeric_value)}"
        else:
            result.value_normalized = result.value_raw or None

    if result.numeric_value is None and canonical is not None:
        result.notes.append("numeric_value_missing")

    return result


def deduplicate_metrics(metrics: list[Any]) -> list[Any]:
    """Merge duplicate analytes while preserving first-seen order.

    Works with any object exposing the expected metric attributes (the
    Pydantic ``MedicalMetric`` model in this project).
    """
    chosen: dict[str, Any] = {}
    order: list[str] = []

    for metric in metrics:
        canonical = getattr(metric, "canonical_key", None)
        if not canonical:
            canonical = "name:" + _compact_name(str(getattr(metric, "biomarker_name", "")))
        if canonical not in chosen:
            chosen[canonical] = metric
            order.append(canonical)
            continue

        existing = chosen[canonical]
        if _metric_score(metric) > _metric_score(existing):
            _merge_missing(metric, existing)
            chosen[canonical] = metric
        else:
            _merge_missing(existing, metric)

    return [chosen[key] for key in order]


def _metric_score(metric: Any) -> float:
    score = 0.0
    if getattr(metric, "numeric_value", None) is not None:
        score += 4.0
    if getattr(metric, "systolic", None) is not None and getattr(
        metric, "diastolic", None
    ) is not None:
        score += 2.0
    if getattr(metric, "unit", None):
        score += 1.0
    score += float(getattr(metric, "confidence", 0.0) or 0.0)
    return score


def _merge_missing(target: Any, source: Any) -> None:
    for field in (
        "unit",
        "unit_raw",
        "reference_range",
        "numeric_value",
        "systolic",
        "diastolic",
        "value_normalized",
        "extracted_abbreviation",
    ):
        if getattr(target, field, None) in (None, "", []) and getattr(source, field, None) not in (
            None,
            "",
            [],
        ):
            try:
                setattr(target, field, getattr(source, field))
            except (AttributeError, ValueError, TypeError):
                continue
