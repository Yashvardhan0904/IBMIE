from __future__ import annotations

import unittest

from app.services.normalization import (
    canonical_key,
    deduplicate_metrics,
    normalize_metric_value,
    normalize_unit,
)
from tests.support import make_metric


class ValueExtractionTests(unittest.TestCase):
    def test_decimal_values_are_preserved(self) -> None:
        normalized = normalize_metric_value("8.2", name="HbA1c", unit="%")
        self.assertEqual(normalized.numeric_value, 8.2)
        self.assertEqual(normalized.value_normalized, "8.2")

    def test_values_with_thousands_commas(self) -> None:
        normalized = normalize_metric_value(
            "15,200", name="Total WBC count", unit="cells/uL"
        )
        self.assertEqual(normalized.numeric_value, 15200)
        self.assertEqual(normalized.value_normalized, "15200")
        self.assertEqual(normalized.value_raw, "15,200")

    def test_small_comma_value(self) -> None:
        normalized = normalize_metric_value("1,200", name="Total WBC count")
        self.assertEqual(normalized.numeric_value, 1200)

    def test_decimal_comma_is_supported(self) -> None:
        normalized = normalize_metric_value("8,2", name="HbA1c", unit="%")
        self.assertEqual(normalized.numeric_value, 8.2)

    def test_unit_variants_are_normalized(self) -> None:
        cases = [
            ("MMHG", "blood_pressure", "mmHg"),
            ("cells/uL", "wbc", "cells/µL"),
            ("°c", "temperature", "°C"),
            ("gm/dL", "hemoglobin", "g/dL"),
            ("/min", "pulse", "beats/min"),
            ("/min", "respiratory_rate", "breaths/min"),
        ]
        for unit, canonical, expected in cases:
            with self.subTest(unit=unit, canonical=canonical):
                normalized_unit, _ = normalize_unit(unit, canonical)
                self.assertEqual(normalized_unit, expected)

    def test_g_per_litre_is_converted(self) -> None:
        normalized = normalize_metric_value(
            "134", name="Hemoglobin", unit="g/L"
        )
        self.assertEqual(normalized.numeric_value, 13.4)
        self.assertEqual(normalized.unit, "g/dL")
        self.assertEqual(normalized.unit_raw, "g/L")

    def test_fahrenheit_temperature_is_converted(self) -> None:
        normalized = normalize_metric_value(
            "98.9", name="Temperature", unit="deg F"
        )
        self.assertEqual(normalized.unit, "°C")
        self.assertAlmostEqual(normalized.numeric_value, 37.17, places=2)

    def test_missing_value_is_none_not_zero(self) -> None:
        normalized = normalize_metric_value("", name="CRP", unit="mg/L")
        self.assertIsNone(normalized.numeric_value)
        self.assertIn("numeric_value_missing", normalized.notes)

    def test_qualitative_value_has_no_number(self) -> None:
        normalized = normalize_metric_value("Negative", name="Urine protein")
        self.assertIsNone(normalized.numeric_value)
        self.assertEqual(normalized.value_raw, "Negative")

    def test_compound_value_is_preserved(self) -> None:
        normalized = normalize_metric_value(
            "118/76", name="Blood pressure", unit="mmHg"
        )
        self.assertEqual(normalized.value_normalized, "118/76")
        self.assertEqual(normalized.systolic, 118)
        self.assertEqual(normalized.diastolic, 76)

    def test_duplicate_metrics_are_merged(self) -> None:
        first = make_metric("Blood pressure", "118/76", "mmHg")
        duplicate = make_metric("BP", "118", "mmHg")
        other = make_metric("Temperature", "38.6", "°C")
        deduped = deduplicate_metrics([first, duplicate, other])
        self.assertEqual(len(deduped), 2)
        blood_pressure = next(
            metric for metric in deduped if metric.canonical_key == "blood_pressure"
        )
        self.assertEqual(blood_pressure.systolic, 118)
        self.assertEqual(blood_pressure.diastolic, 76)

    def test_canonical_aliases(self) -> None:
        self.assertEqual(canonical_key("SpOz (room air)"), "spo2")
        self.assertEqual(canonical_key("Hgb"), "hemoglobin")
        self.assertEqual(canonical_key("TLC"), "wbc")
        self.assertEqual(canonical_key("C-reactive protein"), "crp")


if __name__ == "__main__":
    unittest.main()
