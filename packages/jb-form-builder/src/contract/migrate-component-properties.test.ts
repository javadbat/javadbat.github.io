import { describe, expect, it } from "vitest";
import { createEmptyFormDocument, type JBFormElementV1 } from "./form-document";
import { validateFormDocument } from "./form-document-validation";
import { createDefaultElement, registryByType } from "../registry/form-element-registry";

describe("component release compatibility", () => {
  it("migrates saved properties, including nested fields, without mutating the source", () => {
    const document = createEmptyFormDocument();
    const field = (type: JBFormElementV1["type"], props: Record<string, string | boolean>) => {
      const element = createDefaultElement(registryByType.get(type)!, type);
      element.props = props;
      return element;
    };
    const tabs = createDefaultElement(registryByType.get("jb-tab")!, "tabs");
    if (tabs.type !== "jb-tab") throw new Error("Expected tabs");
    tabs.tabs[0].children.push(field("jb-select", { hideClear: true }) as typeof tabs.tabs[0]["children"][number]);
    document.elements = [
      tabs,
      field("jb-time-input", { frontalZero: false }),
      field("jb-date-input", { direction: "rtl" }),
      field("jb-file-input", { acceptTypes: ".pdf" }),
      field("jb-image-input", { acceptTypes: "image/png" }),
    ];
    const original = structuredClone(document);
    const result = validateFormDocument(document);
    expect(result.issues).toEqual([]);
    expect(result.valid).toBe(true);
    const migratedTabs = result.document!.elements[0];
    if (migratedTabs.type !== "jb-tab") throw new Error("Expected tabs");
    expect(migratedTabs.tabs[0].children[0].props).toEqual({ clearable: false });
    expect(result.document!.elements.slice(1).map(element => element.props)).toEqual([
      { leadingZero: false }, { dir: "rtl" }, { accept: ".pdf" }, { accept: "image/png" },
    ]);
    expect(document).toEqual(original);
  });

  it("preserves explicit current properties and still rejects invalid legacy values", () => {
    const document = createEmptyFormDocument();
    const select = createDefaultElement(registryByType.get("jb-select")!, "selection");
    select.props = { hideClear: true, clearable: true };
    document.elements = [select];
    expect(validateFormDocument(document).document!.elements[0].props).toEqual({ clearable: true });
    select.props = { hideClear: "invalid boolean" };
    expect(validateFormDocument(document).valid).toBe(false);
  });
});
