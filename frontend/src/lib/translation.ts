import { TRANSLATION_CONFIG } from './api';

// Translation cache for performance
const translationCache = new Map<string, { translation: string; timestamp: number }>();

export class TranslationService {
  private static instance: TranslationService;
  
  static getInstance(): TranslationService {
    if (!TranslationService.instance) {
      TranslationService.instance = new TranslationService();
    }
    return TranslationService.instance;
  }

  // Check if content needs translation
  needsTranslation(language: string): boolean {
    return language !== 'en' && language in TRANSLATION_CONFIG.supportedLanguages;
  }

  // Get cached translation if available and not expired
  private getCachedTranslation(text: string, sourceLang: string): string | null {
    if (!TRANSLATION_CONFIG.cacheEnabled) return null;
    
    const cacheKey = `${sourceLang}:${text.substring(0, 100)}`;
    const cached = translationCache.get(cacheKey);
    
    if (cached && Date.now() - cached.timestamp < TRANSLATION_CONFIG.cacheDuration) {
      return cached.translation;
    }
    
    return null;
  }

  // Cache translation result
  private setCachedTranslation(text: string, sourceLang: string, translation: string): void {
    if (!TRANSLATION_CONFIG.cacheEnabled) return;
    
    const cacheKey = `${sourceLang}:${text.substring(0, 100)}`;
    translationCache.set(cacheKey, {
      translation,
      timestamp: Date.now()
    });
  }

  // Translate text using Google Translate API
  async translateText(text: string, sourceLang: string): Promise<string> {
    if (!this.needsTranslation(sourceLang)) {
      return text;
    }

    // Check cache first
    const cached = this.getCachedTranslation(text, sourceLang);
    if (cached) {
      return cached;
    }

    try {
      // If no API key available, return original text with language indicator
      if (!TRANSLATION_CONFIG.apiKey) {
        return `[${TRANSLATION_CONFIG.supportedLanguages[sourceLang as keyof typeof TRANSLATION_CONFIG.supportedLanguages] || sourceLang}] ${text}`;
      }

      const response = await fetch(`${TRANSLATION_CONFIG.endpoint}?key=${TRANSLATION_CONFIG.apiKey}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          q: text,
          source: sourceLang,
          target: TRANSLATION_CONFIG.targetLanguage,
          format: 'text'
        })
      });

      if (!response.ok) {
        throw new Error(`Translation API error: ${response.status}`);
      }

      const data = await response.json();
      const translation = data.data.translations[0].translatedText;

      // Cache the result
      this.setCachedTranslation(text, sourceLang, translation);

      return translation;
    } catch (error) {
      console.warn('Translation failed:', error);
      // Return original text with language indicator as fallback
      return `[${TRANSLATION_CONFIG.supportedLanguages[sourceLang as keyof typeof TRANSLATION_CONFIG.supportedLanguages] || sourceLang}] ${text}`;
    }
  }

  // Batch translate multiple texts
  async translateBatch(texts: Array<{ text: string; sourceLang: string }>): Promise<string[]> {
    const translations = await Promise.all(
      texts.map(({ text, sourceLang }) => this.translateText(text, sourceLang))
    );
    return translations;
  }

  // Detect language of text (basic implementation)
  detectLanguage(text: string): string {
    // Basic language detection based on character sets
    const arabicPattern = /[\u0600-\u06FF]/;
    const hebrewPattern = /[\u0590-\u05FF]/;
    const cyrillicPattern = /[\u0400-\u04FF]/;
    const ukrainianPattern = /[іїєґ]/;
    
    if (arabicPattern.test(text)) return 'ar';
    if (hebrewPattern.test(text)) return 'he';
    if (ukrainianPattern.test(text)) return 'uk';
    if (cyrillicPattern.test(text)) return 'ru';
    
    return 'en'; // Default to English
  }

  // Clear translation cache
  clearCache(): void {
    translationCache.clear();
  }

  // Get cache statistics
  getCacheStats(): { size: number; languages: string[] } {
    const languages = new Set<string>();
    translationCache.forEach((_, key) => {
      const lang = key.split(':')[0];
      languages.add(lang);
    });
    
    return {
      size: translationCache.size,
      languages: Array.from(languages)
    };
  }
}