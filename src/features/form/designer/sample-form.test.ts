import { describe, expect, it } from "vitest";
import { validateFormDocument } from "../domain/form-document-validation";
import { DESIGNER_SAMPLE_FORM } from "./sample-form";

describe("Designer sample form", () => {
  it("is valid for the renderer registry", () => {
    expect(validateFormDocument(DESIGNER_SAMPLE_FORM)).toMatchObject({
      valid: true,
      issues: [],
    });
  });

  it("keeps field-only properties off the button", () => {
    const button = DESIGNER_SAMPLE_FORM.elements.find(element => element.type === "jb-button");

    expect(button).toBeDefined();
    expect(button).not.toHaveProperty("label");
    expect(button).not.toHaveProperty("required");
  });
});
