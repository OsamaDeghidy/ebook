import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import arDict from './locales/ar.json';
import enDict from './locales/en.json';
import itDict from './locales/it.json';
import frDict from './locales/fr.json';
import deDict from './locales/de.json';

export type AppLanguage = 'ar' | 'en' | 'it' | 'fr' | 'de';

export interface LanguageInfo {
  code: AppLanguage;
  name: string;
  nativeName: string;
  flag: string;
  dir: 'rtl' | 'ltr';
}

export const SUPPORTED_LANGUAGES: LanguageInfo[] = [
  { code: 'ar', name: 'Arabic', nativeName: 'العربية', flag: '🇪🇬', dir: 'rtl' },
  { code: 'en', name: 'English', nativeName: 'English', flag: '🇬🇧', dir: 'ltr' },
  { code: 'it', name: 'Italian', nativeName: 'Italiano', flag: '🇮🇹', dir: 'ltr' },
  { code: 'fr', name: 'French', nativeName: 'Français', flag: '🇫🇷', dir: 'ltr' },
  { code: 'de', name: 'German', nativeName: 'Deutsch', flag: '🇩🇪', dir: 'ltr' }
];

const dictionaries: Record<AppLanguage, any> = {
  ar: arDict,
  en: enDict,
  it: itDict,
  fr: frDict,
  de: deDict
};

interface LanguageContextType {
  language: AppLanguage;
  dir: 'rtl' | 'ltr';
  setLanguage: (lang: AppLanguage) => void;
  t: (key: string, fallback?: string) => string;
  currentLanguageInfo: LanguageInfo;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

const STORAGE_KEY = 'app_preferred_language';

export const LanguageProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<AppLanguage>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY) as AppLanguage;
      if (saved && ['ar', 'en', 'it', 'fr', 'de'].includes(saved)) {
        return saved;
      }
      // Auto-detect browser language on first visit if non-Arabic
      if (typeof navigator !== 'undefined' && navigator.language) {
        const browserCode = navigator.language.slice(0, 2).toLowerCase();
        if (['ar', 'en', 'it', 'fr', 'de'].includes(browserCode)) {
          return browserCode as AppLanguage;
        }
      }
    } catch {}
    return 'ar';
  });

  const currentLanguageInfo = SUPPORTED_LANGUAGES.find(l => l.code === language) || SUPPORTED_LANGUAGES[0];
  const dir = currentLanguageInfo.dir;

  const setLanguage = (newLang: AppLanguage) => {
    setLanguageState(newLang);
    try {
      localStorage.setItem(STORAGE_KEY, newLang);
    } catch {}
  };

  useEffect(() => {
    // Synchronize HTML attributes for RTL/LTR & Lang
    document.documentElement.lang = language;
    document.documentElement.dir = dir;
    if (dir === 'ltr') {
      document.body.classList.add('font-sans');
    }
  }, [language, dir]);

  const t = (path: string, fallback?: string): string => {
    const keys = path.split('.');
    
    // 1. Try active language dictionary
    let current = dictionaries[language];
    let found = true;
    for (const k of keys) {
      if (current && typeof current === 'object' && k in current) {
        current = current[k];
      } else {
        found = false;
        break;
      }
    }
    if (found && typeof current === 'string') return current;

    // 2. Multi-tier Fallback: Try English
    let enCurrent = dictionaries.en;
    let enFound = true;
    for (const k of keys) {
      if (enCurrent && typeof enCurrent === 'object' && k in enCurrent) {
        enCurrent = enCurrent[k];
      } else {
        enFound = false;
        break;
      }
    }
    if (enFound && typeof enCurrent === 'string') return enCurrent;

    // 3. Multi-tier Fallback: Try Arabic
    let arCurrent = dictionaries.ar;
    let arFound = true;
    for (const k of keys) {
      if (arCurrent && typeof arCurrent === 'object' && k in arCurrent) {
        arCurrent = arCurrent[k];
      } else {
        arFound = false;
        break;
      }
    }
    if (arFound && typeof arCurrent === 'string') return arCurrent;

    return fallback || path;
  };

  return (
    <LanguageContext.Provider value={{ language, dir, setLanguage, t, currentLanguageInfo }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = (): LanguageContextType => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};
