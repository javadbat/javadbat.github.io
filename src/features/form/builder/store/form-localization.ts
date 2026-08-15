import type { JSONValue, LocalizedText } from "../../domain/form-document";

export function pruneLocalizedTranslations(value: JSONValue, allowedLocales: Set<string>, fallbackLocale: string): void {
  if (Array.isArray(value)) {
    value.forEach(item => pruneLocalizedTranslations(item, allowedLocales, fallbackLocale));
    return;
  }
  if (value === null || typeof value !== "object") return;

  if ("translations" in value && value.translations !== null && typeof value.translations === "object" && !Array.isArray(value.translations)) {
    const fallbackValue = value.translations[fallbackLocale] ?? value.translations.en ?? Object.values(value.translations)[0] ?? "";
    for (const locale of Object.keys(value.translations)) {
      if (!allowedLocales.has(locale)) delete value.translations[locale];
    }
    if (Object.keys(value.translations).length === 0) value.translations[fallbackLocale] = fallbackValue;
    return;
  }

  Object.values(value).forEach(child => pruneLocalizedTranslations(child, allowedLocales, fallbackLocale));
}

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

export function patchLocalizedText(value: LocalizedText | undefined, text: string, locale: string): LocalizedText | undefined {
  const translations = { ...(value?.translations ?? {}) };
  if (text) translations[locale] = text;
  else delete translations[locale];
  return Object.keys(translations).length > 0 ? { translations } : undefined;
}
