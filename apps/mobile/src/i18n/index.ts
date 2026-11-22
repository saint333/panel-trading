import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import { es } from './es';

export const resources = { es } as const;

void i18n.use(initReactI18next).init({
  resources,
  lng: 'es',
  fallbackLng: 'es',
  interpolation: { escapeValue: false },
  returnNull: false,
});

export default i18n;
