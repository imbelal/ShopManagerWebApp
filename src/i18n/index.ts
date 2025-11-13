import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import enTranslations from './locales/en.json';
import bnTranslations from './locales/bn.json';

const resources = {
  en: {
    translation: enTranslations
  },
  bn: {
    translation: bnTranslations
  }
};

// Get saved language from localStorage or default to English
const savedLanguage = typeof window !== 'undefined'
  ? localStorage.getItem('language') || 'en'
  : 'en';

i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: savedLanguage, // Use saved language or default to English
    fallbackLng: 'en',

    interpolation: {
      escapeValue: false // React already escapes by default
    },

    react: {
      useSuspense: false // Disable suspense mode for simplicity
    }
  });

export default i18n;