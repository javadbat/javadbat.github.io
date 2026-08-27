import { useCallback, useEffect, useMemo } from "react";
import i18next, { type TFunction } from "i18next";
import { initReactI18next, useTranslation } from "react-i18next";
import { i18n as jbI18n } from "jb-core/i18n";
import type { StorageIssue } from "../storage/storage-types";

import { builderHeaderTranslations } from "../builder/BuilderHeader/translations";
import { builderStatusScreenTranslations } from "../builder/BuilderStatusScreen/translations";
import { builderWorkspaceTranslations } from "../builder/BuilderWorkspace/translations";
import { componentCatalogTranslations } from "../builder/ComponentCatalog/translations";
import { configurationPanelTranslations } from "../builder/ConfigurationPanel/translations";
import { propertyGuidanceTranslations } from "../builder/ConfigurationPanel/property-guidance.translations";
import { designerPlaceholderAppTranslations } from "../designer/translations";
import { exportJsonModalTranslations } from "../builder/ExportJsonModal/translations";
import { formCanvasTranslations } from "../builder/FormCanvas/translations";
import { formLandingAppTranslations } from "../landing/translations";
import { deleteFormTranslations } from "../landing/delete.translations";
import { formResultModalTranslations } from "../preview/FormResultModal.translations";
import { formSettingsModalTranslations } from "../builder/FormSettingsModal/translations";
import { importJsonModalTranslations } from "../builder/ImportJsonModal/translations";
import { previewAppTranslations } from "../preview/PreviewApp.translations";
import { previewFormPanelTranslations } from "../preview/PreviewFormPanel.translations";
import { removeElementModalTranslations } from "../builder/RemoveElementModal/translations";
import { validationRulesEditorTranslations } from "../builder/ValidationRulesEditor/translations";
import { commonTranslations } from "./common.translations";

export type FormAppLocale = "en" | "fa";
export type FormAppDirection = "ltr" | "rtl";

const FORM_APP_LOCALE_STORAGE_KEY = "jb-form:locale";

const formTranslationModules = [
  builderHeaderTranslations,
  builderStatusScreenTranslations,
  builderWorkspaceTranslations,
  componentCatalogTranslations,
  configurationPanelTranslations,
  propertyGuidanceTranslations,
  designerPlaceholderAppTranslations,
  exportJsonModalTranslations,
  formCanvasTranslations,
  formLandingAppTranslations,
  deleteFormTranslations,
  formResultModalTranslations,
  formSettingsModalTranslations,
  importJsonModalTranslations,
  previewAppTranslations,
  previewFormPanelTranslations,
  removeElementModalTranslations,
  validationRulesEditorTranslations,
  commonTranslations,
] as const;

const formAppDictionarySource = {
  en: Object.assign({}, ...formTranslationModules.map(module => module.en)),
  fa: Object.assign({}, ...formTranslationModules.map(module => module.fa)),
} as const;

export type FormMessageKey = Extract<keyof (typeof formAppDictionarySource)["en"], string>;
export type FormMessages = Record<FormMessageKey, string>;
export const formAppMessages: Record<FormAppLocale, FormMessages> = formAppDictionarySource;

const formMessageKeys = Object.keys(formAppDictionarySource.en) as FormMessageKey[];

export const formAppI18n = i18next.createInstance();

void formAppI18n.use(initReactI18next).init({
  resources: {
    en: { translation: formAppDictionarySource.en },
    fa: { translation: formAppDictionarySource.fa },
  },
  lng: readStoredFormAppLocale("en"),
  fallbackLng: "en",
  supportedLngs: ["en", "fa"],
  interpolation: { escapeValue: false },
  initAsync: false,
});

function resolveFormMessages(t: TFunction): FormMessages {
  return Object.fromEntries(formMessageKeys.map(key => [key, t(key)])) as FormMessages;
}

export function getStorageIssueMessage(messages: FormMessages, issue: StorageIssue | null): string {
  if (!issue) {
    return messages.storageError;
  }
  switch (issue.code) {
    case "storage-blocked":
      return messages.storageBlocked;
    case "storage-unavailable":
      return messages.storageUnavailable;
    case "quota-exceeded":
      return messages.quotaExceeded;
    case "slug-collision":
      return messages.slugCollision;
    case "revision-conflict":
      return messages.revisionConflict;
    case "validation-failed":
      return messages.invalidForm;
    case "corrupt-record":
    case "incompatible-record":
      return messages.corruptForm;
    default:
      return messages.storageError;
  }
}

function localeDirection(locale: FormAppLocale): FormAppDirection {
  return locale === "fa" ? "rtl" : "ltr";
}

function readStoredFormAppLocale(fallback: FormAppLocale): FormAppLocale {
  try {
    const storedLocale = globalThis.localStorage?.getItem(FORM_APP_LOCALE_STORAGE_KEY);
    return storedLocale === "en" || storedLocale === "fa" ? storedLocale : fallback;
  } catch {
    return fallback;
  }
}

function persistFormAppLocale(locale: FormAppLocale): void {
  try {
    globalThis.localStorage?.setItem(FORM_APP_LOCALE_STORAGE_KEY, locale);
  } catch {
    // All /form routes still work when browser storage is unavailable.
  }
}

function configureJBI18n(locale: FormAppLocale): void {
  const direction = localeDirection(locale);

  document.documentElement.lang = locale;
  document.documentElement.dir = direction;
  // jb-core resolves the calendar, region, and numbering-system defaults.
  // Passing the locale string also ensures every locale-aware JB component,
  // including jb-range-input, receives the same canonical configuration.
  jbI18n.setLocale(locale);
}

export function useFormLocale(initialLocale: FormAppLocale = "en") {
  const { t, i18n } = useTranslation(undefined, { i18n: formAppI18n });
  const locale = (i18n.resolvedLanguage === "fa" ? "fa" : "en") satisfies FormAppLocale;
  const messages = useMemo(() => resolveFormMessages(t), [t, locale]);

  const setLocale = useCallback((nextLocale: FormAppLocale) => {
    persistFormAppLocale(nextLocale);
    void i18n.changeLanguage(nextLocale);
  }, [i18n]);

  useEffect(() => {
    configureJBI18n(locale);
  }, [locale]);

  return {
    locale,
    direction: localeDirection(locale),
    setLocale,
    messages,
    t: (key: FormMessageKey) => t(key),
  };
}
