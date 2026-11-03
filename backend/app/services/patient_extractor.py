from __future__ import annotations

import re
from dataclasses import dataclass, field
from typing import Any

GENDER_MAP = {
    "m": "Male",
    "male": "Male",
    "man": "Male",
    "boy": "Male",
    "f": "Female",
    "female": "Female",
    "woman": "Female",
    "girl": "Female",
    "o": "Other",
    "other": "Other",
    "nonbinary": "Other",
    "non-binary": "Other",
}

MISSING_VALUES = {
    "",
    "-",
    "--",
    "n/a",
    "na",
    "nil",
    "none",
    "not specified",
    "not mentioned",
    "unknown",
    "unavailable",
}

ANNOTATION_RE = re.compile(
    r"\s*\((?:fictional|sample|synthetic|demo|dummy|test|testing)\)\s*$",
    re.IGNORECASE,
)

# Stops a captured value at the next label that appears on the same OCR line.
NEXT_LABEL_RE = re.compile(
    r"\s+(?=(?:patient\s*(?:id|name)|pt\.?\s*name|name|date|age|sex|gender|"
    r"department|report\s*(?:no|number)|referring|referred\s*by|status|"
    r"address|phone|mrn|uhid|sample\s*id)\s*[:=])",
    re.IGNORECASE,
)

# Label/value separator: either "Label: value" on one line or a label on its
# own line followed by the value on the next line (common in PDF text layers).
LABEL_SEP = r"(?:\s*[:\-]\s*|[ \t]*\n\s*)"

NAME_PATTERNS = [
    re.compile(
        r"patient\s*(?:full\s*)?name" + LABEL_SEP + r"(?P<value>[^\n]+)",
        re.IGNORECASE,
    ),
    re.compile(
        r"name\s*of\s*(?:the\s*)?patient" + LABEL_SEP + r"(?P<value>[^\n]+)",
        re.IGNORECASE,
    ),
    re.compile(
        r"pt\.?\s*name" + LABEL_SEP + r"(?P<value>[^\n]+)",
        re.IGNORECASE,
    ),
]

COMBINED_AGE_SEX_PATTERNS = [
    re.compile(
        r"age\s*(?:/|and|&)\s*(?:sex|gender)" + LABEL_SEP + r"(?P<value>[^\n]+)",
        re.IGNORECASE,
    ),
    re.compile(
        r"(?P<age>\d{1,3})\s*(?:years?|yrs?|y)\s*(?:/|,|-|\s)\s*"
        r"(?P<gender>male|female|m|f)\b",
        re.IGNORECASE,
    ),
]

AGE_PATTERNS = [
    re.compile(r"\bage\b\s*" + LABEL_SEP + r"(?P<value>[^\n]+)", re.IGNORECASE),
]

GENDER_PATTERNS = [
    re.compile(
        r"\b(?:sex|gender)\b\s*" + LABEL_SEP + r"(?P<value>[^\n]+)",
        re.IGNORECASE,
    ),
]

PATIENT_ID_PATTERNS = [
    re.compile(
        r"(?:patient\s*(?:id|identifier)|mrn|uhid|"
        r"registration\s*(?:no|number)?|reg\.?\s*(?:no|number)|hospital\s*(?:no|number))"
        + LABEL_SEP
        + r"(?P<value>[^\n]+)",
        re.IGNORECASE,
    ),
]

REFERRING_PATTERNS = [
    re.compile(
        r"(?:referring\s*(?:clinician|physician|doctor|consultant)|referred\s*by|referrer)"
        + LABEL_SEP
        + r"(?P<value>[^\n]+)",
        re.IGNORECASE,
    ),
    re.compile(
        r"(?:consultant|treating\s*(?:doctor|physician)|primary\s*physician|"
        r"physician|doctor)\s*[:\-]\s*(?P<value>[^\n]+)",
        re.IGNORECASE,
    ),
]

AGE_VALUE_RE = re.compile(r"(?<!\d)(\d{1,3})(?!\d)")
NAME_REJECT_RE = re.compile(
    r"\b(?:report|date|age|sex|gender|department|status|address|phone|"
    r"details|history|complaint|number|name|id|mrn|uhid)\b",
    re.IGNORECASE,
)


@dataclass
class ExtractedPatient:
    name: str | None = None
    age: int | None = None
    gender: str | None = None
    patient_id: str | None = None
    referring_physician: str | None = None
    field_confidence: dict[str, float] = field(default_factory=dict)

    def to_dict(self) -> dict[str, Any]:
        return {
            "name": self.name,
            "age": self.age,
            "gender": self.gender,
            "patient_id": self.patient_id,
            "referring_physician": self.referring_physician,
        }

    @property
    def has_any(self) -> bool:
        return any(
            value is not None
            for value in (
                self.name,
                self.age,
                self.gender,
                self.patient_id,
                self.referring_physician,
            )
        )


def normalize_gender(value: Any) -> str | None:
    if value is None:
        return None
    cleaned = str(value).strip().lower()
    if not cleaned:
        return None
    if cleaned in MISSING_VALUES:
        return None
    return GENDER_MAP.get(cleaned)


def parse_age(value: Any) -> int | None:
    if value is None or isinstance(value, bool):
        return None
    if isinstance(value, int):
        return value if 1 <= value <= 130 else None
    if isinstance(value, float):
        return int(value) if 1 <= value <= 130 else None

    cleaned = str(value).strip()
    if not cleaned or cleaned.lower() in MISSING_VALUES:
        return None

    match = AGE_VALUE_RE.search(cleaned)
    if not match:
        return None
    age = int(match.group(1))
    return age if 1 <= age <= 130 else None


def parse_age_sex(value: Any) -> tuple[int | None, str | None]:
    """Parse values such as '58 years / Male', '58/M', 'Male 58'."""
    if value is None:
        return None, None
    if isinstance(value, (int, float)) and not isinstance(value, bool):
        return parse_age(value), None

    cleaned = str(value).strip()
    if not cleaned or cleaned.lower() in MISSING_VALUES:
        return None, None

    age = parse_age(cleaned)
    gender = normalize_gender(cleaned)
    if gender is None:
        lowered = cleaned.lower()
        for candidate in ("male", "female", "other"):
            if candidate in lowered:
                gender = normalize_gender(candidate)
                break
    if gender is None:
        match = re.search(r"(?:^|[\s/,|])([mf])(?:$|[\s/,|])", cleaned, re.IGNORECASE)
        if match:
            gender = normalize_gender(match.group(1))
    return age, gender


def _clean_capture(raw: str | None) -> str | None:
    if raw is None:
        return None

    value = raw.replace("\u00a0", " ")
    value = value.split("\n")[0]
    value = NEXT_LABEL_RE.split(value, maxsplit=1)[0]
    value = value.strip(" \t\r\n.,;:-|")
    value = ANNOTATION_RE.sub("", value).strip()
    value = re.sub(r"\s+", " ", value)

    if not value or value.lower() in MISSING_VALUES:
        return None
    if set(value) <= set("-–—_. "):
        return None
    return value


def _is_valid_name(value: str | None) -> bool:
    if not value or len(value) < 2 or len(value) > 90:
        return False
    if not any(char.isalpha() for char in value):
        return False
    if re.fullmatch(r"[\d\s./-]+", value):
        return False
    if NAME_REJECT_RE.search(value):
        return False
    return True


def _first_capture(patterns: list[re.Pattern[str]], text: str) -> re.Match[str] | None:
    for pattern in patterns:
        match = pattern.search(text)
        if match:
            return match
    return None


def extract_patient(text: str) -> ExtractedPatient:
    patient = ExtractedPatient()
    if not text:
        return patient

    normalized = text.replace("\r\n", "\n").replace("\r", "\n")

    name_match = _first_capture(NAME_PATTERNS, normalized)
    if name_match:
        name = _clean_capture(name_match.group("value"))
        if _is_valid_name(name):
            patient.name = name
            patient.field_confidence["patient.name"] = 0.95

    age: int | None = None
    gender: str | None = None
    age_sex_match = _first_capture(COMBINED_AGE_SEX_PATTERNS, normalized)
    if age_sex_match:
        groups = age_sex_match.groupdict()
        if groups.get("age") is not None:
            age = parse_age(groups["age"])
        if groups.get("gender") is not None:
            gender = normalize_gender(groups["gender"])
        if age is None and gender is None:
            age, gender = parse_age_sex(_clean_capture(groups.get("value")))
        else:
            if groups.get("value"):
                parsed_age, parsed_gender = parse_age_sex(
                    _clean_capture(groups.get("value"))
                )
                age = age if age is not None else parsed_age
                gender = gender if gender is not None else parsed_gender

    if age is None:
        age_match = _first_capture(AGE_PATTERNS, normalized)
        if age_match:
            age = parse_age(_clean_capture(age_match.group("value")))

    if gender is None:
        gender_match = _first_capture(GENDER_PATTERNS, normalized)
        if gender_match:
            gender = normalize_gender(_clean_capture(gender_match.group("value")))

    if age is not None:
        patient.age = age
        patient.field_confidence["patient.age"] = 0.95
    if gender is not None:
        patient.gender = gender
        patient.field_confidence["patient.gender"] = 0.95

    id_match = _first_capture(PATIENT_ID_PATTERNS, normalized)
    if id_match:
        patient_id = _clean_capture(id_match.group("value"))
        if patient_id:
            patient.patient_id = patient_id
            patient.field_confidence["patient.patient_id"] = 0.95

    referring_match = _first_capture(REFERRING_PATTERNS, normalized)
    if referring_match:
        doctor = _clean_capture(referring_match.group("value"))
        if doctor and any(char.isalpha() for char in doctor):
            patient.referring_physician = doctor
            patient.field_confidence["patient.referring_physician"] = 0.95

    return patient


def sanitize_patient_dict(raw: dict[str, Any] | None) -> ExtractedPatient:
    """Validate an LLM-provided patient block without inventing values."""
    patient = ExtractedPatient()
    if not isinstance(raw, dict):
        return patient

    def pick(*keys: str) -> Any:
        for key in keys:
            if key in raw and raw[key] not in (None, ""):
                return raw[key]
        return None

    raw_name = pick("name", "patient_name", "full_name", "patient")
    name = _clean_capture(str(raw_name)) if raw_name is not None else None
    if _is_valid_name(name):
        patient.name = name
        patient.field_confidence["patient.name"] = 0.75

    age = parse_age(pick("age", "years", "age_years"))
    if age is not None:
        patient.age = age
        patient.field_confidence["patient.age"] = 0.75

    gender = normalize_gender(pick("gender", "sex"))
    if gender is None:
        _, gender = parse_age_sex(pick("age_sex", "age_gender"))
    if gender is not None:
        patient.gender = gender
        patient.field_confidence["patient.gender"] = 0.75

    raw_patient_id = pick("patient_id", "patientId", "mrn", "uhid", "id")
    patient_id = (
        _clean_capture(str(raw_patient_id)) if raw_patient_id is not None else None
    )
    if patient_id and patient_id.lower() not in MISSING_VALUES:
        patient.patient_id = patient_id
        patient.field_confidence["patient.patient_id"] = 0.75

    raw_doctor = pick(
        "referring_physician",
        "referring_doctor",
        "referring_clinician",
        "referred_by",
        "physician",
        "doctor",
    )
    doctor = _clean_capture(str(raw_doctor)) if raw_doctor is not None else None
    if doctor and any(char.isalpha() for char in doctor):
        patient.referring_physician = doctor
        patient.field_confidence["patient.referring_physician"] = 0.75

    return patient


def merge_patients(
    deterministic: ExtractedPatient,
    llm: ExtractedPatient,
) -> ExtractedPatient:
    """Prefer deterministic matches; use the LLM only to fill genuine gaps."""
    merged = ExtractedPatient()
    for field_name in (
        "name",
        "age",
        "gender",
        "patient_id",
        "referring_physician",
    ):
        deterministic_value = getattr(deterministic, field_name)
        llm_value = getattr(llm, field_name)
        confidence_key = f"patient.{field_name}"
        if deterministic_value is not None:
            setattr(merged, field_name, deterministic_value)
            merged.field_confidence[confidence_key] = deterministic.field_confidence.get(
                confidence_key, 0.95
            )
        elif llm_value is not None:
            setattr(merged, field_name, llm_value)
            merged.field_confidence[confidence_key] = llm.field_confidence.get(
                confidence_key, 0.75
            )
    return merged
