from lingua import Language, LanguageDetectorBuilder

detector = LanguageDetectorBuilder.from_languages(
    Language.ENGLISH, Language.TAMIL, Language.HINDI
).build()

def detect_clause_language(text: str) -> str:
    result = detector.detect_language_of(text)
    if result is None:
        return "unknown"
    return result.name.lower()
