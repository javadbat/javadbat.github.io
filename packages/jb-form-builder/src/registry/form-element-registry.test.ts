import { describe, expect, it } from "vitest";
import { getLocalizedText, isTabElement } from "../contract/form-document";
import { createDefaultElement, formElementRegistry } from "./form-element-registry";

describe("form element localized defaults", () => {
  it("provides Farsi defaults for common labels and placeholders", () => {
    for (const entry of formElementRegistry) {
      const element = createDefaultElement(entry, entry.defaultName, "fa");
      if (isTabElement(element)) {
        expect(element.tabs.every(tab => getLocalizedText(tab.label, "fa", "fa") !== "")).toBe(true);
        continue;
      }
      if (entry.commonFields.label) {
        expect(element.label?.translations).toEqual({ fa: expect.any(String) });
      }
      if (entry.commonFields.placeholder) {
        expect(element.placeholder?.translations).toEqual({ fa: expect.any(String) });
      }
    }
  });

  it("provides Farsi values for localized component-property defaults", () => {
    for (const entry of formElementRegistry) {
      for (const definition of entry.propertyDefinitions.filter(definition => definition.localized)) {
        const element = createDefaultElement(entry, entry.defaultName, "fa");
        const defaultValue = element.props[definition.key];
        if (defaultValue === undefined) continue;

        expect(defaultValue).toBeTypeOf("object");
        expect(defaultValue).not.toBeNull();
        expect(Array.isArray(defaultValue)).toBe(false);
        expect((defaultValue as { translations?: Record<string, string> }).translations).toEqual({ fa: expect.any(String) });
      }
    }
  });

  it("localizes built-in select option labels", () => {
    for (const type of ["jb-select", "jb-listbox"] as const) {
      const entry = formElementRegistry.find(candidate => candidate.type === type)!;
      const options = entry.defaultProps.options as Array<{ label: { translations: Record<string, string> } }>;
      expect(options[0].label.translations.fa).toBe("گزینه ۱");
    }
  });

  it("uses readable localized labels for size options", () => {
    const entry = formElementRegistry.find(candidate => candidate.type === "jb-input")!;
    const sizeDefinition = entry.propertyDefinitions.find(definition => definition.key === "size")!;

    expect(sizeDefinition.options).toEqual([
      { value: "xs", label: { en: "Extra small", fa: "خیلی کوچک" } },
      { value: "sm", label: { en: "Small", fa: "کوچک" } },
      { value: "md", label: { en: "Medium", fa: "متوسط" } },
      { value: "lg", label: { en: "Large", fa: "بزرگ" } },
      { value: "xl", label: { en: "Extra large", fa: "خیلی بزرگ" } },
    ]);
  });

  it("exposes the jb-checkbox v2 color and variant controls", () => {
    const entry = formElementRegistry.find(candidate => candidate.type === "jb-checkbox")!;
    const checkbox = createDefaultElement(entry, "permission");

    expect(checkbox.props).toMatchObject({ size: "md", variant: "solid", color: "primary" });
    expect(entry.propertyDefinitions.find(definition => definition.key === "variant")?.options?.map(option => option.value))
      .toEqual(["solid", "outline", "filled-outline"]);
    expect(entry.propertyDefinitions.find(definition => definition.key === "color")?.options?.map(option => option.value))
      .toEqual(["primary", "secondary", "positive", "danger", "warning", "light", "dark"]);

    checkbox.props.variant = "unsupported";
    checkbox.props.color = "brand";
    expect(entry.validate(checkbox, entry).filter(issue => issue.code === "invalid-property-option")).toHaveLength(2);
  });
});
