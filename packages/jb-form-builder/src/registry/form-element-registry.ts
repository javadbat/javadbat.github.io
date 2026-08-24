import { isContainerElement, type JBFormElementType, type JBFormElementV1, type JSONValue } from "../contract/form-document";
import { configurationByType, type CommonFieldSupport, type FormElementPropertyDefinition, type InitialValueKind } from "./form-element-configuration";
import { adapterByType, type FormElementAdapter } from "./form-element-adapter";

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
  defaultProps: Record<string, import("../contract/form-document").JSONValue>;
  propertyDefinitions: readonly FormElementPropertyDefinition[];
}

const catalogEntries = [
  {
    type: "text",
    displayName: "Text",
    description: "Add explanatory text to the form.",
    category: "Content",
    keywords: ["text", "copy", "paragraph", "description"],
    iconId: "content-text",
    defaultName: "textBlock",
  },
  {
    type: "image",
    displayName: "Image",
    description: "Display an image from a URL.",
    category: "Content",
    keywords: ["image", "photo", "picture", "url"],
    iconId: "content-image",
    defaultName: "imageBlock",
  },
  {
    type: "voice",
    displayName: "Voice",
    description: "Play audio from a URL.",
    category: "Content",
    keywords: ["voice", "audio", "sound", "url"],
    iconId: "content-voice",
    defaultName: "voiceBlock",
  },
  {
    type: "link",
    displayName: "Link",
    description: "Add a link to a web page or resource.",
    category: "Content",
    keywords: ["link", "anchor", "url", "website"],
    iconId: "content-link",
    defaultName: "linkBlock",
  },
  {
    type: "jb-input",
    displayName: "Text input",
    description: "A flexible single-line text field.",
    category: "Text",
    keywords: ["text", "input", "single line"],
    iconId: "text-input",
    defaultName: "text",
  },
  {
    type: "jb-number-input",
    displayName: "Number input",
    description: "Collect a numeric value.",
    category: "Text",
    keywords: ["number", "numeric", "amount"],
    iconId: "number-input",
    defaultName: "number",
  },
  {
    type: "jb-range-input",
    displayName: "Range input",
    description: "Choose a numeric value or interval.",
    category: "Choice",
    keywords: ["range", "slider", "number", "interval"],
    iconId: "number-input",
    defaultName: "range",
  },
  {
    type: "jb-mobile-input",
    displayName: "Mobile input",
    description: "Collect a normalized mobile number.",
    category: "Identity",
    keywords: ["mobile", "phone", "telephone"],
    iconId: "mobile-input",
    defaultName: "mobile",
  },
  {
    type: "jb-password-input",
    displayName: "Password input",
    description: "Collect a concealed password.",
    category: "Text",
    keywords: ["password", "secret", "secure"],
    iconId: "password-input",
    defaultName: "password",
  },
  {
    type: "jb-payment-input",
    displayName: "Payment input",
    description: "Collect card or SHABA information.",
    category: "Financial",
    keywords: ["payment", "card", "shaba", "bank"],
    iconId: "payment-input",
    defaultName: "payment",
  },
  {
    type: "jb-national-input",
    displayName: "National ID input",
    description: "Collect and validate a national ID.",
    category: "Identity",
    keywords: ["national", "identity", "code"],
    iconId: "national-input",
    defaultName: "nationalId",
  },
  {
    type: "jb-date-input",
    displayName: "Date input",
    description: "Choose a calendar date.",
    category: "Date & time",
    keywords: ["date", "calendar", "day"],
    iconId: "date-input",
    defaultName: "date",
  },
  {
    type: "jb-time-input",
    displayName: "Time input",
    description: "Choose a time of day.",
    category: "Date & time",
    keywords: ["time", "clock", "hour"],
    iconId: "time-input",
    defaultName: "time",
  },
  {
    type: "jb-pin-input",
    displayName: "PIN input",
    description: "Collect a fixed-length verification code.",
    category: "Text",
    keywords: ["pin", "otp", "code", "verification"],
    iconId: "pin-input",
    defaultName: "pin",
  },
  {
    type: "jb-textarea",
    displayName: "Textarea",
    description: "Collect longer, multi-line text.",
    category: "Text",
    keywords: ["textarea", "long text", "multiline"],
    iconId: "textarea",
    defaultName: "message",
  },
  {
    type: "jb-select",
    displayName: "Select",
    description: "Choose one or several listed options.",
    category: "Choice",
    keywords: ["select", "option", "dropdown", "choice"],
    iconId: "select",
    defaultName: "choice",
  },
  {
    type: "jb-listbox",
    displayName: "Listbox",
    description: "Choose from an always-visible list of options.",
    category: "Choice",
    keywords: ["listbox", "select", "option", "choice", "multiple"],
    iconId: "select",
    defaultName: "listChoice",
  },
  {
    type: "jb-checkbox",
    displayName: "Checkbox",
    description: "Toggle a checkable choice.",
    category: "Choice",
    keywords: ["checkbox", "check", "boolean"],
    iconId: "checkbox",
    defaultName: "accepted",
  },
  {
    type: "jb-switch",
    displayName: "Switch",
    description: "Toggle a binary setting.",
    category: "Choice",
    keywords: ["switch", "toggle", "boolean"],
    iconId: "switch",
    defaultName: "enabled",
  },
  {
    type: "jb-file-input",
    displayName: "File input",
    description: "Choose a file for upload.",
    category: "File",
    keywords: ["file", "upload", "attachment"],
    iconId: "file-input",
    defaultName: "file",
  },
  {
    type: "jb-image-input",
    displayName: "Image input",
    description: "Choose and preview an image.",
    category: "File",
    keywords: ["image", "photo", "upload"],
    iconId: "image-input",
    defaultName: "image",
  },
  {
    type: "jb-button",
    displayName: "Button",
    description: "Add a form action.",
    category: "Action",
    keywords: ["button", "submit", "action"],
    iconId: "button",
    defaultName: "submit",
  },
  {
    type: "jb-tab",
    displayName: "Tabs",
    description: "Organize fields into one-level tab panels.",
    category: "Container",
    keywords: ["tab", "tabs", "container", "group", "panel"],
    iconId: "select",
    defaultName: "tabs",
  },
  {
    type: "jb-condition",
    displayName: "Conditional container",
    description: "Show fields when form-value conditions match.",
    category: "Container",
    keywords: ["condition", "conditional", "container", "show", "hide", "logic"],
    iconId: "switch",
    defaultName: "condition",
  },
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
  "jb-condition": "شرط",
  "jb-tab": "تب‌ها",
  text: "متن",
  image: "تصویر",
  voice: "صدا",
  link: "پیوند",
  "jb-input": "ورودی متن",
  "jb-number-input": "ورودی عدد",
  "jb-range-input": "ورودی بازه",
  "jb-mobile-input": "ورودی موبایل",
  "jb-password-input": "ورودی رمز عبور",
  "jb-payment-input": "ورودی پرداخت",
  "jb-national-input": "ورودی کد ملی",
  "jb-date-input": "ورودی تاریخ",
  "jb-time-input": "ورودی زمان",
  "jb-pin-input": "ورودی پین",
  "jb-textarea": "متن چندخطی",
  "jb-select": "انتخاب‌گر",
  "jb-listbox": "فهرست انتخاب",
  "jb-checkbox": "کادر انتخاب",
  "jb-switch": "کلید",
  "jb-file-input": "ورودی فایل",
  "jb-image-input": "ورودی تصویر",
  "jb-button": "دکمه",
};

export function getFormElementDisplayName(entry: FormElementRegistryEntry, locale: string): string {
  return locale.toLowerCase().split("-")[0] === "fa" ? persianDisplayNames[entry.type] : entry.displayName;
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
        { id: crypto.randomUUID(), value: "tab_1", label: { translations: { [locale]: isFarsi ? "تب ۱" : "Tab 1" } }, disabled: false, children: [] },
        { id: crypto.randomUUID(), value: "tab_2", label: { translations: { [locale]: isFarsi ? "تب ۲" : "Tab 2" } }, disabled: false, children: [] },
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
        [locale]: isFarsi ? `${displayName} را وارد کنید` : `Enter ${displayName.toLowerCase()}`,
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
  }

  return changed;
}
