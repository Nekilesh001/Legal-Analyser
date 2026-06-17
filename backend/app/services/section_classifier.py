"""
Section Classifier — TF-IDF + Logistic Regression.
Classifies contract clauses into one of 10 section types:
payment, termination, ip, liability, confidentiality,
non_compete, probation, maintenance, warranty, dispute, other.

Auto-trains on first use from the bundled training data JSON.
"""
import os
import json
import logging
from pathlib import Path

logger = logging.getLogger(__name__)

_BASE_DIR = Path(__file__).parent.parent / "ml_data"
MODEL_PATH = str(_BASE_DIR / "section_classifier.joblib")
VECTORIZER_PATH = str(_BASE_DIR / "tfidf_vectorizer.joblib")
TRAINING_DATA_PATH = str(_BASE_DIR / "section_training_data.json")

_clf = None
_vectorizer = None


def _load_or_train():
    global _clf, _vectorizer
    if _clf is not None and _vectorizer is not None:
        return

    import joblib
    if os.path.exists(MODEL_PATH) and os.path.exists(VECTORIZER_PATH):
        _clf = joblib.load(MODEL_PATH)
        _vectorizer = joblib.load(VECTORIZER_PATH)
        logger.info("Section classifier loaded from disk.")
    else:
        logger.info("Training section classifier from scratch...")
        _train_and_save()


def _train_and_save():
    global _clf, _vectorizer
    from sklearn.feature_extraction.text import TfidfVectorizer
    from sklearn.linear_model import LogisticRegression
    import joblib

    with open(TRAINING_DATA_PATH, "r", encoding="utf-8") as f:
        data = json.load(f)

    texts = [d["clause"] for d in data]
    labels = [d["section_type"] for d in data]

    vectorizer = TfidfVectorizer(max_features=500, ngram_range=(1, 2))
    X = vectorizer.fit_transform(texts)

    clf = LogisticRegression(max_iter=1000, C=1.0)
    clf.fit(X, labels)

    # Ensure output directory exists
    os.makedirs(_BASE_DIR, exist_ok=True)
    joblib.dump(clf, MODEL_PATH)
    joblib.dump(vectorizer, VECTORIZER_PATH)

    _clf = clf
    _vectorizer = vectorizer
    logger.info(f"Section classifier trained on {len(texts)} examples and saved.")


def classify_section(clause: str) -> str:
    """
    Classify a contract clause into a section type.
    Returns one of: payment, termination, ip, liability, confidentiality,
    non_compete, probation, maintenance, warranty, dispute, other.
    """
    try:
        _load_or_train()
        X = _vectorizer.transform([clause])
        return _clf.predict(X)[0]
    except Exception as e:
        logger.warning(f"Section classification failed: {e}")
        return "other"


def retrain(extra_data: list[dict] | None = None):
    """
    Re-train the classifier. Optionally add extra labeled examples.
    extra_data: list of {"clause": str, "section_type": str}
    """
    global _clf, _vectorizer
    _clf = None
    _vectorizer = None

    if extra_data:
        with open(TRAINING_DATA_PATH, "r", encoding="utf-8") as f:
            existing = json.load(f)
        combined = existing + extra_data
        with open(TRAINING_DATA_PATH, "w", encoding="utf-8") as f:
            json.dump(combined, f, indent=2)

    # Remove old model files so _load_or_train triggers a fresh train
    for p in [MODEL_PATH, VECTORIZER_PATH]:
        if os.path.exists(p):
            os.remove(p)

    _load_or_train()
