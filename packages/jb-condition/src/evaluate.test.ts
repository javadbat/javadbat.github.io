import { describe, expect, it } from "vitest";
import { evaluateConditions } from "./evaluate";

describe("evaluateConditions", () => {
  it("matches an empty condition group", () => {
    expect(evaluateConditions({}, { match: "any", rules: [] })).toBe(true);
  });

  it("supports all and any groups", () => {
    const rules = [
      { id: "gender", fieldName: "gender", operator: "equals" as const, value: "female" },
      { id: "age", fieldName: "age", operator: "greaterThanOrEqual" as const, value: 18 },
    ];
    expect(evaluateConditions({ gender: "female", age: 20 }, { match: "all", rules })).toBe(true);
    expect(evaluateConditions({ gender: "male", age: 20 }, { match: "all", rules })).toBe(false);
    expect(evaluateConditions({ gender: "male", age: 20 }, { match: "any", rules })).toBe(true);
  });

  it("supports repeated-name Map collections without a jb-form dependency", () => {
    const phones = new Map([["first", "111"], ["second", "222"]]);
    expect(evaluateConditions({ phone: phones }, {
      match: "all",
      rules: [{ id: "phone", fieldName: "phone", operator: "contains", value: "222" }],
    })).toBe(true);
  });

  it("compares numeric strings numerically", () => {
    expect(evaluateConditions({ amount: "10" }, {
      match: "all",
      rules: [{ id: "amount", fieldName: "amount", operator: "greaterThan", value: "2" }],
    })).toBe(true);
  });
});
