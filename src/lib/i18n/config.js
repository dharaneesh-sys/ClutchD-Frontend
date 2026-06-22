export const locales = ['en', 'ta'];
export const defaultLocale = 'en';

/**
 * Detect the best matching locale from browser language.
 * Falls back to default locale if no match found.
 */
export function detectLocale() {
  if (typeof window === 'undefined') return defaultLocale;

  const browserLang = navigator.language?.split('-')[0] || '';
  return locales.includes(browserLang) ? browserLang : defaultLocale;
}
