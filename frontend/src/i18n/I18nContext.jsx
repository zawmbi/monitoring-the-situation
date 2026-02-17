import { createContext, useContext, useState, useCallback } from 'react';
import { translations, SUPPORTED_LANGUAGES } from './translations';

const I18nContext = createContext(null);

function detectBrowserLang() {
  try {
    const nav = navigator.language || navigator.languages?.[0] || 'en';
    const code = nav.split('-')[0].toLowerCase();
    if (translations[code]) return code;
  } catch {}
  return 'en';
}

function getStoredLang() {
  try {
    const stored = window.localStorage.getItem('lang');
    if (stored && translations[stored]) return stored;
  } catch {}
  return detectBrowserLang();
}

export function I18nProvider({ children }) {
  const [lang, setLangState] = useState(getStoredLang);

  const setLang = useCallback((code) => {
    if (translations[code]) {
      setLangState(code);
      try { window.localStorage.setItem('lang', code); } catch {}
      // Set document direction for RTL languages
      const langInfo = SUPPORTED_LANGUAGES.find(l => l.code === code);
      document.documentElement.dir = langInfo?.rtl ? 'rtl' : 'ltr';
    }
  }, []);

  const t = useCallback((key) => {
    return translations[lang]?.[key] || translations.en[key] || key;
  }, [lang]);

  return (
    <I18nContext.Provider value={{ lang, setLang, t, languages: SUPPORTED_LANGUAGES }}>
      {children}
    </I18nContext.Provider>
  );
}

export function useI18n() {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error('useI18n must be used within I18nProvider');
  return ctx;
}
