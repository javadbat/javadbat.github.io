import type { JBFormElementType, JBFormElementV1 } from "../domain/form-document";
import { localizedText } from "../domain/form-document";
import { configurationByType, type CommonFieldSupport, type FormElementPropertyDefinition, type InitialValueKind } from "./form-element-configuration";
import { adapterByType, type FormElementAdapter } from "./form-element-adapter";

export type FormElementCategory = "Text" | "Date & time" | "Choice" | "Identity" | "Financial" | "File" | "Action";

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
  defaultProps: Record<string, import("../domain/form-document").JSONValue>;
  propertyDefinitions: readonly FormElementPropertyDefinition[];
}

const catalogEntries = [
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

export function createDefaultElement(entry: FormElementRegistryEntry, name: string): JBFormElementV1 {
  const element: JBFormElementV1 = {
    id: crypto.randomUUID(),
    type: entry.type,
    adapterVersion: entry.adapterVersion,
    name,
    props: structuredClone(entry.defaultProps),
    validation: [],
  };
  if (entry.commonFields.required) {
    element.required = false;
  }
  if (entry.commonFields.disabled) {
    element.disabled = false;
  }
  if (entry.commonFields.label) {
    element.label = localizedText(entry.displayName);
  }
  if (entry.commonFields.placeholder) {
    element.placeholder = localizedText(`Enter ${entry.displayName.toLowerCase()}`);
  }
  return element;
}
