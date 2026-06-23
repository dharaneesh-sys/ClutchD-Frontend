'use client';

import { useTranslations as useNextIntlTranslations } from 'next-intl';

/**
 * Wrapper around next-intl's useTranslations.
 *
 * The I18nProvider is wrapped in Next.js dynamic({ ssr: false }) at the layout
 * level, so during SSR the component tree under the provider is not rendered
 * and this hook is never called on the server. On the client, the provider is
 * always present when this hook executes.
 */
export function useTranslations(namespace) {
  const translations = useNextIntlTranslations(namespace);
  return translations;
}
