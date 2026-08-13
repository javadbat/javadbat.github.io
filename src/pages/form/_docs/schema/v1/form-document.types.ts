/**
 * Portable JB Form document schema version 1.
 *
 * This file mirrors form-document.schema.json. JSON Schema remains the runtime
 * validation source of truth; these types provide compile-time integration.
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
  | "jb-range-input"
  | "jb-mobile-input"
  | "jb-password-input"
  | "jb-payment-input"
  | "jb-national-input"
  | "jb-date-input"
  | "jb-time-input"
  | "jb-pin-input"
  | "jb-textarea"
  | "jb-select"
  | "jb-listbox"
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

export type MinLengthValidationRule = ValidationRuleBase<"minLength", { value: number }>;

export type MaxLengthValidationRule = ValidationRuleBase<"maxLength", { value: number }>;

export type PatternValidationRule = ValidationRuleBase<"pattern", { source: string; flags: string }>;

export type MinValueValidationRule = ValidationRuleBase<"minValue", { value: number }>;

export type MaxValueValidationRule = ValidationRuleBase<"maxValue", { value: number }>;

export type AllowedValuesValidationRule = ValidationRuleBase<"allowedValues", { values: JSONPrimitive[] }>;

export type JBValidationRule =
  | MinLengthValidationRule
  | MaxLengthValidationRule
  | PatternValidationRule
  | MinValueValidationRule
  | MaxValueValidationRule
  | AllowedValuesValidationRule;

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
