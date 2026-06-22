'use client';

import dynamic from 'next/dynamic';

const I18nProvider = dynamic(() => import('./I18nProvider'), { ssr: false });

export default function DynamicI18nProvider({ children }) {
  return <I18nProvider>{children}</I18nProvider>;
}
