from __future__ import annotations

import unittest

from app.services.reference_ranges import ReferenceRangeEvaluator, apply_reference_ranges
from tests.support import make_metric


class ReferenceRangeTests(unittest.TestCase):
    def setUp(self) -> None:
        self.evaluator = ReferenceRangeEvaluator()

    def evaluate(self, metric, age: int | None = 58, gender: str | None = "Male"):
        apply_reference_ranges(
            [metric], age=age, gender=gender, evaluator=self.evaluator
        )
        return metric

    def test_high_low_and_normal(self) -> None:
        cases = [
            ("Temperature", "38.6", "°C", "HIGH"),
            ("Temperature", "37.0", "°C", "NORMAL"),
            ("SpO2", "91", "%", "LOW"),
            ("WBC", "15,200", "cells/uL", "HIGH"),
            ("CRP", "68", "mg/L", "HIGH"),
        ]
        for name, value, unit, expected in cases:
            with self.subTest(name=name, value=value):
                metric = self.evaluate(make_metric(name, value, unit))
                self.assertEqual(metric.status, expected)
                self.assertEqual(metric.status_source, "reference_range")

    def test_comparator_value_below_upper_limit(self) -> None:
        metric = self.evaluate(make_metric("CRP", "<5", "mg/L"))
        self.assertEqual(metric.status, "NORMAL")
        self.assertEqual(metric.comparator, "<")

    def test_missing_value_is_never_normal(self) -> None:
        metric = self.evaluate(
            make_metric("CRP", "", "mg/L", status="NORMAL")
        )
        self.assertEqual(metric.status, "UNSPECIFIED")
        self.assertEqual(metric.status_source, "unavailable")

    def test_explicit_abnormal_flag_on_missing_value_is_kept(self) -> None:
        metric = self.evaluate(
            make_metric("CRP", "", "mg/L", status="HIGH")
        )
        self.assertEqual(metric.status, "HIGH")
        self.assertEqual(metric.status_source, "document")

    def test_no_range_uses_document_status(self) -> None:
        metric = self.evaluate(
            make_metric("Some Unlisted Test", "10", "U/L", status="NORMAL")
        )
        self.assertEqual(metric.status, "NORMAL")
        self.assertEqual(metric.status_source, "document")

    def test_gender_dependent_hemoglobin(self) -> None:
        male = self.evaluate(
            make_metric("Hemoglobin", "12.5", "g/dL"), gender="Male"
        )
        female = self.evaluate(
            make_metric("Hemoglobin", "12.5", "g/dL"), gender="Female"
        )
        self.assertEqual(male.status, "LOW")
        self.assertEqual(female.status, "NORMAL")

    def test_age_band_overrides_gender(self) -> None:
        metric = self.evaluate(
            make_metric("Hemoglobin", "12.5", "g/dL"), age=70, gender="Male"
        )
        self.assertEqual(metric.status, "NORMAL")

    def test_blood_pressure_component_status(self) -> None:
        metric = self.evaluate(make_metric("Blood pressure", "125/70", "mmHg"))
        self.assertEqual(metric.systolic_status, "HIGH")
        self.assertEqual(metric.diastolic_status, "NORMAL")
        self.assertEqual(metric.status, "HIGH")

    def test_config_is_loaded(self) -> None:
        self.assertIn("blood_pressure", self.evaluator.analytes)
        self.assertIn("hemoglobin", self.evaluator.analytes)


if __name__ == "__main__":
    unittest.main()
