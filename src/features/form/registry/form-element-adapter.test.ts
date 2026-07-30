// @vitest-environment happy-dom

import { describe, expect, it } from "vitest";
import type { ValidationItem } from "jb-validation";
import { localizedText } from "../domain/form-document";
import { compileValidationRule, createValidationRule } from "./validation-rule-registry";
import { formElementRegistry, createDefaultElement } from "./form-element-registry";
import type { RuntimeFormElement } from "./form-element-adapter";

describe("JB element registry adapters", () => {
  it("declares complete adapter metadata for every inventory component", () => {
    expect(formElementRegistry).toHaveLength(16);

    for (const entry of formElementRegistry) {
      expect(entry.packageName).toBe(entry.type);
      expect(entry.tagName).toBe(entry.type);
      expect(entry.adapterVersion).toBe(1);
      expect(entry.supportedSchemaVersions).toEqual([1]);
      expect(entry.valueType.length).toBeGreaterThan(0);
      expect(entry.iconId.length).toBeGreaterThan(0);
      expect(entry.eventNames.length).toBeGreaterThan(0);
      expect(entry.loadComponent).toBeTypeOf("function");
      expect(entry.applyToRuntime).toBeTypeOf("function");
      expect(entry.validate).toBeTypeOf("function");
    }
  });

  it("creates defaults using only supported common fields", () => {
    for (const entry of formElementRegistry) {
      const element = createDefaultElement(entry, entry.defaultName);
      expect(entry.validate(element, entry)).toEqual([]);

      for (const field of ["required", "disabled", "label", "placeholder"] as const) {
        expect(Object.hasOwn(element, field)).toBe(entry.commonFields[field]);
      }
      expect(Object.hasOwn(element, "initialValue")).toBe(false);
    }
  });

  it("round-trips portable data without retaining mutable references", () => {
    for (const entry of formElementRegistry) {
      const source = createDefaultElement(entry, `${entry.defaultName}_field`);
      if (entry.validationRules.length > 0) {
        source.validation.push(createValidationRule(entry.validationRules[0], "en"));
      }

      const serialized = entry.serialize(source);
      const restored = entry.deserialize(serialized);

      expect(restored).toEqual(source);
      expect(restored).not.toBe(source);
      expect(restored.props).not.toBe(source.props);
      expect(restored.validation).not.toBe(source.validation);
    }
  });

  it("reports non-portable properties and incompatible validation", () => {
    const entry = formElementRegistry.find(candidate => candidate.type === "jb-button")!;
    const element = createDefaultElement(entry, "submit");
    element.props.callback = "not-approved";
    element.validation.push(createValidationRule("pattern"));

    const issues = entry.validate(element, entry);

    expect(issues.map(issue => issue.code)).toContain("unknown-property");
    expect(issues.map(issue => issue.code)).toContain("unsupported_validation_rule");
  });

  it("applies localized data, declarative options, and compiled rules at runtime", () => {
    const entry = formElementRegistry.find(candidate => candidate.type === "jb-select")!;
    const element = createDefaultElement(entry, "contactMethod");
    element.label = {
      translations: { en: "Contact method", fa: "روش تماس" },
    };
    element.props.options = [
      {
        id: "phone",
        value: "phone",
        label: { translations: { en: "Phone", fa: "تلفن" } },
        disabled: false,
      },
    ];
    element.validation = [
      {
        id: "allowed-contact",
        rule: "allowedValues",
        params: { values: ["phone"] },
        message: localizedText("Choose a contact method."),
      },
    ];

    const target = document.createElement("div") as unknown as RuntimeFormElement;
    const validation = { list: [] as ValidationItem<unknown>[] };
    Object.defineProperty(target, "validation", { value: validation });
    entry.applyToRuntime(target, element, "fa");

    expect(target.getAttribute("name")).toBe("contactMethod");
    expect(target.getAttribute("label")).toBe("روش تماس");
    expect(target.querySelector("jb-option")?.textContent).toBe("تلفن");
    expect(validation.list).toHaveLength(1);
    expect(validation.list[0].key).toBe("allowed-contact");
  });

  it("keeps user rules declarative while compiling trusted runtime validators", () => {
    const rule = createValidationRule("pattern");
    if (rule.rule !== "pattern") {
      throw new Error("Expected a pattern rule.");
    }
    rule.params.source = "^value$";
    const portable = JSON.stringify(rule);
    const compiled = compileValidationRule(rule, "en");

    expect(portable).not.toContain("function");
    expect(compiled.validator).toBeTypeOf("function");
    const validator = compiled.validator as (value: unknown) => boolean;
    expect(validator("")).toBe(true);
    expect(validator("value")).toBe(true);
    expect(validator("no spaces")).toBe(false);
  });

  it("keeps one isolated lazy loader per component", () => {
    expect(new Set(formElementRegistry.map(entry => entry.loadComponent)).size).toBe(formElementRegistry.length);
  });
});
