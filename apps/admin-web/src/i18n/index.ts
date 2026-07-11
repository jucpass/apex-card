import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

import en from '../locales/en.json';
import pt from '../locales/pt.json';

export const supportedLanguages = ['en', 'pt'] as const;
export type SupportedLanguage = (typeof supportedLanguages)[number];

const fallbackLanguage: SupportedLanguage = 'en';
const storageKey = 'apex.language';

const normalizeLanguage = (language?: string): SupportedLanguage | null => {
  const baseLanguage = language?.toLowerCase().split('-')[0];
  return supportedLanguages.find((supportedLanguage) => supportedLanguage === baseLanguage) ?? null;
};

const detectLanguage = (): SupportedLanguage => {
  const savedLanguage = normalizeLanguage(window.localStorage.getItem(storageKey) ?? undefined);
  if (savedLanguage) {
    return savedLanguage;
  }

  const browserLanguage =
    window.navigator.languages.map(normalizeLanguage).find(Boolean) ??
    normalizeLanguage(window.navigator.language);

  return browserLanguage ?? fallbackLanguage;
};

void i18n.use(initReactI18next).init({
  resources: {
    en: { translation: en },
    pt: { translation: pt },
  },
  lng: detectLanguage(),
  fallbackLng: fallbackLanguage,
  interpolation: {
    escapeValue: false,
  },
});

export const setAppLanguage = async (language: SupportedLanguage) => {
  window.localStorage.setItem(storageKey, language);
  await i18n.changeLanguage(language);
};

export default i18n;
