// @vitest-environment happy-dom

import { describe, expect, it } from "vitest";
import type { JBFormElementType, JSONValue } from "../contract/form-document";
import { createDefaultElement, formElementRegistry } from "./form-element-registry";
import type { RuntimeFormElement } from "./form-element-adapter";

describe("form element adapter runtime assignment", () => {
  it.each([
    { type: "jb-number-input", property: "decimalPrecision", propertyValue: 2, initialValue: "12.34", runtimeInitialValue: "12.34" },
    { type: "jb-range-input", property: "mode", propertyValue: "range", initialValue: [2, 8], runtimeInitialValue: [2, 8] },
    { type: "jb-date-input", property: "valueType", propertyValue: "JALALI", initialValue: "1405-01-01", runtimeInitialValue: "1405-01-01" },
    { type: "jb-time-input", property: "secondEnabled", propertyValue: false, initialValue: "12:30:45", runtimeInitialValue: "12:30" },
    { type: "jb-textarea", property: "autoHeight", propertyValue: true, initialValue: "Notes", runtimeInitialValue: "Notes" },
    { type: "jb-select", property: "multiple", propertyValue: true, initialValue: ["option_1"], runtimeInitialValue: ["option_1"] },
    { type: "jb-listbox", property: "multiple", propertyValue: true, initialValue: ["option_1"], runtimeInitialValue: ["option_1"] },
    { type: "jb-checkbox", property: "size", propertyValue: "sm", initialValue: true, runtimeInitialValue: true },
    { type: "jb-switch", property: "isLoading", propertyValue: false, initialValue: true, runtimeInitialValue: true },
  ] satisfies Array<{
    type: JBFormElementType;
    property: string;
    propertyValue: JSONValue;
    initialValue: JSONValue;
    runtimeInitialValue: JSONValue;
  }>)("applies $type props before its initial value", ({ type, property, propertyValue, initialValue, runtimeInitialValue }) => {
    const entry = formElementRegistry.find(candidate => candidate.type === type)!;
    const element = createDefaultElement(entry, "appointmentTime");
    element.props[property] = propertyValue;
    element.initialValue = initialValue;
    const assignments: Array<[string, unknown]> = [];
    const target = document.createElement("div") as unknown as RuntimeFormElement;
    Object.defineProperties(target, {
      [property]: {
        configurable: true,
        set(value: unknown) {
          assignments.push([property, value]);
        },
      },
      initialValue: {
        configurable: true,
        set(value: unknown) {
          assignments.push(["initialValue", value]);
        },
      },
    });

    entry.applyToRuntime(target, element, "en");

    expect(assignments).toContainEqual([property, propertyValue]);
    expect(assignments).toContainEqual(["initialValue", runtimeInitialValue]);
    expect(assignments.findIndex(([key]) => key === property)).toBeLessThan(assignments.findIndex(([key]) => key === "initialValue"));
  });
});
