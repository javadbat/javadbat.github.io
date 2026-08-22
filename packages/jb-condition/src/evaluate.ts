import type { JBConditionGroup, JBConditionRule, JBConditionValue } from "./types.js";

function collectionValues(value: unknown): unknown[] | null {
  if (Array.isArray(value)) return value;
  if (value instanceof Map || value instanceof Set) return Array.from(value.values());
  return null;
}

function isEmpty(value: unknown): boolean {
  if (value === undefined || value === null || value === "") return true;
  const collection = collectionValues(value);
  return collection?.length === 0;
}

function equals(actual: unknown, expected: unknown): boolean {
  return Object.is(actual, expected);
}

function contains(actual: unknown, expected: unknown): boolean {
  if (typeof actual === "string") return actual.includes(String(expected ?? ""));
  const collection = collectionValues(actual);
  return collection ? collection.some(value => equals(value, expected)) : false;
}

function expectedValues(value: unknown): unknown[] {
  return collectionValues(value) ?? [value];
}

function compare(actual: unknown, expected: unknown): number | null {
  if (typeof actual === "number" && typeof expected === "number" && Number.isFinite(actual) && Number.isFinite(expected)) return actual - expected;
  if (typeof actual === "string" && typeof expected === "string") {
    const actualNumber = Number(actual);
    const expectedNumber = Number(expected);
    if (actual.trim() !== "" && expected.trim() !== "" && Number.isFinite(actualNumber) && Number.isFinite(expectedNumber)) {
      return actualNumber - expectedNumber;
    }
    return actual.localeCompare(expected);
  }
  return null;
}

export function evaluateConditionRule(formValue: JBConditionValue, rule: JBConditionRule): boolean {
  const actual = Object.prototype.hasOwnProperty.call(formValue, rule.fieldName) ? formValue[rule.fieldName] : undefined;
  switch (rule.operator) {
    case "equals": return equals(actual, rule.value);
    case "notEquals": return !equals(actual, rule.value);
    case "isEmpty": return isEmpty(actual);
    case "isNotEmpty": return !isEmpty(actual);
    case "contains": return contains(actual, rule.value);
    case "notContains": return !contains(actual, rule.value);
    case "containsAny": return expectedValues(rule.value).some(value => contains(actual, value));
    case "containsAll": return expectedValues(rule.value).every(value => contains(actual, value));
    case "greaterThan": return (compare(actual, rule.value) ?? Number.NEGATIVE_INFINITY) > 0;
    case "greaterThanOrEqual": return (compare(actual, rule.value) ?? Number.NEGATIVE_INFINITY) >= 0;
    case "lessThan": return (compare(actual, rule.value) ?? Number.POSITIVE_INFINITY) < 0;
    case "lessThanOrEqual": return (compare(actual, rule.value) ?? Number.POSITIVE_INFINITY) <= 0;
    default: return false;
  }
}

export function evaluateConditions(formValue: JBConditionValue, conditions: JBConditionGroup): boolean {
  if (conditions.rules.length === 0) return true;
  return conditions.match === "any"
    ? conditions.rules.some(rule => evaluateConditionRule(formValue, rule))
    : conditions.rules.every(rule => evaluateConditionRule(formValue, rule));
}
