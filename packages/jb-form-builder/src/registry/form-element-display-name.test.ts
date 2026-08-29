import { describe, expect, it } from "vitest";
import { formElementRegistry, getFormElementDescription, getFormElementDisplayName } from "./form-element-registry";

describe("form element display names", () => {
  it("provides a Persian name for every registered component", () => {
    for (const entry of formElementRegistry) {
      expect(getFormElementDisplayName(entry, "fa")).not.toBe(entry.displayName);
      expect(getFormElementDisplayName(entry, "fa-IR")).toBe(getFormElementDisplayName(entry, "fa"));
      expect(getFormElementDisplayName(entry, "en")).toBe(entry.displayName);
    }
  });

  it("provides a Persian description for every registered component", () => {
    for (const entry of formElementRegistry) {
      expect(getFormElementDescription(entry, "fa")).not.toBe(entry.description);
      expect(getFormElementDescription(entry, "fa-IR")).toBe(getFormElementDescription(entry, "fa"));
      expect(getFormElementDescription(entry, "en")).toBe(entry.description);
    }
  });
});
