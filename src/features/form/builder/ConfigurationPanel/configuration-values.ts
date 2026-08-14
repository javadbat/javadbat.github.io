import type { JSONValue, LocalizedText } from "../../domain/form-document";
import type { PropertyLabel } from "../../registry/form-element-configuration";

export interface PortableSelectOption {
  id: string;
  value: string;
  label: LocalizedText;
  disabled: boolean;
}

export function inputValue(event: Event): string {
  return String((event.target as unknown as { value?: unknown }).value ?? "");
}

export function propertyLabel(value: PropertyLabel, locale: string): string {
  return locale === "fa" ? value.fa : value.en;
}

function isLocalizedText(value: JSONValue | undefined): value is JSONValue & {
  translations: Record<string, JSONValue>;
} {
  return (
    typeof value === "object" &&
    value !== null &&
    !Array.isArray(value) &&
    typeof value.translations === "object" &&
    value.translations !== null &&
    !Array.isArray(value.translations)
  );
}

export function localizedPropertyValue(value: JSONValue | undefined, locale: string, defaultLocale: string): string {
  if (!isLocalizedText(value)) {
    return typeof value === "string" ? value : "";
  }

  const translated = value.translations[locale] ?? value.translations[defaultLocale] ?? value.translations.en ?? Object.values(value.translations)[0];
  return typeof translated === "string" ? translated : "";
}

export function asSelectOptions(value: JSONValue | undefined): PortableSelectOption[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.flatMap(candidate => {
    if (typeof candidate !== "object" || candidate === null || Array.isArray(candidate)) {
      return [];
    }

    const translations =
      typeof candidate.label === "object" &&
      candidate.label !== null &&
      !Array.isArray(candidate.label) &&
      typeof candidate.label.translations === "object" &&
      candidate.label.translations !== null &&
      !Array.isArray(candidate.label.translations)
        ? candidate.label.translations
        : {};

    return [
      {
        id: typeof candidate.id === "string" ? candidate.id : crypto.randomUUID(),
        value: typeof candidate.value === "string" ? candidate.value : "",
        label: {
          translations: Object.fromEntries(Object.entries(translations).flatMap(([key, translation]) => (typeof translation === "string" ? [[key, translation]] : []))),
        },
        disabled: candidate.disabled === true,
      },
    ];
  });
}
