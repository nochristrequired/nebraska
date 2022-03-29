import i18next from 'i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import { initReactI18next } from 'react-i18next';

const en = {}; // To keep TS happy.

i18next
  // detect user language https://github.com/i18next/i18next-browser-languageDetector
  .use(LanguageDetector)
  .use(initReactI18next)
  // Use dynamic imports (webpack code splitting) to load javascript bundles.
  // @see https://www.i18next.com/misc/creating-own-plugins#backend
  // @see https://webpack.js.org/guides/code-splitting/
  .use({
    type: 'backend',
    read<Namespace extends keyof typeof en>(
      language: string | any,
      namespace: Namespace,
      callback: (errorValue: unknown, translations: null | typeof en[Namespace]) => void
    ) {
      import(`./locales/${language}/${namespace}.json`)
        .then(resources => {
          callback(null, resources);
        })
        .catch(error => {
          callback(error, null);
        });
    },
  })
  // i18next options: https://www.i18next.com/overview/configuration-options
  .init({
    debug: process.env.NODE_ENV === 'development',
    fallbackLng: 'en',
    supportedLngs: ['en'],
    // nonExplicitSupportedLngs: true,
    interpolation: {
      escapeValue: false, // not needed for react as it escapes by default
      format: function (value, format, lng) {
        // https://www.i18next.com/translation-function/formatting
        if (format === 'number') return new Intl.NumberFormat(lng).format(value);
        if (format === 'date')
          return new Intl.DateTimeFormat(lng, {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
          }).format(value);

        return value;
      },
    },
    returnEmptyString: false,
    // https://react.i18next.com/latest/i18next-instance
    // https://www.i18next.com/overview/configuration-options
    react: {
      useSuspense: false, // not needed unless loading from public/locales
      //   bindI18nStore: 'added'
    },
    nsSeparator: '|',
    keySeparator: false,
  });

export default i18next;
