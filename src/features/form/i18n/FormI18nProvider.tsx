import { useEffect, useState, type ReactNode } from "react";
import { I18nextProvider } from "react-i18next";
import { i18n as jbI18n } from "jb-core/i18n";
import { formI18n, DEFAULT_FORM_LOCALE, isFormLocale, type FormAppLocale } from "./i18n";

const LOCALE_STORAGE_KEY = "jb-form:locale";

function readLocale(): FormAppLocale {
  try {
    const saved = localStorage.getItem(LOCALE_STORAGE_KEY);
    return isFormLocale(saved) ? saved : DEFAULT_FORM_LOCALE;
  } catch {
    return DEFAULT_FORM_LOCALE;
  }
}

/** Mount once at each form page's React root. i18next owns the interface locale. */
export function FormI18nProvider({ children }: { children: ReactNode }) {
  const [ready, setReady] = useState(false);
  useEffect(() => {
    const synchronizeLocale = (language: string) => {
      const locale = isFormLocale(language) ? language : DEFAULT_FORM_LOCALE;
      document.documentElement.lang = locale;
      document.documentElement.dir = formI18n.dir(locale);
      jbI18n.setLocale(locale);
      try {
        localStorage.setItem(LOCALE_STORAGE_KEY, locale);
      } catch {
        // Interface language switching still works without browser storage.
      }
    };

    formI18n.on("languageChanged", synchronizeLocale);
    // Bundled resources initialize synchronously. Mount children after JB defaults agree.
    void formI18n.changeLanguage(readLocale());
    setReady(true);
    return () => { formI18n.off("languageChanged", synchronizeLocale); };
  }, []);

  return <I18nextProvider i18n={formI18n}>{ready ? children : null}</I18nextProvider>;
}
