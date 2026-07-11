export const supportedLanguages = ['en', 'pt'] as const;

export type SupportedLanguage = (typeof supportedLanguages)[number];

export const defaultLanguage: SupportedLanguage = 'en';

export const languageLabels: Record<SupportedLanguage, string> = {
  en: 'English',
  pt: 'Portuguese',
};
