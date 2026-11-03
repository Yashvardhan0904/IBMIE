from __future__ import annotations

import asyncio
import io
import os
from dataclasses import dataclass, field
from pathlib import Path

import pypdf
import pytesseract
from PIL import Image, ImageFilter, ImageOps
from pdf2image import convert_from_bytes

from app.core.logging import get_logger

LOGGER = get_logger(__name__)


@dataclass
class OcrPage:
    page_number: int
    text: str
    used_ocr: bool
    confidence: float | None = None
    word_count: int = 0


@dataclass
class OcrResult:
    text: str
    used_ocr: bool
    ocr_confidence: float | None
    page_count: int
    ocr_pages: list[int] = field(default_factory=list)
    pages: list[OcrPage] = field(default_factory=list)


class OCRService:
    """Single OCR entry point for the application.

    Native text is preferred per page. Pages that contain too little text (or
    clearly corrupted text) are rasterised and passed through Tesseract with
    preprocessing and multiple page-segmentation modes.
    """

    @staticmethod
    def extract_document(
        pdf_path: str | Path,
        *,
        dpi: int | None = None,
        max_psm_attempts: int | None = None,
        text_threshold: int | None = None,
    ) -> OcrResult:
        pdf_file = Path(pdf_path)
        if not pdf_file.exists():
            raise FileNotFoundError(f"PDF file not found: {pdf_file}")

        file_bytes = pdf_file.read_bytes()
        return OCRService.extract_document_bytes(
            file_bytes,
            source_name=pdf_file.name,
            dpi=dpi,
            max_psm_attempts=max_psm_attempts,
            text_threshold=text_threshold,
        )

    @staticmethod
    def extract_document_bytes(
        file_bytes: bytes,
        *,
        source_name: str = "<bytes>",
        dpi: int | None = None,
        max_psm_attempts: int | None = None,
        text_threshold: int | None = None,
    ) -> OcrResult:
        dpi = dpi or int(os.getenv("OCR_DPI", "300"))
        max_psm_attempts = max_psm_attempts or int(os.getenv("OCR_MAX_PSM_ATTEMPTS", "3"))
        text_threshold = text_threshold or int(os.getenv("OCR_PAGE_TEXT_THRESHOLD", "40"))

        try:
            reader = pypdf.PdfReader(io.BytesIO(file_bytes))
            if reader.is_encrypted:
                try:
                    reader.decrypt("")
                except Exception as exc:  # pragma: no cover - depends on the PDF
                    LOGGER.warning(
                        "Encrypted PDF could not be decrypted; attempting full OCR",
                        extra={"source": source_name, "error": str(exc)},
                    )
                    return OCRService._extract_all_ocr(
                        file_bytes, source_name, dpi, max_psm_attempts
                    )
            native_pages = [OCRService._native_page_text(page, index) for index, page in enumerate(reader.pages)]
        except Exception as exc:
            LOGGER.warning(
                "Native PDF parsing failed; attempting full OCR",
                extra={"source": source_name, "error": str(exc)},
            )
            return OCRService._extract_all_ocr(
                file_bytes, source_name, dpi, max_psm_attempts
            )

        pages: list[OcrPage] = []
        for index, native_text in enumerate(native_pages):
            page_number = index + 1
            if not OCRService._needs_ocr(native_text, text_threshold):
                pages.append(
                    OcrPage(
                        page_number=page_number,
                        text=native_text,
                        used_ocr=False,
                        confidence=None,
                    )
                )
                continue

            try:
                ocr_text, confidence, word_count = OCRService._ocr_page(
                    file_bytes, page_number, dpi, max_psm_attempts
                )
            except pytesseract.TesseractNotFoundError:
                raise RuntimeError(
                    "Tesseract is not installed or not available on PATH. "
                    "Install the tesseract-ocr package to process scanned PDFs."
                ) from None
            except Exception as exc:
                LOGGER.error(
                    "OCR failed for page; keeping native text if available",
                    extra={"source": source_name, "page": page_number, "error": str(exc)},
                )
                ocr_text, confidence, word_count = "", None, 0

            chosen_text = ocr_text if ocr_text.strip() else native_text
            used_ocr = bool(ocr_text.strip())
            pages.append(
                OcrPage(
                    page_number=page_number,
                    text=chosen_text,
                    used_ocr=used_ocr,
                    confidence=confidence if used_ocr else None,
                    word_count=word_count if used_ocr else 0,
                )
            )
            if used_ocr:
                LOGGER.info(
                    "OCR fallback used for page",
                    extra={
                        "source": source_name,
                        "page": page_number,
                        "confidence": confidence,
                        "words": word_count,
                    },
                )

        result = OCRService._build_result(pages)
        LOGGER.info(
            "Document text extraction completed",
            extra={
                "source": source_name,
                "pages": result.page_count,
                "used_ocr": result.used_ocr,
                "ocr_pages": result.ocr_pages,
                "ocr_confidence": result.ocr_confidence,
            },
        )
        return result

    @staticmethod
    def _extract_all_ocr(
        file_bytes: bytes,
        source_name: str,
        dpi: int,
        max_psm_attempts: int,
    ) -> OcrResult:
        try:
            images = convert_from_bytes(file_bytes, dpi=dpi)
        except Exception as exc:
            LOGGER.error(
                "PDF rasterisation failed",
                extra={"source": source_name, "error": str(exc)},
            )
            raise ValueError("Failed to rasterise PDF for OCR") from exc

        pages: list[OcrPage] = []
        for index, image in enumerate(images):
            page_number = index + 1
            try:
                text, confidence, word_count = OCRService._ocr_image(
                    image, max_psm_attempts
                )
            except pytesseract.TesseractNotFoundError:
                raise RuntimeError(
                    "Tesseract is not installed or not available on PATH. "
                    "Install the tesseract-ocr package to process scanned PDFs."
                ) from None
            except Exception as exc:
                LOGGER.error(
                    "OCR failed for page",
                    extra={"source": source_name, "page": page_number, "error": str(exc)},
                )
                text, confidence, word_count = "", None, 0
            pages.append(
                OcrPage(
                    page_number=page_number,
                    text=text,
                    used_ocr=bool(text.strip()),
                    confidence=confidence,
                    word_count=word_count,
                )
            )

        return OCRService._build_result(pages)

    @staticmethod
    def _native_page_text(page: object, index: int) -> str:
        try:
            text = page.extract_text() or ""  # type: ignore[attr-defined]
        except Exception as exc:
            LOGGER.warning(
                "Native text extraction failed for page",
                extra={"page": index + 1, "error": str(exc)},
            )
            return ""
        return text.replace("\x0c", "\n").strip()

    @staticmethod
    def _build_result(pages: list[OcrPage]) -> OcrResult:
        rendered: list[str] = []
        for page in pages:
            if page.text.strip():
                rendered.append(f"--- Page {page.page_number} ---\n{page.text.strip()}")

        ocr_pages = [page for page in pages if page.used_ocr and page.confidence is not None]
        ocr_confidence: float | None = None
        if ocr_pages:
            total_words = sum(max(page.word_count, 1) for page in ocr_pages)
            weighted = sum(
                (page.confidence or 0.0) * max(page.word_count, 1) for page in ocr_pages
            )
            ocr_confidence = round(weighted / total_words, 4) if total_words else None

        return OcrResult(
            text="\n\n".join(rendered).strip(),
            used_ocr=bool(ocr_pages),
            ocr_confidence=ocr_confidence,
            page_count=len(pages),
            ocr_pages=[page.page_number for page in ocr_pages],
            pages=pages,
        )

    @staticmethod
    def _needs_ocr(text: str, threshold: int) -> bool:
        cleaned = (text or "").strip()
        if not cleaned:
            return True
        if len(cleaned) < threshold:
            return True
        if "\ufffd" in cleaned:
            return True

        letters = sum(1 for char in cleaned if char.isalpha())
        alnum = sum(1 for char in cleaned if char.isalnum())
        controls = sum(1 for char in cleaned if ord(char) < 32 and char not in "\n\t\r")
        if alnum and letters / alnum < 0.25 and len(cleaned) > threshold * 4:
            return True
        if controls / max(len(cleaned), 1) > 0.1:
            return True
        return False

    @staticmethod
    def _ocr_page(
        file_bytes: bytes,
        page_number: int,
        dpi: int,
        max_psm_attempts: int,
    ) -> tuple[str, float | None, int]:
        images = convert_from_bytes(
            file_bytes,
            dpi=dpi,
            first_page=page_number,
            last_page=page_number,
            fmt="png",
        )
        if not images:
            return "", None, 0
        return OCRService._ocr_image(images[0], max_psm_attempts)

    @staticmethod
    def _ocr_image(
        image: Image.Image, max_psm_attempts: int
    ) -> tuple[str, float | None, int]:
        preprocessed = OCRService._preprocess(image)
        candidates = [
            (preprocessed, 6),
            (preprocessed, 4),
            (image, 3),
        ]
        candidates = candidates[: max(1, min(max_psm_attempts, len(candidates)))]

        best_text = ""
        best_confidence: float | None = None
        best_words = 0
        best_score = -1.0

        for candidate, psm in candidates:
            try:
                text, confidence, word_count = OCRService._run_tesseract(candidate, psm)
            except pytesseract.TesseractNotFoundError:
                raise
            except Exception as exc:
                LOGGER.warning(
                    "Tesseract attempt failed",
                    extra={"psm": psm, "error": str(exc)},
                )
                continue

            if not text.strip() or word_count == 0 or confidence is None:
                continue

            score = confidence + min(len(text), 2000) / 100000
            if score > best_score:
                best_score = score
                best_text = text
                best_confidence = confidence
                best_words = word_count

        return best_text, best_confidence, best_words

    @staticmethod
    def _run_tesseract(image: Image.Image, psm: int) -> tuple[str, float | None, int]:
        config = f"--oem 3 --psm {psm}"
        data = pytesseract.image_to_data(
            image,
            config=config,
            output_type=pytesseract.Output.DICT,
        )
        confidences: list[float] = []
        lines: dict[tuple[int, int, int], list[str]] = {}

        texts = data.get("text", [])
        for index, raw_word in enumerate(texts):
            word = str(raw_word).strip()
            if not word:
                continue
            try:
                confidence = float(data["conf"][index])
            except (KeyError, TypeError, ValueError):
                confidence = -1.0
            if confidence < 0:
                continue
            confidences.append(confidence)
            key = (
                int(data["block_num"][index]),
                int(data["par_num"][index]),
                int(data["line_num"][index]),
            )
            lines.setdefault(key, []).append(word)

        if not confidences:
            return "", None, 0

        text = "\n".join(" ".join(words) for _, words in sorted(lines.items()))
        return text, round(sum(confidences) / len(confidences) / 100.0, 4), len(confidences)

    @staticmethod
    def _preprocess(image: Image.Image) -> Image.Image:
        prepared = ImageOps.exif_transpose(image)
        gray = prepared.convert("L")
        gray = ImageOps.autocontrast(gray, cutoff=1)

        width, height = gray.size
        if width > 0 and width < 1800:
            scale = min(2.5, 1800 / width)
            gray = gray.resize((int(width * scale), int(height * scale)), Image.LANCZOS)

        return gray.filter(ImageFilter.UnsharpMask(radius=1.2, percent=120, threshold=3))

    # ------------------------------------------------------------------
    # Backwards-compatible helpers (used by older call sites / tests).
    # ------------------------------------------------------------------
    @staticmethod
    def _run_ocr(file_bytes: bytes) -> str:
        return OCRService.extract_document_bytes(file_bytes).text

    @staticmethod
    async def extract_text(file_bytes: bytes) -> str:
        result = await asyncio.to_thread(OCRService.extract_document_bytes, file_bytes)
        return result.text
