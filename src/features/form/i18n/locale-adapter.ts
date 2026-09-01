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
import { designerAppTranslations } from "../designer/DesignerApp.translations";
import { designerHeaderTranslations } from "../designer/DesignerHeader/translations";
import { designerMobileTabsTranslations } from "../designer/DesignerMobileTabs/translations";
import { designerPreviewPanelTranslations } from "../designer/DesignerPreviewPanel/translations";
import { exportThemeDialogTranslations } from "../designer/ExportThemeDialog/translations";
import { themePresetPanelTranslations } from "../designer/ThemePresetPanel/translations";
import { exportJsonModalTranslations } from "../builder/ExportJsonModal/translations";
import { formCanvasTranslations } from "../builder/FormCanvas/translations";
import { formLandingAppTranslations } from "../landing/translations";
import { deleteFormTranslations } from "../landing/delete.translations";
import { formResultModalTranslations } from "../preview/FormResultModal.translations";
import { formSettingsModalTranslations } from "../builder/FormSettingsModal/translations";
import { importJsonModalTranslations } from "../builder/ImportJsonModal/translations";
import { previewAppTranslations } from "../preview/PreviewApp.translations";
import { previewFormPanelTranslations } from "../preview/PreviewFormPanel.translations";
import { validationRulesEditorTranslations } from "../builder/ValidationRulesEditor/translations";
import { commonTranslations } from "./common.translations";
import { removeElementModalTranslations } from "../builder/FormCanvas/RemoveElementModal/translations";
import { formRouteMenuTranslations } from "../layout/FormRouteMenu.translations";

/** Supported interface locales for every `/form` route. */
export type FormAppLocale = "en" | "fa";
/** Document flow direction paired with the active interface locale. */
export type FormAppDirection = "ltr" | "rtl";

/** Browser preference key that keeps locale selection consistent across form routes. */
const FORM_APP_LOCALE_STORAGE_KEY = "jb-form:locale";

/** Component-owned dictionaries composed into the form application's translation catalog. */
const formTranslationModules = [
  builderHeaderTranslations,
  builderStatusScreenTranslations,
  builderWorkspaceTranslations,
  componentCatalogTranslations,
  configurationPanelTranslations,
  propertyGuidanceTranslations,
  designerPlaceholderAppTranslations,
  designerAppTranslations,
  designerHeaderTranslations,
  designerMobileTabsTranslations,
  designerPreviewPanelTranslations,
  exportThemeDialogTranslations,
  themePresetPanelTranslations,
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
  formRouteMenuTranslations,
  commonTranslations,
] as const;

/** Locale-indexed source dictionaries used to initialize i18next and derive strict message keys. */
const formAppDictionarySource = {
  en: Object.assign({}, ...formTranslationModules.map(module => module.en)),
  fa: Object.assign({}, ...formTranslationModules.map(module => module.fa)),
} as const;

/** Every message identifier available to form components. */
export type FormMessageKey = Extract<keyof (typeof formAppDictionarySource)["en"], string>;
/** Fully resolved message map passed to components so UI copy remains locale-independent. */
export type FormMessages = Record<FormMessageKey, string>;
/** Direct locale-to-message lookup used by non-hook contexts and tests. */
export const formAppMessages: Record<FormAppLocale, FormMessages> = formAppDictionarySource;

/** Stable list of message identifiers materialized for each hook consumer. */
const formMessageKeys = Object.keys(formAppDictionarySource.en) as FormMessageKey[];

/** Isolated i18next instance for the form product, separate from host-page localization. */
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

/** Resolves all form message keys through i18next for the active locale. */
function resolveFormMessages(t: TFunction): FormMessages {
  return Object.fromEntries(formMessageKeys.map(key => [key, t(key)])) as FormMessages;
}

/** Maps persistence failure categories to actionable, localized form-product copy. */
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

/** Returns the writing direction required by the supported interface locale. */
function localeDirection(locale: FormAppLocale): FormAppDirection {
  return locale === "fa" ? "rtl" : "ltr";
}

/** Reads a valid saved locale preference without allowing unavailable storage to block the app. */
function readStoredFormAppLocale(fallback: FormAppLocale): FormAppLocale {
  try {
    /** Previously selected locale shared by all form routes. */
    const storedLocale = globalThis.localStorage?.getItem(FORM_APP_LOCALE_STORAGE_KEY);
    return storedLocale === "en" || storedLocale === "fa" ? storedLocale : fallback;
  } catch {
    return fallback;
  }
}

/** Persists the user's locale choice when browser storage is available. */
function persistFormAppLocale(locale: FormAppLocale): void {
  try {
    globalThis.localStorage?.setItem(FORM_APP_LOCALE_STORAGE_KEY, locale);
  } catch {
    // All /form routes still work when browser storage is unavailable.
  }
}

/**
 * Synchronizes the active locale with document semantics and all JB web
 * components so calendars, number systems, direction, and messages agree.
 */
function configureJBI18n(locale: FormAppLocale): void {
  /** Writing direction applied to both native layout and component behavior. */
  const direction = localeDirection(locale);

  document.documentElement.lang = locale;
  document.documentElement.dir = direction;
  // jb-core resolves the calendar, region, and numbering-system defaults.
  // Passing the locale string also ensures every locale-aware JB component,
  // including jb-range-input, receives the same canonical configuration.
  jbI18n.setLocale(locale);
}

/**
 * Provides the active form locale, direction, strict messages, and locale
 * switching while coordinating React i18next, browser preference, and JB UI.
 */
export function useFormLocale(initialLocale: FormAppLocale = "en") {
  /** Translation function and isolated form i18n controller for the current React tree. */
  const { t, i18n } = useTranslation(undefined, { i18n: formAppI18n });
  /** Canonical supported locale even when i18next reports a regional or fallback language. */
  const locale: FormAppLocale = i18n.resolvedLanguage === "fa" ? "fa" : "en";
  /** Complete localized copy contract consumed by form components. */
  const messages = useMemo(() => resolveFormMessages(t), [t, locale]);

  /** User action that persists and activates a new form interface locale. */
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
