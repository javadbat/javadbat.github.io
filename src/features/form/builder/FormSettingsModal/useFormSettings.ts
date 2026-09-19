import { useTranslation } from "react-i18next";
import type { TFunction } from "i18next";
import { useEffect, useState } from "react";
import { canonicalizeLocaleCode, inferLocaleDirection, type LocaleDefinition } from "../../domain/form-document";
import { isValidFormSlug, normalizeFormSlug } from "../../application/form-slug";
import { getStorageIssueMessage } from "../../i18n/storage-issue-message";
import type { StorageIssue } from "../../storage/storage-types";
import { useBuilderStore } from "../store/BuilderStoreContext";

export function copyLocaleDefinitions(locales: Record<string, LocaleDefinition>): Record<string, LocaleDefinition> {
  return Object.fromEntries(Object.entries(locales).map(([locale, definition]) => [locale, { direction: definition.direction }]));
}

export function getFormSettingsSaveError(tCommon: TFunction<"common">, issue: StorageIssue | null): string {
  const summary = getStorageIssueMessage(tCommon, issue);
  if (!issue || issue.code !== "validation-failed") return summary;
  if (issue.formIssues?.length) {
    return [summary, ...issue.formIssues.map(formIssue => `${formIssue.path}: ${formIssue.message}`)].join("\n");
  }
  return issue.message && issue.message !== summary ? `${summary}\n${issue.message}` : summary;
}

export function useFormSettings(isOpen: boolean, onClose: () => void) {
  const { t: tCommon } = useTranslation("common");
  const { t } = useTranslation("formSettingsModal");
  const store = useBuilderStore();
  const [name, setName] = useState(store.formName);
  const [defaultLocale, setDefaultLocale] = useState(store.document.localization.defaultLocale);
  const [locales, setLocales] = useState<Record<string, LocaleDefinition>>({});
  const [newLocale, setNewLocale] = useState("");
  const [localeError, setLocaleError] = useState("");
  const [slug, setSlug] = useState(store.document.slug ?? "");
  const [saveError, setSaveError] = useState("");

  useEffect(() => {
    if (!isOpen) return;
    setName(store.formName);
    setDefaultLocale(store.document.localization.defaultLocale);
    setLocales(copyLocaleDefinitions(store.document.localization.locales));
    setNewLocale("");
    setLocaleError("");
    setSlug(store.document.slug ?? "");
    setSaveError("");
  }, [isOpen, store]);

  const normalizedSlug = normalizeFormSlug(slug);
  const slugIsValid = slug.length === 0 || isValidFormSlug(normalizedSlug);
  const addLocale = () => {
    const normalized = canonicalizeLocaleCode(newLocale);
    if (!normalized) return setLocaleError(t("localeInvalid"));
    if (locales[normalized]) return setLocaleError(t("localeAlreadyAdded"));
    setLocales(current => ({ ...current, [normalized]: { direction: inferLocaleDirection(normalized) } }));
    setNewLocale("");
    setLocaleError("");
  };
  const removeLocale = (locale: string) => {
    if (locale === defaultLocale || Object.keys(locales).length <= 1) return;
    setLocales(current => Object.fromEntries(Object.entries(current).filter(([key]) => key !== locale)));
  };
  const persist = async (saveAs: boolean) => {
    if (!slugIsValid || (saveAs && normalizedSlug.length === 0)) return setSaveError(t("slugInvalid"));
    store.setFormLocalization({ defaultLocale, locales });
    store.updateFormName(name, defaultLocale);
    store.setEditingLocale(defaultLocale);
    const saved = await store.save({ slug: normalizedSlug || undefined, saveAs });
    if (saved) onClose();
    else setSaveError(getFormSettingsSaveError(tCommon, store.storageIssue));
  };

  return {
    store,
    name,
    setName,
    defaultLocale,
    setDefaultLocale,
    locales,
    setLocales,
    newLocale,
    setNewLocale,
    localeError,
    slug,
    setSlug,
    saveError,
    normalizedSlug,
    slugIsValid,
    addLocale,
    removeLocale,
    persist,
  };
}
