import type { ValidationItem } from "jb-validation";
import { getLocalizedText, localizedText, type JBValidationRule, type JSONPrimitive } from "../domain/form-document";
import type { FormIssue } from "../domain/form-issue";
import type { PropertyLabel } from "./form-element-configuration";

export type ValidationRuleName = JBValidationRule["rule"];

export interface ValidationRuleDefinition {
  rule: ValidationRuleName;
  label: PropertyLabel;
  defaultMessage: PropertyLabel;
}

export const validationRuleDefinitions: readonly ValidationRuleDefinition[] = [
  {
    rule: "minLength",
    label: { en: "Minimum length", fa: "کمترین طول" },
    defaultMessage: {
      en: "Enter more characters.",
      fa: "نویسه‌های بیشتری وارد کنید.",
    },
  },
  {
    rule: "maxLength",
    label: { en: "Maximum length", fa: "بیشترین طول" },
    defaultMessage: {
      en: "Enter fewer characters.",
      fa: "نویسه‌های کمتری وارد کنید.",
    },
  },
  {
    rule: "pattern",
    label: { en: "Regular expression", fa: "عبارت منظم" },
    defaultMessage: {
      en: "Use the required format.",
      fa: "از قالب موردنیاز استفاده کنید.",
    },
  },
  {
    rule: "minValue",
    label: { en: "Minimum value", fa: "کمترین مقدار" },
    defaultMessage: {
      en: "Enter a larger value.",
      fa: "مقدار بزرگ‌تری وارد کنید.",
    },
  },
  {
    rule: "maxValue",
    label: { en: "Maximum value", fa: "بیشترین مقدار" },
    defaultMessage: {
      en: "Enter a smaller value.",
      fa: "مقدار کوچک‌تری وارد کنید.",
    },
  },
  {
    rule: "allowedValues",
    label: { en: "Allowed values", fa: "مقادیر مجاز" },
    defaultMessage: {
      en: "Choose an allowed value.",
      fa: "یک مقدار مجاز انتخاب کنید.",
    },
  },
];

export const validationRuleDefinitionByName = new Map(validationRuleDefinitions.map(definition => [definition.rule, definition]));

const validationIssueMessages: Record<string, PropertyLabel> = {
  unsupported_validation_rule: {
    en: "This rule is not supported by the selected component.",
    fa: "این قاعده توسط جزء انتخاب‌شده پشتیبانی نمی‌شود.",
  },
  missing_validation_message: {
    en: "Enter a validation message.",
    fa: "پیام اعتبارسنجی را وارد کنید.",
  },
  invalid_validation_parameter: {
    en: "Enter a valid rule value.",
    fa: "یک مقدار معتبر برای قاعده وارد کنید.",
  },
  invalid_regex_source: {
    en: "Pattern source must contain 1 to 256 characters.",
    fa: "الگو باید بین ۱ تا ۲۵۶ نویسه داشته باشد.",
  },
  invalid_regex_flags: {
    en: "Flags may contain i, m, s, and u once each.",
    fa: "پرچم‌ها فقط می‌توانند شامل i، m، s و u و هرکدام یک‌بار باشند.",
  },
  invalid_regex: {
    en: "Enter a valid regular expression.",
    fa: "یک عبارت منظم معتبر وارد کنید.",
  },
  invalid_allowed_values: {
    en: "Allowed values must be non-empty and unique.",
    fa: "مقادیر مجاز باید غیرخالی و یکتا باشند.",
  },
};

export function getValidationIssueMessage(code: string, locale: string, fallback: string): string {
  const message = validationIssueMessages[code];
  return locale === "fa" ? (message?.fa ?? fallback) : (message?.en ?? fallback);
}

export function createValidationRule(rule: ValidationRuleName, locale = "en"): JBValidationRule {
  const definition = validationRuleDefinitionByName.get(rule);
  const message = locale === "fa" ? definition?.defaultMessage.fa : definition?.defaultMessage.en;
  const common = {
    id: crypto.randomUUID(),
    message: localizedText(message ?? "Invalid value.", locale),
  };

  switch (rule) {
    case "minLength":
    case "maxLength":
      return { ...common, rule, params: { value: 1 } };
    case "pattern":
      return {
        ...common,
        rule,
        params: { source: ".+", flags: "u" },
      };
    case "minValue":
    case "maxValue":
      return { ...common, rule, params: { value: 0 } };
    case "allowedValues":
      return { ...common, rule, params: { values: ["value"] } };
  }
}

function issue(code: string, path: string, message: string, elementId: string): FormIssue {
  return {
    source: "registry",
    code,
    path,
    messageKey: code,
    message,
    elementId,
  };
}

export function isValidPatternFlags(flags: string): boolean {
  if (!/^[imsu]{0,4}$/.test(flags)) {
    return false;
  }
  return new Set(flags).size === flags.length;
}

export function validatePortableValidationRule(rule: JBValidationRule, supportedRules: readonly ValidationRuleName[], path: string, elementId: string): FormIssue[] {
  const issues: FormIssue[] = [];
  if (!supportedRules.includes(rule.rule)) {
    issues.push(issue("unsupported_validation_rule", `${path}/rule`, `${rule.rule} is not supported by this component.`, elementId));
  }

  if (!rule.message || Object.keys(rule.message.translations ?? {}).length === 0) {
    issues.push(issue("missing_validation_message", `${path}/message`, "Validation message must contain at least one translation.", elementId));
  }

  switch (rule.rule) {
    case "minLength":
    case "maxLength":
      if (!Number.isInteger(rule.params.value) || rule.params.value < 0) {
        issues.push(issue("invalid_validation_parameter", `${path}/params/value`, "Length must be a non-negative integer.", elementId));
      }
      break;
    case "minValue":
    case "maxValue":
      if (!Number.isFinite(rule.params.value)) {
        issues.push(issue("invalid_validation_parameter", `${path}/params/value`, "Value must be a finite number.", elementId));
      }
      break;
    case "pattern":
      if (rule.params.source.length === 0 || rule.params.source.length > 256) {
        issues.push(issue("invalid_regex_source", `${path}/params/source`, "Pattern source must contain 1 to 256 characters.", elementId));
      }
      if (!isValidPatternFlags(rule.params.flags)) {
        issues.push(issue("invalid_regex_flags", `${path}/params/flags`, "Pattern flags may contain i, m, s, and u once each.", elementId));
      } else {
        try {
          new RegExp(rule.params.source, rule.params.flags);
        } catch {
          issues.push(issue("invalid_regex", `${path}/params/source`, "Pattern must compile as a regular expression.", elementId));
        }
      }
      break;
    case "allowedValues": {
      const keys = rule.params.values.map(value => `${typeof value}:${String(value)}`);
      if (rule.params.values.length === 0 || new Set(keys).size !== keys.length) {
        issues.push(issue("invalid_allowed_values", `${path}/params/values`, "Allowed values must be non-empty and unique.", elementId));
      }
      break;
    }
  }

  return issues;
}

function unwrapValidationValue(value: unknown): unknown {
  if (typeof value === "object" && value !== null && "value" in value) {
    return (value as { value: unknown }).value;
  }
  return value;
}

function isEmptyValidationValue(value: unknown): boolean {
  const unwrapped = unwrapValidationValue(value);
  return unwrapped === null || unwrapped === undefined || unwrapped === "" || (Array.isArray(unwrapped) && unwrapped.length === 0);
}

export function compileValidationRule(rule: JBValidationRule, locale: string, defaultLocale = "en"): ValidationItem<unknown> {
  const message = getLocalizedText(rule.message, locale, defaultLocale) || "Invalid value.";
  const common = { key: rule.id, message };

  switch (rule.rule) {
    case "minLength":
      return {
        ...common,
        stateType: "tooShort",
        validator: value => isEmptyValidationValue(value) || String(unwrapValidationValue(value)).length >= rule.params.value,
      };
    case "maxLength":
      return {
        ...common,
        stateType: "tooLong",
        validator: value => isEmptyValidationValue(value) || String(unwrapValidationValue(value)).length <= rule.params.value,
      };
    case "pattern": {
      const pattern = new RegExp(rule.params.source, rule.params.flags);
      return {
        ...common,
        stateType: "patternMismatch",
        validator: value => isEmptyValidationValue(value) || pattern.test(String(unwrapValidationValue(value))),
      };
    }
    case "minValue":
      return {
        ...common,
        stateType: "rangeUnderflow",
        validator: value => isEmptyValidationValue(value) || Number(unwrapValidationValue(value)) >= rule.params.value,
      };
    case "maxValue":
      return {
        ...common,
        stateType: "rangeOverflow",
        validator: value => isEmptyValidationValue(value) || Number(unwrapValidationValue(value)) <= rule.params.value,
      };
    case "allowedValues":
      return {
        ...common,
        stateType: "customError",
        validator: value => isEmptyValidationValue(value) || rule.params.values.some(allowed => Object.is(allowed, unwrapValidationValue(value))),
      };
  }
}

export function parseAllowedValues(value: string): JSONPrimitive[] {
  return value
    .split(",")
    .map(item => item.trim())
    .filter(Boolean)
    .map(item => {
      if (item === "true") {
        return true;
      }
      if (item === "false") {
        return false;
      }
      if (item === "null") {
        return null;
      }
      const numberValue = Number(item);
      return Number.isFinite(numberValue) && item !== "" ? numberValue : item;
    });
}
