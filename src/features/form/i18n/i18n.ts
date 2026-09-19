import i18next from "i18next";
import { initReactI18next } from "react-i18next";
import { formResources } from "./resources";

export const DEFAULT_FORM_LOCALE = "en";
export const FORM_LOCALES = ["en", "fa"] as const;
export type FormAppLocale = typeof FORM_LOCALES[number];
export type FormAppDirection = "ltr" | "rtl";

export function isFormLocale(value: unknown): value is FormAppLocale {
  return value === "en" || value === "fa";
}

/** Resources and defaults only. Browser preference and JB synchronization live in the page provider. */
export const formI18n = i18next.createInstance();
void formI18n.use(initReactI18next).init({
  resources: formResources,
  lng: DEFAULT_FORM_LOCALE,
  fallbackLng: DEFAULT_FORM_LOCALE,
  supportedLngs: [...FORM_LOCALES],
  defaultNS: "common",
  interpolation: { escapeValue: false },
  initAsync: false,
});

declare module "i18next" {
  interface CustomTypeOptions {
    defaultNS: "common";
    resources: typeof formResources.en;
  }
}
