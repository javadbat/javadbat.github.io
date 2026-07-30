/**
 * Runtime copy of the approved portable JB Form document contract.
 * Keep this file aligned with `_docs/schema/v1/form-document.types.ts`.
 */
export const JB_FORM_SCHEMA_V1 = "https://javadbat.github.io/schemas/jb-form/v1.json" as const;

export type UUID = string;
export type LocaleCode = string;
export type JSONPrimitive = string | number | boolean | null;
export type JSONValue = JSONPrimitive | JSONValue[] | { [key: string]: JSONValue };

export interface LocalizedText {
  translations: Record<LocaleCode, string>;
}

export interface FormMetadata {
  name: LocalizedText;
  description?: LocalizedText;
  createdAt: string;
  updatedAt: string;
}

export interface LocaleDefinition {
  direction: "ltr" | "rtl";
}

export interface FormLocalization {
  defaultLocale: LocaleCode;
  locales: Record<LocaleCode, LocaleDefinition>;
}

export type JBFormElementType =
  | "jb-input"
  | "jb-number-input"
  | "jb-mobile-input"
  | "jb-password-input"
  | "jb-payment-input"
  | "jb-national-input"
  | "jb-date-input"
  | "jb-time-input"
  | "jb-pin-input"
  | "jb-textarea"
  | "jb-select"
  | "jb-checkbox"
  | "jb-switch"
  | "jb-file-input"
  | "jb-image-input"
  | "jb-button";

interface ValidationRuleBase<Rule extends string, Params extends Record<string, JSONValue>> {
  id: UUID;
  rule: Rule;
  params: Params;
  message: LocalizedText;
}

export type JBValidationRule =
  | ValidationRuleBase<"minLength", { value: number }>
  | ValidationRuleBase<"maxLength", { value: number }>
  | ValidationRuleBase<"pattern", { source: string; flags: string }>
  | ValidationRuleBase<"minValue", { value: number }>
  | ValidationRuleBase<"maxValue", { value: number }>
  | ValidationRuleBase<"allowedValues", { values: JSONPrimitive[] }>;

export interface JBFormElementV1 {
  id: UUID;
  type: JBFormElementType;
  adapterVersion: number;
  name: string;
  required?: boolean;
  disabled?: boolean;
  initialValue?: JSONValue;
  label?: LocalizedText;
  placeholder?: LocalizedText;
  props: Record<string, JSONValue>;
  validation: JBValidationRule[];
}

export interface JBFormDocumentV1 {
  $schema: typeof JB_FORM_SCHEMA_V1;
  schemaVersion: 1;
  id: UUID;
  slug?: string;
  metadata: FormMetadata;
  localization: FormLocalization;
  elements: JBFormElementV1[];
  theme: null;
}

export type JBFormDocument = JBFormDocumentV1;

export function localizedText(value: string, locale = "en"): LocalizedText {
  return { translations: { [locale]: value } };
}

export function getLocalizedText(value: LocalizedText | undefined, locale: string): string {
  if (!value) {
    return "";
  }

  return value.translations[locale] ?? value.translations.en ?? Object.values(value.translations)[0] ?? "";
}

export function createEmptyFormDocument(): JBFormDocumentV1 {
  const timestamp = new Date().toISOString();

  return {
    $schema: JB_FORM_SCHEMA_V1,
    schemaVersion: 1,
    id: crypto.randomUUID(),
    metadata: {
      name: localizedText("Untitled form"),
      createdAt: timestamp,
      updatedAt: timestamp,
    },
    localization: {
      defaultLocale: "en",
      locales: {
        en: { direction: "ltr" },
      },
    },
    elements: [],
    theme: null,
  };
}
