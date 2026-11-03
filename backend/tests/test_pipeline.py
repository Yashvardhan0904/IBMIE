from __future__ import annotations

import unittest

from app.services.parser_service import parse_medical_pdf, parse_medical_text
from tests.support import (
    FIXTURES,
    PNEUMONIA_METRICS,
    PNEUMONIA_PATIENT,
    fake_llm,
    read_fixture,
)


class PipelineTests(unittest.TestCase):
    def test_pneumonia_regression(self) -> None:
        text = read_fixture("pneumonia_report.txt")
        result = parse_medical_text(
            text,
            llm_callable=fake_llm(PNEUMONIA_METRICS, PNEUMONIA_PATIENT),
        )

        self.assertEqual(result.patient.name, "SAMPLE PATIENT")
        self.assertEqual(result.patient.age, 58)
        self.assertEqual(result.patient.gender, "Male")
        self.assertEqual(result.patient.patient_id, "DEMO-PT-2026-0417")
        self.assertEqual(result.patient.referring_physician, "Dr. A. Sharma")
        self.assertTrue(result.patient_demographics_found)

        metrics = {metric.canonical_key: metric for metric in result.metrics}
        self.assertEqual(metrics["blood_pressure"].systolic, 118)
        self.assertEqual(metrics["blood_pressure"].diastolic, 76)
        self.assertEqual(metrics["blood_pressure"].status, "NORMAL")
        self.assertEqual(metrics["temperature"].status, "HIGH")
        self.assertEqual(metrics["pulse"].status, "HIGH")
        self.assertEqual(metrics["respiratory_rate"].status, "HIGH")
        self.assertEqual(metrics["spo2"].status, "LOW")
        self.assertEqual(metrics["wbc"].numeric_value, 15200)
        self.assertEqual(metrics["wbc"].status, "HIGH")
        self.assertEqual(metrics["neutrophils"].status, "HIGH")
        self.assertEqual(metrics["crp"].status, "HIGH")

        self.assertGreater(result.confidence.extraction, 0.8)
        self.assertLessEqual(result.confidence.extraction, 1.0)
        self.assertEqual(result.confidence.completeness, 1.0)
        self.assertEqual(result.confidence.missing_fields, [])
        self.assertIsNone(result.confidence.ocr)

    def test_missing_demographics_stays_null(self) -> None:
        text = read_fixture("missing_demographics.txt")
        result = parse_medical_text(
            text,
            llm_callable=fake_llm(PNEUMONIA_METRICS[:5]),
        )
        self.assertIsNone(result.patient.age)
        self.assertIsNone(result.patient.gender)
        self.assertFalse(result.patient_demographics_found)
        self.assertLess(result.confidence.completeness, 1.0)
        self.assertIn("patient.age", result.confidence.missing_fields)

    def test_multiple_pages_do_not_duplicate_metrics(self) -> None:
        text = read_fixture("pneumonia_multipage.txt")
        metrics = list(PNEUMONIA_METRICS)
        metrics.append(
            {
                "biomarker_name": "Blood pressure",
                "value": "118/76",
                "unit": "mmHg",
                "status": "UNSPECIFIED",
            }
        )
        result = parse_medical_text(
            text,
            llm_callable=fake_llm(metrics, PNEUMONIA_PATIENT),
        )
        blood_pressures = [
            metric for metric in result.metrics if metric.canonical_key == "blood_pressure"
        ]
        self.assertEqual(len(blood_pressures), 1)
        self.assertEqual(blood_pressures[0].diastolic, 76)

    def test_diabetes_pdf_regression(self) -> None:
        metrics = [
            {"biomarker_name": "Fasting Blood Glucose (FBG)", "value": "168", "unit": "mg/dL", "status": "UNSPECIFIED"},
            {"biomarker_name": "Post Prandial Blood Glucose (PPBG)", "value": "242", "unit": "mg/dL", "status": "UNSPECIFIED"},
            {"biomarker_name": "Random Blood Sugar (RBS)", "value": "215", "unit": "mg/dL", "status": "UNSPECIFIED"},
            {"biomarker_name": "HbA1c", "value": "8.2", "unit": "%", "status": "UNSPECIFIED"},
            {"biomarker_name": "Estimated Average Glucose (eAG)", "value": "189", "unit": "mg/dL", "status": "UNSPECIFIED"},
        ]
        result = parse_medical_pdf(
            FIXTURES / "diabetes_report.pdf",
            llm_callable=fake_llm(metrics),
        )
        self.assertEqual(result.patient.name, "Rahul Sharma")
        self.assertEqual(result.patient.age, 46)
        self.assertEqual(result.patient.gender, "Male")
        metrics_by_key = {metric.canonical_key: metric for metric in result.metrics}
        self.assertEqual(metrics_by_key["fasting_glucose"].status, "HIGH")
        self.assertEqual(metrics_by_key["post_prandial_glucose"].status, "HIGH")
        self.assertEqual(metrics_by_key["hba1c"].status, "HIGH")
        self.assertEqual(metrics_by_key["estimated_average_glucose"].status, "UNSPECIFIED")
        self.assertFalse(result.source.used_ocr)
        self.assertEqual(result.source.page_count, 1)

    def test_ambiguous_ocr_text(self) -> None:
        text = "Age / Sex: 58 years / Male\nSpOz (room air) 91 %\nBlood pressure 118/76 mmHg"
        result = parse_medical_text(
            text,
            llm_callable=fake_llm(
                [
                    {"biomarker_name": "SpOz (room air)", "value": "91", "unit": "%", "status": "UNSPECIFIED"},
                    {"biomarker_name": "Blood pressure", "value": "118/76", "unit": "mmHg", "status": "UNSPECIFIED"},
                ]
            ),
        )
        keys = {metric.canonical_key for metric in result.metrics}
        self.assertIn("spo2", keys)
        self.assertIn("blood_pressure", keys)
        spo2 = next(metric for metric in result.metrics if metric.canonical_key == "spo2")
        self.assertEqual(spo2.biomarker_name, "SpO2")
        self.assertEqual(spo2.status, "LOW")
        self.assertEqual(result.patient.age, 58)


if __name__ == "__main__":
    unittest.main()
