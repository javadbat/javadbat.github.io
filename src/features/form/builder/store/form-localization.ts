import type { JSONValue, LocalizedText } from "../../domain/form-document";

/** Removes translations for deleted locales while preserving one fallback value for portable content. */
export function pruneLocalizedTranslations(value: JSONValue, allowedLocales: Set<string>, fallbackLocale: string): void {
  if (Array.isArray(value)) {
    value.forEach(item => pruneLocalizedTranslations(item, allowedLocales, fallbackLocale));
    return;
  }
  if (value === null || typeof value !== "object") return;

  if ("translations" in value && value.translations !== null && typeof value.translations === "object" && !Array.isArray(value.translations)) {
    /** Text retained if pruning would otherwise leave the localized field empty. */
    const fallbackValue = value.translations[fallbackLocale] ?? value.translations.en ?? Object.values(value.translations)[0] ?? "";
    for (const locale of Object.keys(value.translations)) {
      if (!allowedLocales.has(locale)) delete value.translations[locale];
    }
    if (Object.keys(value.translations).length === 0) value.translations[fallbackLocale] = fallbackValue;
    return;
  }

  Object.values(value).forEach(child => pruneLocalizedTranslations(child, allowedLocales, fallbackLocale));
}

/** Identifies portable JSON values that implement the localized-text business contract. */
export function isLocalizedTextValue(value: JSONValue | undefined): value is JSONValue & { translations: Record<string, string> } {
  return (
    value !== undefined &&
    value !== null &&
    typeof value === "object" &&
    !Array.isArray(value) &&
    "translations" in value &&
    value.translations !== null &&
    typeof value.translations === "object" &&
    !Array.isArray(value.translations) &&
    Object.values(value.translations).every(item => typeof item === "string")
  );
}

/** Returns localized text with one locale updated, preserving all other locale values. */
export function patchLocalizedText(value: LocalizedText | undefined, text: string, locale: string): LocalizedText | undefined {
  /** Detached translation map updated without mutating the caller's document fragment. */
  const translations = { ...(value?.translations ?? {}) };
  translations[locale] = text;
  return { translations };
}
