import { describe, expect, it } from "vitest";
import { createEmptyFormDocument } from "../domain/form-document";
import { prepareFormImport } from "./form-import";

describe("form JSON import", () => {
  it("parses and validates a current version document without mutating the source", () => {
    const document = createEmptyFormDocument();
    const result = prepareFormImport(JSON.stringify(document));

    expect(result).toMatchObject({ valid: true, sourceVersion: 1, migrated: false });
    if (result.valid) {
      expect(result.document).toEqual(document);
      expect(result.document).not.toBe(document);
    }
  });

  it("rejects malformed JSON", () => {
    const result = prepareFormImport("{broken");

    expect(result.valid).toBe(false);
    if (!result.valid) {
      expect(result.issues[0]).toMatchObject({ code: "invalid_json", path: "/" });
    }
  });

  it("rejects missing and newer schema versions before validation", () => {
    const missing = prepareFormImport(JSON.stringify({}));
    const newer = prepareFormImport(JSON.stringify({ schemaVersion: 2 }));

    expect(missing).toMatchObject({ valid: false, issues: [{ code: "missing_schema_version" }] });
    expect(newer).toMatchObject({ valid: false, issues: [{ code: "unsupported_schema_version", path: "/schemaVersion" }] });
  });

  it("returns structural and semantic issues without changing the current draft", () => {
    const document = createEmptyFormDocument();
    document.elements = [{
      id: crypto.randomUUID(),
      type: "jb-input",
      adapterVersion: 1,
      name: "",
      props: {},
      validation: [],
    }];

    const result = prepareFormImport(JSON.stringify(document));

    expect(result.valid).toBe(false);
    if (!result.valid) {
      expect(result.issues.some(issue => issue.path.endsWith("/name") || issue.code.includes("minLength"))).toBe(true);
    }
  });
});
