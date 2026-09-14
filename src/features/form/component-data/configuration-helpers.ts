import type { JBFormElementType, JSONValue } from "jb-form-builder/contract";

export type PropertyControl = "text" | "textarea" | "url" | "number" | "color" | "boolean" | "select" | "string-list" | "options";

export interface PropertyLabel {
  en: string;
  fa: string;
}

export interface PropertyOption {
  value: string;
  label: PropertyLabel;
}

export interface NumberPropertyValueAdapter {
  fromInput: (value: number) => number;
  toInput: (value: number) => number;
}

export interface FormElementPropertyDefinition {
  key: string;
  label: PropertyLabel;
  control: PropertyControl;
  localized?: boolean;
  builderVisible?: boolean;
  min?: number;
  max?: number;
  step?: number;
  valueAdapter?: NumberPropertyValueAdapter;
  options?: readonly PropertyOption[];
}

export interface CommonFieldSupport {
  required: boolean;
  disabled: boolean;
  initialValue: boolean;
  label: boolean;
  placeholder: boolean;
}

export type InitialValueKind = "string" | "boolean" | "select" | "range" | "none";

export interface FormElementConfiguration {
  commonFields: CommonFieldSupport;
  initialValueKind: InitialValueKind;
  defaultProps: Record<string, JSONValue>;
  propertyDefinitions: readonly FormElementPropertyDefinition[];
}

export const label = (en: string, fa: string): PropertyLabel => ({ en, fa });

export const localizedDefault = (en: string, fa: string): JSONValue => ({ translations: { en, fa } });

export const textProperty = (key: string, en: string, fa: string, localized = false): FormElementPropertyDefinition => ({
  key,
  label: label(en, fa),
  control: "text",
  localized,
});

export const hiddenTextProperty = (key: string, en: string, fa: string, localized = false): FormElementPropertyDefinition => ({
  ...textProperty(key, en, fa, localized),
  builderVisible: false,
});

export const textareaProperty = (key: string, en: string, fa: string, localized = false): FormElementPropertyDefinition => ({
  key,
  label: label(en, fa),
  control: "textarea",
  localized,
});

export const urlProperty = (key: string, en: string, fa: string): FormElementPropertyDefinition => ({
  key,
  label: label(en, fa),
  control: "url",
});

export const numberProperty = (
  key: string,
  en: string,
  fa: string,
  options: Pick<FormElementPropertyDefinition, "min" | "max" | "step" | "valueAdapter"> = {},
): FormElementPropertyDefinition => ({
  key,
  label: label(en, fa),
  control: "number",
  ...options,
});

export const ROOT_FONT_SIZE_PX = 16;
export const remPixelValueAdapter: NumberPropertyValueAdapter = {
  fromInput: value => value / ROOT_FONT_SIZE_PX,
  toInput: value => value * ROOT_FONT_SIZE_PX,
};

export const colorProperty = (key: string, en: string, fa: string): FormElementPropertyDefinition => ({
  key,
  label: label(en, fa),
  control: "color",
});

export const booleanProperty = (key: string, en: string, fa: string): FormElementPropertyDefinition => ({
  key,
  label: label(en, fa),
  control: "boolean",
});

export const selectProperty = (key: string, en: string, fa: string, options: readonly PropertyOption[]): FormElementPropertyDefinition => ({
  key,
  label: label(en, fa),
  control: "select",
  options,
});

export const stringListProperty = (key: string, en: string, fa: string): FormElementPropertyDefinition => ({
  key,
  label: label(en, fa),
  control: "string-list",
});

export const sizeOptions = [
  { value: "xs", label: label("Extra small", "\u062e\u06cc\u0644\u06cc \u06a9\u0648\u0686\u06a9") },
  { value: "sm", label: label("Small", "\u06a9\u0648\u0686\u06a9") },
  { value: "md", label: label("Medium", "\u0645\u062a\u0648\u0633\u0637") },
  { value: "lg", label: label("Large", "\u0628\u0632\u0631\u06af") },
  { value: "xl", label: label("Extra large", "\u062e\u06cc\u0644\u06cc \u0628\u0632\u0631\u06af") },
];

export const checkboxVariantOptions = [
  { value: "solid", label: label("Solid", "\u062a\u0648\u067e\u0631") },
  { value: "outline", label: label("Outline", "\u062e\u0637\u06cc") },
  { value: "filled-outline", label: label("Filled outline", "\u062e\u0637\u06cc \u067e\u064f\u0631\u0634\u062f\u0647") },
];

export const checkboxColorOptions = [
  { value: "primary", label: label("Primary", "\u0627\u0635\u0644\u06cc") },
  { value: "secondary", label: label("Secondary", "\u062b\u0627\u0646\u0648\u06cc\u0647") },
  { value: "positive", label: label("Positive", "\u0645\u062b\u0628\u062a") },
  { value: "danger", label: label("Danger", "\u062e\u0637\u0631") },
  { value: "warning", label: label("Warning", "\u0647\u0634\u062f\u0627\u0631") },
  { value: "light", label: label("Light", "\u0631\u0648\u0634\u0646") },
  { value: "dark", label: label("Dark", "\u062a\u06cc\u0631\u0647") },
];

export const inputModeOptions = [
  ["text", "Text", "\u0645\u062a\u0646"],
  ["numeric", "Numeric", "\u0639\u062f\u062f\u06cc"],
  ["decimal", "Decimal", "\u0627\u0639\u0634\u0627\u0631\u06cc"],
  ["tel", "Telephone", "\u062a\u0644\u0641\u0646"],
  ["email", "Email", "\u0627\u06cc\u0645\u06cc\u0644"],
  ["url", "URL", "\u0646\u0634\u0627\u0646\u06cc \u0648\u0628"],
] as const;

export const inputTypeOptions = [
  ["text", "Text", "\u0645\u062a\u0646"],
  ["number", "Number", "\u0639\u062f\u062f"],
  ["password", "Password", "\u06af\u0630\u0631\u0648\u0627\u0698\u0647"],
  ["tel", "Telephone", "\u062a\u0644\u0641\u0646"],
  ["email", "Email", "\u0627\u06cc\u0645\u06cc\u0644"],
  ["url", "URL", "\u0646\u0634\u0627\u0646\u06cc \u0648\u0628"],
  ["search", "Search", "\u062c\u0633\u062a\u062c\u0648"],
] as const;

export const inputProperties = [
  textProperty("message", "Helper message", " (\u0632\u06cc\u0631 \u06a9\u0627\u062f\u0631)\u067e\u06cc\u0627\u0645 \u0631\u0627\u0647\u0646\u0645\u0627", true),
  selectProperty("size", "Size", "\u0627\u0646\u062f\u0627\u0632\u0647", sizeOptions),
  selectProperty(
    "type",
    "Input type",
    "\u0646\u0648\u0639 \u0648\u0631\u0648\u062f\u06cc",
    inputTypeOptions.map(([value, en, fa]) => ({
      value,
      label: label(en, fa),
    })),
  ),
  selectProperty(
    "inputmode",
    "Input mode",
    "\u062d\u0627\u0644\u062a \u0648\u0631\u0648\u062f\u06cc",
    inputModeOptions.map(([value, en, fa]) => ({
      value,
      label: label(en, fa),
    })),
  ),
  textProperty("autocomplete", "Autocomplete", "\u062a\u06a9\u0645\u06cc\u0644 \u062e\u0648\u062f\u06a9\u0627\u0631"),
  booleanProperty("clearable", "Allow clearing", "\u0627\u0645\u06a9\u0627\u0646 \u067e\u0627\u06a9\u200c\u06a9\u0631\u062f\u0646"),
] as const;

export const inputDefaults: Record<string, JSONValue> = {
  size: "md",
  type: "text",
  inputmode: "text",
  autocomplete: "off",
  clearable: false,
};

export const inputCommon: CommonFieldSupport = {
  required: true,
  disabled: true,
  initialValue: true,
  label: true,
  placeholder: true,
};

export const valueControlCommon: CommonFieldSupport = {
  required: true,
  disabled: true,
  initialValue: true,
  label: true,
  placeholder: true,
};

export const booleanControlCommon: CommonFieldSupport = {
  required: true,
  disabled: true,
  initialValue: true,
  label: true,
  placeholder: false,
};

export const configuration = (
  commonFields: CommonFieldSupport,
  initialValueKind: InitialValueKind,
  defaultProps: Record<string, JSONValue>,
  propertyDefinitions: readonly FormElementPropertyDefinition[],
): FormElementConfiguration => ({
  commonFields,
  initialValueKind,
  defaultProps,
  propertyDefinitions,
});
