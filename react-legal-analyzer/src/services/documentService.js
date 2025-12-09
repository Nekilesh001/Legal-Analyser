// Simplified document service for demo
export const extractTextFromFile = async (file) => {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target.result;
      resolve({
        text,
        language: 'en',
        extractionMethod: 'text',
        confidence: 95,
        wordCount: text.split(/\s+/).length,
        characterCount: text.length
      });
    };
    reader.readAsText(file);
  });
};

export const detectLanguage = (text) => {
  // Simple language detection
  const hindiPattern = /[\u0900-\u097F]/;
  const tamilPattern = /[\u0B80-\u0BFF]/;
  
  if (hindiPattern.test(text)) return 'hi';
  if (tamilPattern.test(text)) return 'ta';
  return 'en';
};

export const detectContractType = (text) => {
  const textLower = text.toLowerCase();
  
  if (textLower.includes('employment') || textLower.includes('employee')) return 'employment';
  if (textLower.includes('vendor') || textLower.includes('supplier')) return 'vendor';
  if (textLower.includes('lease') || textLower.includes('rent')) return 'lease';
  if (textLower.includes('service')) return 'service';
  
  return 'general';
};