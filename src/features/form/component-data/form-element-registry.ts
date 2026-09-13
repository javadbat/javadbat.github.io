import { isContainerElement, isWizardElement, type JBFormElementType, type JBFormElementV1, type JSONValue } from "jb-form-builder/contract";
import { configurationByType, type CommonFieldSupport, type FormElementPropertyDefinition, type InitialValueKind } from "./form-element-configuration";
import { adapterByType, type FormElementAdapter } from "./form-element-adapter";
import { catalogData as textCatalogData } from "./text/catalog";
import { catalogData as imageCatalogData } from "./image/catalog";
import { catalogData as voiceCatalogData } from "./voice/catalog";
import { catalogData as linkCatalogData } from "./link/catalog";
import { catalogData as dividerCatalogData } from "./divider/catalog";
import { catalogData as sectionHeadingCatalogData } from "./section-heading/catalog";
import { catalogData as inputCatalogData } from "./jb-input/catalog";
import { catalogData as numberInputCatalogData } from "./jb-number-input/catalog";
import { catalogData as rangeInputCatalogData } from "./jb-range-input/catalog";
import { catalogData as mobileInputCatalogData } from "./jb-mobile-input/catalog";
import { catalogData as passwordInputCatalogData } from "./jb-password-input/catalog";
import { catalogData as paymentInputCatalogData } from "./jb-payment-input/catalog";
import { catalogData as nationalInputCatalogData } from "./jb-national-input/catalog";
import { catalogData as dateInputCatalogData } from "./jb-date-input/catalog";
import { catalogData as timeInputCatalogData } from "./jb-time-input/catalog";
import { catalogData as pinInputCatalogData } from "./jb-pin-input/catalog";
import { catalogData as textareaCatalogData } from "./jb-textarea/catalog";
import { catalogData as selectCatalogData } from "./jb-select/catalog";
import { catalogData as listboxCatalogData } from "./jb-listbox/catalog";
import { catalogData as checkboxCatalogData } from "./jb-checkbox/catalog";
import { catalogData as switchCatalogData } from "./jb-switch/catalog";
import { catalogData as fileInputCatalogData } from "./jb-file-input/catalog";
import { catalogData as imageInputCatalogData } from "./jb-image-input/catalog";
import { catalogData as buttonCatalogData } from "./jb-button/catalog";
import { catalogData as tabCatalogData } from "./jb-tab/catalog";
import { catalogData as conditionCatalogData } from "./jb-condition/catalog";
import { catalogData as formWizardCatalogData } from "./jb-form-wizard/catalog";
import { catalogData as repeatableGroupCatalogData } from "./jb-repeatable-group/catalog";

export type FormElementCategory = "Container" | "Content" | "Text" | "Date & time" | "Choice" | "Identity" | "Financial" | "File" | "Action";

export interface FormElementRegistryEntry extends FormElementAdapter {
  type: JBFormElementType;
  displayName: string;
  description: string;
  category: FormElementCategory;
  keywords: readonly string[];
  iconId: string;
  defaultName: string;
  commonFields: CommonFieldSupport;
  initialValueKind: InitialValueKind;
  defaultProps: Record<string, JSONValue>;
  propertyDefinitions: readonly FormElementPropertyDefinition[];
}

const catalogEntries = [
  textCatalogData,
  imageCatalogData,
  voiceCatalogData,
  linkCatalogData,
  dividerCatalogData,
  sectionHeadingCatalogData,
  inputCatalogData,
  numberInputCatalogData,
  rangeInputCatalogData,
  mobileInputCatalogData,
  passwordInputCatalogData,
  paymentInputCatalogData,
  nationalInputCatalogData,
  dateInputCatalogData,
  timeInputCatalogData,
  pinInputCatalogData,
  textareaCatalogData,
  selectCatalogData,
  listboxCatalogData,
  checkboxCatalogData,
  switchCatalogData,
  fileInputCatalogData,
  imageInputCatalogData,
  buttonCatalogData,
  tabCatalogData,
  conditionCatalogData,
  formWizardCatalogData,
  repeatableGroupCatalogData,
] as const satisfies readonly {
  type: JBFormElementType;
  displayName: string;
  description: string;
  category: FormElementCategory;
  keywords: readonly string[];
  iconId: string;
  defaultName: string;
}[];

export const formElementRegistry: readonly FormElementRegistryEntry[] = catalogEntries.map(entry => ({
  ...entry,
  ...configurationByType[entry.type],
  ...adapterByType.get(entry.type)!,
}));

export const registryByType = new Map(formElementRegistry.map(entry => [entry.type, entry]));

const persianDisplayNames: Record<JBFormElementType, string> = {
  "jb-form-wizard": "\u0641\u0631\u0627\u06cc\u0646\u062f \u0645\u0631\u062d\u0644\u0647\u200c\u0627\u06cc",
  "jb-repeatable-group": "\u06af\u0631\u0648\u0647 \u062a\u06a9\u0631\u0627\u0631\u0634\u0648\u0646\u062f\u0647",
  divider: "\u062c\u062f\u0627\u06a9\u0646\u0646\u062f\u0647",
  "section-heading": "\u0639\u0646\u0648\u0627\u0646 \u0628\u062e\u0634",
  "jb-condition": "\u0634\u0631\u0637",
  "jb-tab": "\u062a\u0628\u200c\u0647\u0627",
  text: "\u0645\u062a\u0646",
  image: "\u062a\u0635\u0648\u06cc\u0631",
  voice: "\u0635\u062f\u0627",
  link: "\u067e\u06cc\u0648\u0646\u062f",
  "jb-input": "\u0648\u0631\u0648\u062f\u06cc \u0645\u062a\u0646",
  "jb-number-input": "\u0648\u0631\u0648\u062f\u06cc \u0639\u062f\u062f",
  "jb-range-input": "\u0648\u0631\u0648\u062f\u06cc \u0628\u0627\u0632\u0647",
  "jb-mobile-input": "\u0648\u0631\u0648\u062f\u06cc \u0645\u0648\u0628\u0627\u06cc\u0644",
  "jb-password-input": "\u0648\u0631\u0648\u062f\u06cc \u0631\u0645\u0632 \u0639\u0628\u0648\u0631",
  "jb-payment-input": "\u0648\u0631\u0648\u062f\u06cc \u067e\u0631\u062f\u0627\u062e\u062a",
  "jb-national-input": "\u0648\u0631\u0648\u062f\u06cc \u06a9\u062f \u0645\u0644\u06cc",
  "jb-date-input": "\u0648\u0631\u0648\u062f\u06cc \u062a\u0627\u0631\u06cc\u062e",
  "jb-time-input": "\u0648\u0631\u0648\u062f\u06cc \u0632\u0645\u0627\u0646",
  "jb-pin-input": "\u0648\u0631\u0648\u062f\u06cc \u067e\u06cc\u0646",
  "jb-textarea": "\u0645\u062a\u0646 \u0686\u0646\u062f\u062e\u0637\u06cc",
  "jb-select": "\u0627\u0646\u062a\u062e\u0627\u0628\u200c\u06af\u0631",
  "jb-listbox": "\u0641\u0647\u0631\u0633\u062a \u0627\u0646\u062a\u062e\u0627\u0628",
  "jb-checkbox": "\u06a9\u0627\u062f\u0631 \u0627\u0646\u062a\u062e\u0627\u0628",
  "jb-switch": "\u06a9\u0644\u06cc\u062f",
  "jb-file-input": "\u0648\u0631\u0648\u062f\u06cc \u0641\u0627\u06cc\u0644",
  "jb-image-input": "\u0648\u0631\u0648\u062f\u06cc \u062a\u0635\u0648\u06cc\u0631",
  "jb-button": "\u062f\u06a9\u0645\u0647",
};

const persianDescriptions: Record<JBFormElementType, string> = {
  text: "\u0645\u062a\u0646 \u062a\u0648\u0636\u06cc\u062d\u06cc \u0628\u0647 \u0641\u0631\u0645 \u0627\u0636\u0627\u0641\u0647 \u0645\u06cc\u200c\u06a9\u0646\u062f.",
  image: "\u062a\u0635\u0648\u06cc\u0631\u06cc \u0631\u0627 \u0627\u0632 \u06cc\u06a9 \u0646\u0634\u0627\u0646\u06cc \u0627\u06cc\u0646\u062a\u0631\u0646\u062a\u06cc \u0646\u0645\u0627\u06cc\u0634 \u0645\u06cc\u200c\u062f\u0647\u062f.",
  voice: "\u0635\u0648\u062a\u06cc \u0631\u0627 \u0627\u0632 \u06cc\u06a9 \u0646\u0634\u0627\u0646\u06cc \u0627\u06cc\u0646\u062a\u0631\u0646\u062a\u06cc \u067e\u062e\u0634 \u0645\u06cc\u200c\u06a9\u0646\u062f.",
  link: "\u067e\u06cc\u0648\u0646\u062f\u06cc \u0628\u0647 \u06cc\u06a9 \u0635\u0641\u062d\u0647 \u0648\u0628 \u06cc\u0627 \u0645\u0646\u0628\u0639 \u0627\u0636\u0627\u0641\u0647 \u0645\u06cc\u200c\u06a9\u0646\u062f.",
  divider: "\u0628\u062e\u0634\u200c\u0647\u0627\u06cc \u0641\u0631\u0645 \u0631\u0627 \u0628\u0627 \u062c\u062f\u0627\u06a9\u0646\u0646\u062f\u0647 \u062f\u06cc\u062f\u0627\u0631\u06cc \u0648 \u0641\u0627\u0635\u0644\u0647 \u0627\u062e\u062a\u06cc\u0627\u0631\u06cc \u0627\u0632 \u0647\u0645 \u062c\u062f\u0627 \u0645\u06cc\u200c\u06a9\u0646\u062f.",
  "section-heading": "\u0639\u0646\u0648\u0627\u0646\u06cc \u0628\u0631\u0627\u06cc \u0633\u0627\u0632\u0645\u0627\u0646\u200c\u062f\u0647\u06cc \u06cc\u06a9 \u0628\u062e\u0634 \u0641\u0631\u0645 \u0627\u0636\u0627\u0641\u0647 \u0645\u06cc\u200c\u06a9\u0646\u062f.",
  "jb-input": "\u06cc\u06a9 \u0641\u06cc\u0644\u062f \u0645\u062a\u0646\u06cc \u062a\u06a9\u200c\u062e\u0637\u06cc \u0627\u0646\u0639\u0637\u0627\u0641\u200c\u067e\u0630\u06cc\u0631.",
  "jb-number-input": "\u06cc\u06a9 \u0645\u0642\u062f\u0627\u0631 \u0639\u062f\u062f\u06cc \u062f\u0631\u06cc\u0627\u0641\u062a \u0645\u06cc\u200c\u06a9\u0646\u062f.",
  "jb-range-input": "\u06cc\u06a9 \u0645\u0642\u062f\u0627\u0631 \u06cc\u0627 \u0628\u0627\u0632\u0647 \u0639\u062f\u062f\u06cc \u0627\u0646\u062a\u062e\u0627\u0628 \u0645\u06cc\u200c\u06a9\u0646\u062f.",
  "jb-mobile-input": "\u0634\u0645\u0627\u0631\u0647 \u0645\u0648\u0628\u0627\u06cc\u0644 \u0631\u0627 \u062f\u0631 \u0642\u0627\u0644\u0628 \u0627\u0633\u062a\u0627\u0646\u062f\u0627\u0631\u062f \u062f\u0631\u06cc\u0627\u0641\u062a \u0645\u06cc\u200c\u06a9\u0646\u062f.",
  "jb-password-input": "\u06af\u0630\u0631\u0648\u0627\u0698\u0647 \u0631\u0627 \u0628\u0647\u200c\u0635\u0648\u0631\u062a \u067e\u0646\u0647\u0627\u0646 \u062f\u0631\u06cc\u0627\u0641\u062a \u0645\u06cc\u200c\u06a9\u0646\u062f.",
  "jb-payment-input": "\u0627\u0637\u0644\u0627\u0639\u0627\u062a \u06a9\u0627\u0631\u062a \u06cc\u0627 \u0634\u0628\u0627 \u0631\u0627 \u062f\u0631\u06cc\u0627\u0641\u062a \u0645\u06cc\u200c\u06a9\u0646\u062f.",
  "jb-national-input": "\u06a9\u062f \u0645\u0644\u06cc \u0631\u0627 \u062f\u0631\u06cc\u0627\u0641\u062a \u0648 \u0627\u0639\u062a\u0628\u0627\u0631\u0633\u0646\u062c\u06cc \u0645\u06cc\u200c\u06a9\u0646\u062f.",
  "jb-date-input": "\u06cc\u06a9 \u062a\u0627\u0631\u06cc\u062e \u0631\u0627 \u0627\u0632 \u062a\u0642\u0648\u06cc\u0645 \u0627\u0646\u062a\u062e\u0627\u0628 \u0645\u06cc\u200c\u06a9\u0646\u062f.",
  "jb-time-input": "\u0632\u0645\u0627\u0646\u06cc \u0627\u0632 \u0631\u0648\u0632 \u0631\u0627 \u0627\u0646\u062a\u062e\u0627\u0628 \u0645\u06cc\u200c\u06a9\u0646\u062f.",
  "jb-pin-input": "\u06a9\u062f \u062a\u0623\u06cc\u06cc\u062f \u0628\u0627 \u0637\u0648\u0644 \u062b\u0627\u0628\u062a \u0631\u0627 \u062f\u0631\u06cc\u0627\u0641\u062a \u0645\u06cc\u200c\u06a9\u0646\u062f.",
  "jb-textarea": "\u0645\u062a\u0646 \u0628\u0644\u0646\u062f \u0648 \u0686\u0646\u062f\u062e\u0637\u06cc \u062f\u0631\u06cc\u0627\u0641\u062a \u0645\u06cc\u200c\u06a9\u0646\u062f.",
  "jb-select": "\u06cc\u06a9 \u06cc\u0627 \u0686\u0646\u062f \u06af\u0632\u06cc\u0646\u0647 \u0631\u0627 \u0627\u0632 \u0641\u0647\u0631\u0633\u062a \u0627\u0646\u062a\u062e\u0627\u0628 \u0645\u06cc\u200c\u06a9\u0646\u062f.",
  "jb-listbox": "\u0627\u0632 \u0641\u0647\u0631\u0633\u062a\u06cc \u06a9\u0647 \u0647\u0645\u06cc\u0634\u0647 \u0646\u0645\u0627\u06cc\u0634 \u062f\u0627\u062f\u0647 \u0645\u06cc\u200c\u0634\u0648\u062f \u06af\u0632\u06cc\u0646\u0647 \u0627\u0646\u062a\u062e\u0627\u0628 \u0645\u06cc\u200c\u06a9\u0646\u062f.",
  "jb-checkbox": "\u06cc\u06a9 \u06af\u0632\u06cc\u0646\u0647 \u0642\u0627\u0628\u0644 \u0627\u0646\u062a\u062e\u0627\u0628 \u0631\u0627 \u0631\u0648\u0634\u0646 \u06cc\u0627 \u062e\u0627\u0645\u0648\u0634 \u0645\u06cc\u200c\u06a9\u0646\u062f.",
  "jb-switch": "\u06cc\u06a9 \u062a\u0646\u0638\u06cc\u0645 \u062f\u0648\u062f\u0648\u06cc\u06cc \u0631\u0627 \u0631\u0648\u0634\u0646 \u06cc\u0627 \u062e\u0627\u0645\u0648\u0634 \u0645\u06cc\u200c\u06a9\u0646\u062f.",
  "jb-file-input": "\u0641\u0627\u06cc\u0644\u06cc \u0631\u0627 \u0628\u0631\u0627\u06cc \u0628\u0627\u0631\u06af\u0630\u0627\u0631\u06cc \u0627\u0646\u062a\u062e\u0627\u0628 \u0645\u06cc\u200c\u06a9\u0646\u062f.",
  "jb-image-input": "\u062a\u0635\u0648\u06cc\u0631\u06cc \u0631\u0627 \u0627\u0646\u062a\u062e\u0627\u0628 \u0648 \u067e\u06cc\u0634\u200c\u0646\u0645\u0627\u06cc\u0634 \u0645\u06cc\u200c\u06a9\u0646\u062f.",
  "jb-button": "\u06cc\u06a9 \u0639\u0645\u0644\u06cc\u0627\u062a \u0628\u0647 \u0641\u0631\u0645 \u0627\u0636\u0627\u0641\u0647 \u0645\u06cc\u200c\u06a9\u0646\u062f.",
  "jb-tab": "\u0641\u06cc\u0644\u062f\u0647\u0627 \u0631\u0627 \u062f\u0631 \u067e\u0646\u0644\u200c\u0647\u0627\u06cc \u062a\u0628 \u06cc\u06a9\u200c\u0633\u0637\u062d\u06cc \u0633\u0627\u0632\u0645\u0627\u0646\u200c\u062f\u0647\u06cc \u0645\u06cc\u200c\u06a9\u0646\u062f.",
  "jb-condition": "\u062f\u0631 \u0635\u0648\u0631\u062a \u0628\u0631\u0642\u0631\u0627\u0631 \u0628\u0648\u062f\u0646 \u0634\u0631\u0637\u200c\u0647\u0627\u06cc \u0645\u0642\u0627\u062f\u06cc\u0631 \u0641\u0631\u0645\u060c \u0641\u06cc\u0644\u062f\u0647\u0627 \u0631\u0627 \u0646\u0645\u0627\u06cc\u0634 \u0645\u06cc\u200c\u062f\u0647\u062f.",
  "jb-form-wizard": "\u067e\u0627\u0633\u062e\u200c\u062f\u0647\u0646\u062f\u0647 \u0631\u0627 \u062f\u0631 \u06cc\u06a9 \u062a\u0648\u0627\u0644\u06cc \u062e\u0637\u06cc \u0627\u0632 \u0645\u0631\u0627\u062d\u0644 \u0641\u0631\u0645 \u0647\u062f\u0627\u06cc\u062a \u0645\u06cc\u200c\u06a9\u0646\u062f.",
  "jb-repeatable-group": "\u06af\u0631\u0648\u0647\u06cc \u0627\u0632 \u0641\u06cc\u0644\u062f\u0647\u0627 \u0631\u0627 \u062a\u06a9\u0631\u0627\u0631 \u0648 \u0645\u062c\u0645\u0648\u0639\u0647\u200c\u0627\u06cc \u0627\u0632 \u0631\u06a9\u0648\u0631\u062f\u0647\u0627\u06cc \u062a\u0648\u200c\u062f\u0631\u200c\u062a\u0648 \u0628\u0631\u0645\u06cc\u200c\u06af\u0631\u062f\u0627\u0646\u062f.",
};

export function getFormElementDisplayName(entry: FormElementRegistryEntry, locale: string): string {
  return locale.toLowerCase().split("-")[0] === "fa" ? persianDisplayNames[entry.type] : entry.displayName;
}

/** Resolves the catalog description for a locale, falling back to English. */
export function getFormElementDescription(entry: FormElementRegistryEntry, locale: string): string {
  return locale.toLowerCase().split("-")[0] === "fa" ? persianDescriptions[entry.type] : entry.description;
}

function defaultsForLocale(value: JSONValue, locale: string): JSONValue {
  if (Array.isArray(value)) return value.map(item => defaultsForLocale(item, locale));
  if (value === null || typeof value !== "object") return value;
  if ("translations" in value && value.translations && typeof value.translations === "object" && !Array.isArray(value.translations)) {
    const translations = value.translations as Record<string, JSONValue>;
    const language = locale.toLowerCase().split("-")[0];
    const translation = translations[locale] ?? translations[language] ?? translations.en ?? Object.values(translations)[0] ?? "";
    return { translations: { [locale]: translation } };
  }
  return Object.fromEntries(Object.entries(value).map(([key, child]) => [key, defaultsForLocale(child, locale)]));
}

export function createDefaultElement(entry: FormElementRegistryEntry, name: string, locale = "en"): JBFormElementV1 {
  const defaultProps = defaultsForLocale(structuredClone(entry.defaultProps) as JSONValue, locale) as Record<string, JSONValue>;
  if (entry.type === "jb-tab") {
    const isFarsi = locale.toLowerCase().split("-")[0] === "fa";
    return {
      id: crypto.randomUUID(),
      type: "jb-tab",
      adapterVersion: entry.adapterVersion,
      name,
      props: defaultProps,
      validation: [],
      validationScope: "all",
      tabs: [
        { id: crypto.randomUUID(), value: "tab_1", label: { translations: { [locale]: isFarsi ? "\u062a\u0628 \u06f1" : "Tab 1" } }, disabled: false, children: [] },
        { id: crypto.randomUUID(), value: "tab_2", label: { translations: { [locale]: isFarsi ? "\u062a\u0628 \u06f2" : "Tab 2" } }, disabled: false, children: [] },
      ],
    };
  }
  if (entry.type === "jb-condition") {
    return {
      id: crypto.randomUUID(),
      type: "jb-condition",
      adapterVersion: entry.adapterVersion,
      name,
      props: {},
      validation: [],
      conditions: { match: "all", rules: [] },
      children: [],
    };
  }
  if (entry.type === "jb-form-wizard") {
    const isFarsi = locale.toLowerCase().split("-")[0] === "fa";
    return {
      id: crypto.randomUUID(),
      type: "jb-form-wizard",
      adapterVersion: entry.adapterVersion,
      name,
      props: defaultProps,
      validation: [],
      steps: [
        { id: crypto.randomUUID(), value: "step_1", label: { translations: { [locale]: isFarsi ? "\u0645\u0631\u062d\u0644\u0647 \u06f1" : "Step 1" } }, children: [] },
        { id: crypto.randomUUID(), value: "step_2", label: { translations: { [locale]: isFarsi ? "\u0645\u0631\u062d\u0644\u0647 \u06f2" : "Step 2" } }, children: [] },
      ],
    };
  }
  if (entry.type === "jb-repeatable-group") {
    return {
      id: crypto.randomUUID(), type: entry.type, adapterVersion: entry.adapterVersion, name,
      props: defaultProps, validation: [], children: [],
    };
  }
  const element: JBFormElementV1 = {
    id: crypto.randomUUID(),
    type: entry.type,
    adapterVersion: entry.adapterVersion,
    name,
    props: defaultProps,
    validation: [],
  };
  if (entry.commonFields.required) {
    element.required = false;
  }
  if (entry.commonFields.disabled) {
    element.disabled = false;
  }
  if (entry.commonFields.label) {
    element.label = { translations: { [locale]: getFormElementDisplayName(entry, locale) } };
  }
  if (entry.commonFields.placeholder) {
    const isFarsi = locale.toLowerCase().split("-")[0] === "fa";
    const displayName = getFormElementDisplayName(entry, locale);
    element.placeholder = {
      translations: {
        [locale]: isFarsi ? `${displayName} \u0631\u0627 \u0648\u0627\u0631\u062f \u06a9\u0646\u06cc\u062f` : `Enter ${displayName.toLowerCase()}`,
      },
    };
  }
  return element;
}

function addDefaultLocalizedValue(
  current: { translations: Record<string, string> } | undefined,
  source: { translations: Record<string, string> } | undefined,
  target: { translations: Record<string, string> } | undefined,
  sourceLocale: string,
  targetLocale: string,
): boolean {
  if (!current || !source || !target || targetLocale in current.translations) return false;
  if (current.translations[sourceLocale] !== source.translations[sourceLocale]) return false;
  const targetValue = target.translations[targetLocale];
  if (targetValue === undefined) return false;
  current.translations[targetLocale] = targetValue;
  return true;
}

function localizedValue(value: JSONValue | undefined): { translations: Record<string, string> } | undefined {
  if (value === null || typeof value !== "object" || Array.isArray(value)) return undefined;
  const translations = value.translations;
  if (translations === null || typeof translations !== "object" || Array.isArray(translations)) return undefined;
  if (!Object.values(translations).every(translation => typeof translation === "string")) return undefined;
  return value as { translations: Record<string, string> };
}

/** Adds translated built-in label defaults without replacing user-authored content. */
export function addMissingElementDefaultTranslations(element: JBFormElementV1, sourceLocale: string, targetLocale: string): boolean {
  const targetLanguage = targetLocale.toLowerCase().split("-")[0];
  if (targetLanguage !== "en" && targetLanguage !== "fa") return false;
  const entry = registryByType.get(element.type);
  if (!entry) return false;

  const sourceDefault = createDefaultElement(entry, element.name, sourceLocale);
  const targetDefault = createDefaultElement(entry, element.name, targetLocale);
  let changed = false;

  if (!isContainerElement(element) && !isContainerElement(sourceDefault) && !isContainerElement(targetDefault)) {
    changed = addDefaultLocalizedValue(element.label, sourceDefault.label, targetDefault.label, sourceLocale, targetLocale) || changed;
    changed = addDefaultLocalizedValue(element.placeholder, sourceDefault.placeholder, targetDefault.placeholder, sourceLocale, targetLocale) || changed;
  }

  for (const definition of entry.propertyDefinitions) {
    if (!definition.localized) continue;
    changed = addDefaultLocalizedValue(
      localizedValue(element.props[definition.key]),
      localizedValue(sourceDefault.props[definition.key]),
      localizedValue(targetDefault.props[definition.key]),
      sourceLocale,
      targetLocale,
    ) || changed;
  }

  if (isWizardElement(element)) {
    const sourceLanguage = sourceLocale.toLowerCase().split("-")[0];
    const targetLanguage = targetLocale.toLowerCase().split("-")[0];
    element.steps.forEach((step, index) => {
      if (targetLocale in step.label.translations) return;
      const position = index + 1;
      const persianPosition = String(position).replace(/\d/g, digit => "\u06f0\u06f1\u06f2\u06f3\u06f4\u06f5\u06f6\u06f7\u06f8\u06f9"[Number(digit)]);
      const sourceDefaults = sourceLanguage === "fa"
        ? new Set([`\u0645\u0631\u062d\u0644\u0647 ${position}`, `\u0645\u0631\u062d\u0644\u0647 ${persianPosition}`])
        : new Set([`Step ${position}`]);
      if (!sourceDefaults.has(step.label.translations[sourceLocale] ?? "")) return;
      step.label.translations[targetLocale] = targetLanguage === "fa" ? `\u0645\u0631\u062d\u0644\u0647 ${persianPosition}` : `Step ${position}`;
      changed = true;
    });
  }

  return changed;
}
