import { describe, expect, it } from "vitest";
import { createEmptyFormDocument } from "../../domain/form-document";
import { createDefaultElement, formElementRegistry } from "jb-form-builder/registry/form-element-registry";
import { getFormExportFileName, prepareFormExport, serializeFormDocument } from "./form-export";

describe("form JSON export", () => {
  it("produces stable readable JSON regardless of object insertion order", () => {
    const document = createEmptyFormDocument();
    document.slug = "contact";
    const reordered = {
      theme: document.theme,
      elements: document.elements,
      localization: document.localization,
      metadata: document.metadata,
      slug: document.slug,
      id: document.id,
      schemaVersion: document.schemaVersion,
      $schema: document.$schema,
    };

    const first = serializeFormDocument(document);
    const second = serializeFormDocument(reordered);

    expect(first).toBe(second);
    expect(first.endsWith("\n")).toBe(true);
    expect(JSON.parse(first)).toEqual(document);
  });

  it("validates the snapshot and rejects invalid element configuration", () => {
    const document = createEmptyFormDocument();
    const element = createDefaultElement(formElementRegistry[0], "contact");
    element.name = "";
    document.elements.push(element);

    const result = prepareFormExport(document);

    expect(result.valid).toBe(false);
    if (!result.valid) {
      expect(result.issues.length).toBeGreaterThan(0);
    }
  });

  it("uses the slug or the agreed untitled fallback in download names", () => {
    const document = createEmptyFormDocument();
    expect(getFormExportFileName(document)).toBe("untitled-form.jb-form.json");

    document.slug = "customer-details";
    expect(getFormExportFileName(document)).toBe("customer-details.jb-form.json");
  });

  it("exports only the portable document contract", () => {
    const document = createEmptyFormDocument();
    document.elements.push(createDefaultElement(formElementRegistry[0], "fullName"));

    const result = prepareFormExport(document);

    expect(result.valid).toBe(true);
    if (result.valid) {
      const parsed = JSON.parse(result.json);
      expect(parsed).toEqual(document);
      expect(parsed).not.toHaveProperty("selectedElementId");
      expect(parsed).not.toHaveProperty("isDirty");
      expect(result.fileName).toBe("untitled-form.jb-form.json");
    }
  });

  it("omits unset optional text presentation so the renderer can inherit the theme", () => {
    const document = createEmptyFormDocument();
    const textEntry = formElementRegistry.find(entry => entry.type === "text")!;
    document.elements.push(createDefaultElement(textEntry, "intro"));

    const result = prepareFormExport(document);

    expect(result.valid).toBe(true);
    if (result.valid) {
      const parsed = JSON.parse(result.json);
      expect(parsed.elements[0].props).not.toHaveProperty("color");
      expect(parsed.elements[0].props).not.toHaveProperty("fontSize");
      expect(parsed.elements[0].props).not.toHaveProperty("fontWeight");
      expect(parsed.elements[0].props).not.toHaveProperty("lineHeight");
      expect(parsed.elements[0].props).not.toHaveProperty("textAlign");
    }
  });
});
