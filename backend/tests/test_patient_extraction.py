from __future__ import annotations

import unittest

from app.services.patient_extractor import (
    extract_patient,
    merge_patients,
    sanitize_patient_dict,
)
from tests.support import read_fixture


class PatientExtractionTests(unittest.TestCase):
    def test_combined_age_and_sex(self) -> None:
        patient = extract_patient("Age / Sex: 58 years / Male")
        self.assertEqual(patient.age, 58)
        self.assertEqual(patient.gender, "Male")

    def test_separate_age_and_sex(self) -> None:
        patient = extract_patient("Age: 58 years\nSex: Male")
        self.assertEqual(patient.age, 58)
        self.assertEqual(patient.gender, "Male")

    def test_alternate_demographic_formats(self) -> None:
        cases = [
            ("58 Y/M", 58, "Male"),
            ("58 years, Female", 58, "Female"),
            ("Age / Gender: 46 / F", 46, "Female"),
            ("Sex: Other", None, "Other"),
        ]
        for text, age, gender in cases:
            with self.subTest(text=text):
                patient = extract_patient(text)
                self.assertEqual(patient.age, age)
                self.assertEqual(patient.gender, gender)

    def test_missing_demographics_are_none_not_zero(self) -> None:
        patient = extract_patient("VITAL SIGNS\nTemperature 37.0 °C")
        self.assertIsNone(patient.name)
        self.assertIsNone(patient.age)
        self.assertIsNone(patient.gender)
        self.assertIsNone(patient.patient_id)
        self.assertIsNone(patient.referring_physician)
        self.assertFalse(patient.has_any)

    def test_explicit_zero_age_is_rejected(self) -> None:
        patient = extract_patient("Age: 0 years\nSex: Male")
        self.assertIsNone(patient.age)

    def test_name_id_and_referrer_with_annotations(self) -> None:
        text = (
            "Patient Name: SAMPLE PATIENT Patient ID: DEMO-PT-2026-0417\n"
            "Referring Clinician: Dr. A. Sharma (Fictional)"
        )
        patient = extract_patient(text)
        self.assertEqual(patient.name, "SAMPLE PATIENT")
        self.assertEqual(patient.patient_id, "DEMO-PT-2026-0417")
        self.assertEqual(patient.referring_physician, "Dr. A. Sharma")

    def test_no_hallucination_on_empty_text(self) -> None:
        patient = extract_patient("")
        self.assertEqual(patient.to_dict(), {
            "name": None,
            "age": None,
            "gender": None,
            "patient_id": None,
            "referring_physician": None,
        })

    def test_alternate_layout_fixture(self) -> None:
        patient = extract_patient(read_fixture("alt_layout.txt"))
        self.assertEqual(patient.name, "Priya Verma")
        self.assertEqual(patient.age, 58)
        self.assertEqual(patient.gender, "Female")
        self.assertEqual(patient.patient_id, "ALT-00042")
        self.assertEqual(patient.referring_physician, "Dr. R. Nair")

    def test_sanitize_llm_patient_does_not_invent_values(self) -> None:
        patient = sanitize_patient_dict(
            {"name": "Not specified", "age": "0", "gender": "unknown"}
        )
        self.assertIsNone(patient.name)
        self.assertIsNone(patient.age)
        self.assertIsNone(patient.gender)

    def test_merge_prefers_deterministic_and_fills_gaps(self) -> None:
        deterministic = extract_patient("Age / Sex: 58 years / Male")
        llm = sanitize_patient_dict(
            {"name": "SAMPLE PATIENT", "age": 60, "gender": "Female"}
        )
        merged = merge_patients(deterministic, llm)
        self.assertEqual(merged.age, 58)
        self.assertEqual(merged.gender, "Male")
        self.assertEqual(merged.name, "SAMPLE PATIENT")


if __name__ == "__main__":
    unittest.main()
