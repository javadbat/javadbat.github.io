export type JBCollapseVariant = "card" | "flush";

export interface JBCollapseChangeDetail {
  open: boolean;
}

export type JBCollapseChangeEvent = CustomEvent<JBCollapseChangeDetail>;
