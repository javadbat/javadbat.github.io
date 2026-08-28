import { validationRuleDefinitionByName, type ValidationRuleName } from "jb-form-builder/registry/validation-rule-registry";

/** Resolves a validation rule's builder label in the active interface locale. */
export function ruleLabel(rule: ValidationRuleName, locale: string): string {
  /** Registry-owned bilingual label for the requested portable rule. */
  const label = validationRuleDefinitionByName.get(rule)?.label;
  return locale === "fa" ? (label?.fa ?? rule) : (label?.en ?? rule);
}
