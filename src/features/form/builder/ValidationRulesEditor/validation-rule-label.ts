import { validationRuleDefinitionByName, type ValidationRuleName } from "../../registry/validation-rule-registry";

export function ruleLabel(rule: ValidationRuleName, locale: string): string {
  const label = validationRuleDefinitionByName.get(rule)?.label;
  return locale === "fa" ? (label?.fa ?? rule) : (label?.en ?? rule);
}
