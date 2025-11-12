import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

// Vite's glob import - automatically imports all JSON files in locales folder
const translationModules = import.meta.glob('./locales/*.json', {
  eager: true,
});

// Build resources object from imported modules
const resources = {};
for (const path in translationModules) {
  const locale = path.match(/\.\/locales\/(.+)\.json$/)[1];
  resources[locale] = {
    translation: translationModules[path].default || translationModules[path],
  };
}

// Get saved language from localStorage or default to 'en'
const savedLanguage = localStorage.getItem('language') || 'en';

// Set initial document direction
document.dir = savedLanguage === 'ar' ? 'rtl' : 'ltr';
document.documentElement.lang = savedLanguage;

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    fallbackLng: 'en',
    lng: savedLanguage,

    // Language detection options
    detection: {
      order: ['localStorage', 'navigator'],
      caches: ['localStorage'],
    },

    interpolation: {
      escapeValue: false, // React already escapes values
    },

    // Vite/React specific optimizations
    react: {
      useSuspense: false, // Disable suspense for simpler setup
    },
  });

// Listen for language changes to update document direction
i18n.on('languageChanged', (lng) => {
  document.dir = lng === 'ar' ? 'rtl' : 'ltr';
  document.documentElement.lang = lng;
  localStorage.setItem('language', lng);
});

export default i18n;
