from __future__ import annotations

import unittest

from app.services.normalization import canonical_key
from app.services.reference_ranges import ReferenceRangeEvaluator, apply_reference_ranges
from tests.support import make_metric


class BloodPressureTests(unittest.TestCase):
    def setUp(self) -> None:
        self.evaluator = ReferenceRangeEvaluator()

    def evaluate(self, value: str, unit: str = "mmHg"):
        metric = make_metric("Blood pressure", value, unit)
        apply_reference_ranges(
            [metric], age=58, gender="Male", evaluator=self.evaluator
        )
        return metric

    def test_compound_value_is_split(self) -> None:
        metric = self.evaluate("118/76")
        self.assertEqual(metric.systolic, 118)
        self.assertEqual(metric.diastolic, 76)
        self.assertEqual(metric.value_raw, "118/76")
        self.assertEqual(metric.value_normalized, "118/76")
        self.assertEqual(metric.status, "NORMAL")
        self.assertEqual(metric.systolic_status, "NORMAL")
        self.assertEqual(metric.diastolic_status, "NORMAL")

    def test_spaced_compound_with_unit_in_value(self) -> None:
        metric = self.evaluate("118 / 76 mmHg")
        self.assertEqual(metric.systolic, 118)
        self.assertEqual(metric.diastolic, 76)

    def test_high_blood_pressure(self) -> None:
        metric = self.evaluate("150/95")
        self.assertEqual(metric.status, "HIGH")
        self.assertEqual(metric.systolic_status, "HIGH")
        self.assertEqual(metric.diastolic_status, "HIGH")

    def test_low_blood_pressure(self) -> None:
        metric = self.evaluate("85/55")
        self.assertEqual(metric.status, "LOW")

    def test_incomplete_blood_pressure_is_not_normal(self) -> None:
        metric = self.evaluate("118")
        self.assertIsNone(metric.diastolic)
        self.assertEqual(metric.status, "UNSPECIFIED")
        self.assertEqual(metric.status_source, "unavailable")

    def test_canonical_name(self) -> None:
        self.assertEqual(canonical_key("BP"), "blood_pressure")
        self.assertEqual(canonical_key("Blood Pressure (BP)"), "blood_pressure")


if __name__ == "__main__":
    unittest.main()
