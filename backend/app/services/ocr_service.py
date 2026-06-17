"""
OCR Service — Tesseract + Gemini Vision fallback chain.
Converts PDF pages to images via pdf2image, runs pytesseract with
lang="eng+tam", computes average confidence, and falls back to
Gemini Vision if confidence < 60.
"""
import os
import logging
import tempfile
from typing import Optional

logger = logging.getLogger(__name__)

def _tesseract_ocr_page(image) -> dict:
    """Run tesseract on a PIL image, return text and average confidence."""
    try:
        import pytesseract
        from app.config import settings
        if settings.tesseract_cmd and os.path.exists(settings.tesseract_cmd):
            pytesseract.pytesseract.tesseract_cmd = settings.tesseract_cmd

        data = pytesseract.image_to_data(
            image,
            lang="eng+tam",
            output_type=pytesseract.Output.DICT
        )
        confidences = [int(c) for c in data["conf"] if str(c).strip() not in ("-1", "")]
        avg_conf = sum(confidences) / len(confidences) if confidences else 0

        text = pytesseract.image_to_string(image, lang="eng+tam")
        return {"text": text, "confidence": avg_conf}
    except Exception as e:
        logger.warning(f"Tesseract failed: {e}")
        return {"text": "", "confidence": 0.0}


def _gemini_vision_ocr_page(image) -> str:
    """Use Gemini Vision to extract text from a PIL image as fallback."""
    try:
        import google.generativeai as genai
        from app.config import settings
        import io

        genai.configure(api_key=settings.gemini_api_key)
        model = genai.GenerativeModel("gemini-1.5-pro")

        # Convert PIL image to bytes
        buf = io.BytesIO()
        image.save(buf, format="PNG")
        buf.seek(0)

        response = model.generate_content([
            "Extract all text from this document image exactly as it appears. "
            "Preserve paragraph structure. Return only the extracted text.",
            {"mime_type": "image/png", "data": buf.read()}
        ])
        return response.text.strip() if response.text else ""
    except Exception as e:
        logger.warning(f"Gemini Vision OCR failed: {e}")
        return ""


def perform_ocr(file_path: str, confidence_threshold: float = 60.0) -> dict:
    """
    Full OCR pipeline for a PDF file.
    1. Convert each page to an image with pdf2image.
    2. Run pytesseract with eng+tam.
    3. If avg confidence < threshold on any page, fall back to Gemini Vision.

    Returns:
        {
            "text": str,
            "confidence": float,
            "method": "tesseract" | "gemini_vision" | "tesseract+gemini_vision",
            "pages": int
        }
    """
    try:
        from pdf2image import convert_from_path
    except ImportError:
        logger.error("pdf2image not installed")
        return {"text": "", "confidence": 0.0, "method": "error", "pages": 0}

    try:
        images = convert_from_path(file_path, dpi=300)
    except Exception as e:
        logger.error(f"pdf2image conversion failed for {file_path}: {e}")
        return {"text": "", "confidence": 0.0, "method": "error", "pages": 0}

    all_text = []
    all_confidences = []
    methods_used = set()

    for i, img in enumerate(images):
        tess_result = _tesseract_ocr_page(img)

        if tess_result["confidence"] >= confidence_threshold:
            all_text.append(tess_result["text"])
            all_confidences.append(tess_result["confidence"])
            methods_used.add("tesseract")
        else:
            logger.info(
                f"Page {i+1}: tesseract confidence {tess_result['confidence']:.1f} "
                f"< {confidence_threshold}, using Gemini Vision"
            )
            vision_text = _gemini_vision_ocr_page(img)
            if vision_text:
                all_text.append(vision_text)
                all_confidences.append(90.0)  # Assume Gemini is reliable
                methods_used.add("gemini_vision")
            else:
                # Use tesseract output anyway as last resort
                all_text.append(tess_result["text"])
                all_confidences.append(tess_result["confidence"])
                methods_used.add("tesseract")

    combined_text = "\n".join(all_text)
    avg_confidence = sum(all_confidences) / len(all_confidences) if all_confidences else 0.0

    if methods_used == {"tesseract"}:
        method_label = "tesseract"
    elif methods_used == {"gemini_vision"}:
        method_label = "gemini_vision"
    else:
        method_label = "tesseract+gemini_vision"

    return {
        "text": combined_text,
        "confidence": round(avg_confidence, 2),
        "method": method_label,
        "pages": len(images)
    }
