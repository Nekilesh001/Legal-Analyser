import pdfplumber
from docx import Document as DocxDocument

def extract_text(file_path: str, file_type: str) -> dict:
    if file_type == "txt":
        with open(file_path, "r", encoding="utf-8") as f:
            text = f.read()
        return {"text": text, "method": "txt", "pages": 1, "avg_chars_per_page": len(text)}

    if file_type == "docx":
        doc = DocxDocument(file_path)
        text = "\n".join(p.text for p in doc.paragraphs)
        return {"text": text, "method": "docx", "pages": 1, "avg_chars_per_page": len(text)}

    if file_type == "pdf":
        full_text = ""
        with pdfplumber.open(file_path) as pdf:
            num_pages = len(pdf.pages)
            for page in pdf.pages:
                page_text = page.extract_text() or ""
                full_text += page_text + "\n"

        avg_chars = len(full_text) / max(num_pages, 1)

        if avg_chars < 100:
            return {"text": full_text, "method": "needs_ocr", "pages": num_pages, "avg_chars_per_page": avg_chars}

        return {"text": full_text, "method": "pdfplumber", "pages": num_pages, "avg_chars_per_page": avg_chars}

    raise ValueError(f"Unsupported file type: {file_type}")
