from __future__ import annotations

import shutil
import tempfile
import unittest
from pathlib import Path

from pypdf import PdfReader, PdfWriter

from app.services.ocr_service import OCRService, OcrPage
from tests.support import FIXTURES


class OcrTests(unittest.TestCase):
    def test_needs_ocr_detection(self) -> None:
        self.assertTrue(OCRService._needs_ocr("", 40))
        self.assertTrue(OCRService._needs_ocr("short", 40))
        self.assertFalse(
            OCRService._needs_ocr(
                "This page contains a normal digital text layer with plenty of characters.",
                40,
            )
        )

    def test_digital_pdf_prefers_native_text(self) -> None:
        result = OCRService.extract_document(FIXTURES / "diabetes_report.pdf")
        self.assertFalse(result.used_ocr)
        self.assertIsNone(result.ocr_confidence)
        self.assertEqual(result.page_count, 1)
        self.assertIn("--- Page 1 ---", result.text)
        self.assertIn("Fasting Blood Glucose", result.text)

    def test_multiple_page_assembly(self) -> None:
        source = FIXTURES / "diabetes_report.pdf"
        with tempfile.TemporaryDirectory() as tmp:
            target = Path(tmp) / "combined.pdf"
            writer = PdfWriter()
            for _ in range(2):
                with source.open("rb") as handle:
                    writer.append(PdfReader(handle))
            with target.open("wb") as handle:
                writer.write(handle)

            result = OCRService.extract_document(target)
            self.assertEqual(result.page_count, 2)
            self.assertIn("--- Page 1 ---", result.text)
            self.assertIn("--- Page 2 ---", result.text)

    def test_confidence_aggregation(self) -> None:
        result = OCRService._build_result(
            [
                OcrPage(1, "native text", used_ocr=False),
                OcrPage(2, "ocr text", used_ocr=True, confidence=0.8, word_count=10),
                OcrPage(3, "more ocr", used_ocr=True, confidence=0.9, word_count=30),
            ]
        )
        self.assertTrue(result.used_ocr)
        self.assertEqual(result.ocr_pages, [2, 3])
        self.assertAlmostEqual(result.ocr_confidence, 0.875, places=3)

    @unittest.skipUnless(shutil.which("tesseract"), "tesseract is not installed")
    def test_scanned_pneumonia_pdf_uses_ocr(self) -> None:
        result = OCRService.extract_document(
            FIXTURES / "pneumonia_report.pdf",
            max_psm_attempts=1,
        )
        self.assertTrue(result.used_ocr)
        self.assertIsNotNone(result.ocr_confidence)
        self.assertIn("Blood pressure", result.text)
        self.assertIn("118/76", result.text)


if __name__ == "__main__":
    unittest.main()
