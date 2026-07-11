import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Localization from 'expo-localization';
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

import en from '../locales/en.json';
import pt from '../locales/pt.json';

export const supportedLanguages = ['en', 'pt'] as const;
export type SupportedLanguage = (typeof supportedLanguages)[number];

const fallbackLanguage: SupportedLanguage = 'en';
const storageKey = 'apex.language';

const normalizeLanguage = (language?: string | null): SupportedLanguage | null => {
  const baseLanguage = language?.toLowerCase().split('-')[0];
  return supportedLanguages.find((supportedLanguage) => supportedLanguage === baseLanguage) ?? null;
};

const detectDeviceLanguage = (): SupportedLanguage =>
  Localization.getLocales().map((locale) => normalizeLanguage(locale.languageTag)).find(Boolean) ??
  fallbackLanguage;

void i18n.use(initReactI18next).init({
  resources: {
    en: { translation: en },
    pt: { translation: pt },
  },
  lng: fallbackLanguage,
  fallbackLng: fallbackLanguage,
  interpolation: {
    escapeValue: false,
  },
});

void AsyncStorage.getItem(storageKey).then((storedLanguage) => {
  const savedLanguage = normalizeLanguage(storedLanguage);
  void i18n.changeLanguage(savedLanguage ?? detectDeviceLanguage());
});

export const setAppLanguage = async (language: SupportedLanguage) => {
  await AsyncStorage.setItem(storageKey, language);
  await i18n.changeLanguage(language);
};

export default i18n;
