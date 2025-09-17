import { SupportedLocale, Translations } from './types';
import { ko } from './ko';
import { en } from './en';

/**
 * Internationalization manager
 * Handles language switching and translation retrieval
 */
export class I18nManager {
  private currentLocale: SupportedLocale = 'ko';
  private translations: Record<SupportedLocale, Translations> = {
    ko,
    en
  };

  /**
   * Get current locale
   */
  getCurrentLocale(): SupportedLocale {
    return this.currentLocale;
  }

  /**
   * Set current locale
   */
  setLocale(locale: SupportedLocale): void {
    if (this.translations[locale]) {
      this.currentLocale = locale;
    } else {
      console.warn(`Locale '${locale}' not supported, falling back to 'ko'`);
      this.currentLocale = 'ko';
    }
  }

  /**
   * Get current translations
   */
  getTranslations(): Translations {
    return this.translations[this.currentLocale];
  }

  /**
   * Get a specific translation by path
   */
  t(path: string, params?: any): string {
    const keys = path.split('.');
    let current: any = this.translations[this.currentLocale];

    for (const key of keys) {
      if (current && typeof current === 'object' && key in current) {
        current = current[key];
      } else {
        console.warn(`Translation key '${path}' not found for locale '${this.currentLocale}'`);
        return path; // Return the key as fallback
      }
    }

    // If it's a function (for dynamic translations), call it with params
    if (typeof current === 'function' && params) {
      return current(...params);
    }

    // If it's a string, return it
    if (typeof current === 'string') {
      return current;
    }

    console.warn(`Invalid translation value for key '${path}'`);
    return path;
  }

  /**
   * Get available locales
   */
  getAvailableLocales(): SupportedLocale[] {
    return Object.keys(this.translations) as SupportedLocale[];
  }

  /**
   * Auto-detect locale from browser
   */
  detectLocale(): SupportedLocale {
    if (typeof navigator !== 'undefined') {
      const browserLang = navigator.language.toLowerCase();

      if (browserLang.startsWith('ko')) {
        return 'ko';
      } else if (browserLang.startsWith('en')) {
        return 'en';
      }
    }

    // Default fallback
    return 'ko';
  }

  /**
   * Initialize with auto-detected locale
   */
  initialize(): void {
    const detectedLocale = this.detectLocale();
    this.setLocale(detectedLocale);
  }
}