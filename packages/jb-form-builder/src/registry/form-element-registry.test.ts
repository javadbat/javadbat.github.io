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
});
