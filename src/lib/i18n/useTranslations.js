'use client';

import { useTranslations as useNextIntlTranslations } from 'next-intl';
import enMessages from '../../../messages/en.json';

function resolveKey(key, messages) {
  return key.split('.').reduce((obj, k) => (obj != null ? obj[k] : undefined), messages);
}

/**
 * Safe wrapper around next-intl's useTranslations.
 * Falls back to default English messages when the provider is not yet mounted
 * (e.g. during SSR where I18nProvider is excluded via dynamic({ ssr: false })).
 */
export function useTranslations(namespace) {
  let t;

  try {
    t = useNextIntlTranslations(namespace);
  } catch {
    // No i18n context available — fall back to default English messages.
    const prefix = namespace ? `${namespace}.` : '';
    t = (key) => resolveKey(prefix + key, enMessages) ?? key;
  }

  return t;
}
