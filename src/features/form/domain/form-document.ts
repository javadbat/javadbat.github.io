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
  | "text"
  | "image"
  | "voice"
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
  | "jb-button"
  | "jb-tab"
  | "jb-condition";

export type JBFormLeafElementType = Exclude<JBFormElementType, "jb-tab" | "jb-condition">;
export type JBFormElementKind = "content" | "field" | "container";
export type ContainerValidationScope = "all" | "active";
export type JBConditionMatch = "all" | "any";
export type JBConditionOperator =
  | "equals"
  | "notEquals"
  | "isEmpty"
  | "isNotEmpty"
  | "contains"
  | "notContains"
  | "containsAny"
  | "containsAll"
  | "greaterThan"
  | "greaterThanOrEqual"
  | "lessThan"
  | "lessThanOrEqual";

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

export interface JBFormElementBaseV1 {
  id: UUID;
  type: JBFormElementType;
  adapterVersion: number;
  name: string;
  props: Record<string, JSONValue>;
  required?: boolean;
  disabled?: boolean;
  initialValue?: JSONValue;
  label?: LocalizedText;
  placeholder?: LocalizedText;
  validation: JBValidationRule[];
}

export interface JBFormLeafElementV1 extends JBFormElementBaseV1 {
  type: JBFormLeafElementType;
  required?: boolean;
  disabled?: boolean;
  initialValue?: JSONValue;
  label?: LocalizedText;
  placeholder?: LocalizedText;
}

export interface JBTabItemV1 {
  id: UUID;
  value: string;
  label: LocalizedText;
  disabled: boolean;
  color?: string;
  children: JBFormLeafElementV1[];
}

export interface JBTabElementV1 extends JBFormElementBaseV1 {
  type: "jb-tab";
  validationScope: ContainerValidationScope;
  tabs: JBTabItemV1[];
}

export interface JBConditionRuleV1 {
  id: UUID;
  fieldName: string;
  operator: JBConditionOperator;
  value?: JSONValue;
}

export interface JBConditionGroupV1 {
  match: JBConditionMatch;
  rules: JBConditionRuleV1[];
}

export interface JBConditionElementV1 extends JBFormElementBaseV1 {
  type: "jb-condition";
  conditions: JBConditionGroupV1;
  children: JBFormLeafElementV1[];
}

/** Containers are deliberately one level deep in v1. */
export type JBFormContainerElementV1 = JBTabElementV1 | JBConditionElementV1;
export type JBFormElementV1 = JBFormLeafElementV1 | JBFormContainerElementV1;

export function isTabElement(element: JBFormElementV1): element is JBTabElementV1 {
  return element.type === "jb-tab";
}

export function isConditionElement(element: JBFormElementV1): element is JBConditionElementV1 {
  return element.type === "jb-condition";
}

export function isContainerElement(element: JBFormElementV1): element is JBFormContainerElementV1 {
  return isTabElement(element) || isConditionElement(element);
}

export function getContainerChildren(element: JBFormContainerElementV1): JBFormLeafElementV1[] {
  return isTabElement(element) ? element.tabs.flatMap(tab => tab.children) : element.children;
}

export function walkFormElements(elements: readonly JBFormElementV1[]): JBFormElementV1[] {
  return elements.flatMap(element => isContainerElement(element) ? [element, ...getContainerChildren(element)] : [element]);
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

const localeCodePattern = /^[A-Za-z]{2,3}(?:-[A-Za-z0-9]{2,8})*$/;

export function canonicalizeLocaleCode(value: string): string | null {
  const trimmed = value.trim();
  if (!localeCodePattern.test(trimmed)) {
    return null;
  }
  return trimmed
    .split("-")
    .map((part, index) => index === 0 ? part.toLowerCase() : part.length === 2 ? part.toUpperCase() : part.toLowerCase())
    .join("-");
}

export function inferLocaleDirection(locale: string): LocaleDefinition["direction"] {
  return new Set(["ar", "dv", "fa", "he", "ku", "ps", "ur", "yi"]).has(locale.split("-")[0].toLowerCase()) ? "rtl" : "ltr";
}

export function getLocalizedText(value: LocalizedText | undefined, locale: string, defaultLocale = "en"): string {
  if (!value) {
    return "";
  }

  return value.translations[locale] ?? value.translations[defaultLocale] ?? value.translations.en ?? Object.values(value.translations)[0] ?? "";
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
