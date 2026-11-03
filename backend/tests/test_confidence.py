from __future__ import annotations

import unittest

from app.services.confidence import compute_confidence, load_extraction_config
from app.services.patient_extractor import ExtractedPatient
from tests.support import make_metric


class ConfidenceTests(unittest.TestCase):
    def test_three_metrics_are_independent(self) -> None:
        patient = ExtractedPatient(
            name="SAMPLE PATIENT",
            field_confidence={"patient.name": 0.95},
        )
        metrics = [make_metric("Temperature", "38.6", "°C", confidence=0.85)]

        confidence = compute_confidence(
            metrics,
            patient,
            ocr_confidence=None,
            ocr_used=False,
        )

        self.assertIsNone(confidence["ocr"])
        self.assertAlmostEqual(confidence["extraction"], 0.9, places=4)
        self.assertAlmostEqual(confidence["completeness"], 2 / 13, places=4)
        self.assertNotEqual(confidence["extraction"], confidence["completeness"])
        self.assertIn("patient.age", confidence["missing_fields"])

    def test_completeness_counts_presence_only(self) -> None:
        patient = ExtractedPatient(
            name="SAMPLE PATIENT",
            age=58,
            gender="Male",
            referring_physician="Dr. A. Sharma",
            field_confidence={
                "patient.name": 0.95,
                "patient.age": 0.95,
                "patient.gender": 0.95,
                "patient.referring_physician": 0.95,
            },
        )
        metrics = [
            make_metric("Temperature", "38.6", "°C"),
            make_metric("Blood pressure", "118/76", "mmHg"),
        ]
        confidence = compute_confidence(
            metrics,
            patient,
            ocr_confidence=0.91,
            ocr_used=True,
        )
        self.assertEqual(confidence["ocr"], 0.91)
        self.assertAlmostEqual(confidence["completeness"], 6 / 13, places=4)
        self.assertIn("pulse", confidence["missing_fields"])

    def test_ocr_confidence_none_for_digital_text(self) -> None:
        confidence = compute_confidence(
            [],
            ExtractedPatient(),
            ocr_confidence=0.95,
            ocr_used=False,
        )
        self.assertIsNone(confidence["ocr"])

    def test_expected_fields_are_configurable(self) -> None:
        config = load_extraction_config()
        self.assertIn("expected_fields", config)
        self.assertIn("confidence_weights", config)


if __name__ == "__main__":
    unittest.main()
