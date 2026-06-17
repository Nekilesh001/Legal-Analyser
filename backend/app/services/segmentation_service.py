import spacy
# Use spacy fallback if not downloaded or standard string parsing
try:
    nlp_en = spacy.load("en_core_web_sm")
except Exception:
    nlp_en = None

def segment_english(text: str) -> list[str]:
    if nlp_en:
        doc = nlp_en(text)
        return [sent.text.strip() for sent in doc.sents if len(sent.text.strip()) > 15]
    else:
        return [s.strip() for s in text.split(".") if len(s.strip()) > 15]

def segment_tamil(text: str) -> list[str]:
    # Basic tokenization fallback
    return [s.strip() for s in text.split(".") if len(s.strip()) > 15]

def segment_by_language(text: str, language: str) -> list[str]:
    if language == "tamil":
        return segment_tamil(text)
    return segment_english(text)

def extract_entities(clause: str) -> dict:
    if nlp_en:
        doc = nlp_en(clause)
        return {
            "parties": [ent.text for ent in doc.ents if ent.label_ in ("ORG", "PERSON")],
            "dates": [ent.text for ent in doc.ents if ent.label_ == "DATE"],
            "money": [ent.text for ent in doc.ents if ent.label_ == "MONEY"]
        }
    return {"parties": [], "dates": [], "money": []}
