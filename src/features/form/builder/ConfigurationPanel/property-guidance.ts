import type { FormElementPropertyDefinition } from "../../component-data";
import type { TFunction } from "i18next";
import type { propertyGuidanceTranslations } from "./property-guidance.translations";
import { propertyLabel } from "./configuration-values";

const guidanceByKey: Partial<Record<string, keyof typeof propertyGuidanceTranslations.en>> = {
  autocomplete: "propertyAutocompleteHelp",
  inputmode: "propertyInputModeHelp",
  type: "propertyInputTypeHelp",
  valueType: "propertyValueTypeHelp",
  accept: "propertyAcceptTypesHelp",
  defaultValue: "propertyDefaultValueHelp",
  options: "propertyOptionsHelp",
  action: "propertyActionHelp",
};

export function getPropertyGuidance(
  definition: FormElementPropertyDefinition,
  t: TFunction<"propertyGuidance">,
  tCommon: TFunction<"common">,
): string | undefined {
  const messageKey = guidanceByKey[definition.key];
  return messageKey ? t(messageKey) : definition.control === "string-list" ? tCommon("commaSeparated") : undefined;
}

export function getPropertyPlaceholder(definition: FormElementPropertyDefinition, locale: string): string | undefined {
  const isPersian = locale.toLowerCase().split("-")[0] === "fa";
  if (definition.key === "autocomplete") return "email, name, organization";
  if (definition.key === "inputmode") return "text, numeric, email, tel";
  if (definition.key === "accept") return "image/*, .pdf, .docx";
  if (definition.key === "ariaLabel") return isPersian ? "برچسب قابل خواندن برای صفحه‌خوان" : "Label announced to screen readers";
  if (definition.key === "defaultValue") return isPersian ? "مثلاً گزینه اول" : "For example, the first option";
  if (definition.key === "options") return undefined;
  return undefined;
}

export function propertyGuidanceLabel(definition: FormElementPropertyDefinition, locale: string): string {
  return propertyLabel(definition.label, locale);
}
