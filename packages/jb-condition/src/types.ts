export type JBConditionMatch = "all" | "any";

export type JBConditionOperator =
  | "equals"
  | "notEquals"
  | "isEmpty"
  | "isNotEmpty"
  | "contains"
  | "notContains"
  | "containsAny"
  | "containsAll"
  | "greaterThan"
  | "greaterThanOrEqual"
  | "lessThan"
  | "lessThanOrEqual";

export interface JBConditionRule {
  id: string;
  fieldName: string;
  operator: JBConditionOperator;
  value?: unknown;
}

export interface JBConditionGroup {
  match: JBConditionMatch;
  rules: JBConditionRule[];
}

export type JBConditionValue = Record<string, unknown>;

export interface JBConditionChangeEventDetail {
  matched: boolean;
}

export type JBConditionChangeEvent = CustomEvent<JBConditionChangeEventDetail>;
