'use client';

import { NextIntlClientProvider } from 'next-intl';
import { useEffect, useState } from 'react';
import { defaultLocale, detectLocale } from './config';
import enMessages from '../../../messages/en.json';
import taMessages from '../../../messages/ta.json';

const messagesMap = { en: enMessages, ta: taMessages };

export default function I18nProvider({ children }) {
  const [locale, setLocale] = useState(defaultLocale);

  useEffect(() => {
    const detected = detectLocale();
    setLocale(detected);
    document.documentElement.lang = detected;
  }, []);

  return (
    <NextIntlClientProvider locale={locale} messages={messagesMap[locale] || messagesMap[defaultLocale]}>
      {children}
    </NextIntlClientProvider>
  );
}
