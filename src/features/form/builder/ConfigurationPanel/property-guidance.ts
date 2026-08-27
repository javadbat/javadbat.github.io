import type { FormMessages } from "../../i18n/locale-adapter";
import type { FormElementPropertyDefinition } from "../../registry/form-element-configuration";
import { propertyLabel } from "./configuration-values";

const guidanceByKey: Partial<Record<string, keyof FormMessages>> = {
  autocomplete: "propertyAutocompleteHelp",
  inputmode: "propertyInputModeHelp",
  type: "propertyInputTypeHelp",
  valueType: "propertyValueTypeHelp",
  acceptTypes: "propertyAcceptTypesHelp",
  defaultValue: "propertyDefaultValueHelp",
  options: "propertyOptionsHelp",
  action: "propertyActionHelp",
};

export function getPropertyGuidance(
  definition: FormElementPropertyDefinition,
  locale: string,
  messages: FormMessages,
): string | undefined {
  const messageKey = guidanceByKey[definition.key];
  return messageKey ? messages[messageKey] : definition.control === "string-list" ? messages.commaSeparated : undefined;
}

export function getPropertyPlaceholder(definition: FormElementPropertyDefinition, locale: string): string | undefined {
  if (definition.key === "autocomplete") return "email, name, organization";
  if (definition.key === "inputmode") return "text, numeric, email, tel";
  if (definition.key === "acceptTypes") return "image/*, .pdf, .docx";
  if (definition.key === "ariaLabel") return locale === "fa" ? "برچسب قابل خواندن برای صفحه‌خوان" : "Label announced to screen readers";
  if (definition.key === "defaultValue") return locale === "fa" ? "مثلاً گزینه اول" : "For example, the first option";
  if (definition.key === "options") return undefined;
  return undefined;
}

export function propertyGuidanceLabel(definition: FormElementPropertyDefinition, locale: string): string {
  return propertyLabel(definition.label, locale);
}
