import type { JSONValue, LocalizedText } from "../../domain/form-document";
import type { PropertyLabel } from "jb-form-builder/registry/form-element-configuration";

/** Portable option shape edited by select-like component configuration controls. */
export interface PortableSelectOption {
  /** Stable option identity used by React and builder edits. */
  id: string;
  /** Submitted business value for this choice. */
  value: string;
  /** User-facing option text in configured form locales. */
  label: LocalizedText;
  /** Whether respondents may currently choose the option. */
  disabled: boolean;
}

/** Normalizes custom-element input events into text accepted by builder stores. */
export function inputValue(event: Event): string {
  return String((event.target as unknown as { value?: unknown }).value ?? "");
}

/** Resolves registry-authored property labels for the builder interface locale. */
export function propertyLabel(value: PropertyLabel, locale: string): string {
  return locale === "fa" ? value.fa : value.en;
}

/** Identifies portable property values that carry a locale-to-text dictionary. */
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

/** Resolves a localized property for the editing locale with document and English fallbacks. */
export function localizedPropertyValue(value: JSONValue | undefined, locale: string, defaultLocale: string): string {
  if (!isLocalizedText(value)) {
    return typeof value === "string" ? value : "";
  }

  /** Best available user-facing translation for the current editing context. */
  const translated = value.translations[locale] ?? value.translations[defaultLocale] ?? value.translations.en ?? Object.values(value.translations)[0];
  return typeof translated === "string" ? translated : "";
}

/** Safely projects untrusted portable JSON into options editable by select controls. */
export function asSelectOptions(value: JSONValue | undefined): PortableSelectOption[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.flatMap(candidate => {
    if (typeof candidate !== "object" || candidate === null || Array.isArray(candidate)) {
      return [];
    }

    /** String-only localized label values retained from the portable candidate. */
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
