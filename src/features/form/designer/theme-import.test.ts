import { describe, expect, it } from "vitest";
import type { StoredThemeRecordV1 } from "../storage/storage-types";
import { prepareThemeImport } from "./theme-import";

function record(name: string, slug: string): StoredThemeRecordV1 {
  return {
    recordVersion: 1,
    builderVersion: "test",
    id: crypto.randomUUID(),
    slug,
    revision: 1,
    createdAt: "2026-08-30T00:00:00.000Z",
    updatedAt: "2026-08-30T00:00:00.000Z",
    config: { schemaVersion: 1, name },
  };
}

describe("prepareThemeImport", () => {
  it("returns a canonical valid config without changing storage", () => {
    const result = prepareThemeImport(JSON.stringify({
      schemaVersion: 1,
      name: "  New Theme ",
      global: { "--jb-text-primary": " #111 ", "--jb-primary": "#00f" },
    }), []);

    expect(result).toEqual({
      valid: true,
      config: {
        schemaVersion: 1,
        name: "New Theme",
        global: { "--jb-primary": "#00f", "--jb-text-primary": "#111" },
      },
      generatedSlug: "new-theme",
      conflicts: { name: false, slug: false },
      warnings: [],
      omittedIssues: [],
    });
  });

  it("detects name and generated-slug conflicts for an explicit copy decision", () => {
    const result = prepareThemeImport('{"schemaVersion":1,"name":"Rose Pop"}', [record("rose pop", "rose-pop")]);

    expect(result.valid && result.conflicts).toEqual({ name: true, slug: true });
  });

  it("reports parse and unsupported-value errors", () => {
    expect(prepareThemeImport("{", []).valid).toBe(false);
    const unsupported = prepareThemeImport('{"schemaVersion":1,"name":"Theme","future":true}', []);
    expect(unsupported.valid).toBe(false);
    if (!unsupported.valid) expect(unsupported.issues).toContainEqual(expect.objectContaining({ path: "/future" }));
  });

  it("warns for accepted embedded images above 400 KB", () => {
    const source = `data:image/png;base64,${"A".repeat(Math.ceil(401 * 1024 * 4 / 3))}`;
    const result = prepareThemeImport(JSON.stringify({ schemaVersion: 1, name: "Large", background: { type: "image", source } }), []);

    expect(result.valid && result.warnings).toHaveLength(1);
  });

  it("retains supported values and reports every omitted optional path when explicitly requested", () => {
    const result = prepareThemeImport(JSON.stringify({
      schemaVersion: 1,
      name: "Future Theme",
      future: true,
      global: { "--jb-primary": "#123456", "--future-token": "red" },
      typography: { textScale: 1.2, futureFontOption: true },
      defaults: { controlSize: "xl" },
      background: { type: "pattern", patternId: "future-pattern", color: "#fff" },
    }), [], { supportedValuesOnly: true });

    expect(result.valid).toBe(true);
    if (!result.valid) return;
    expect(result.config).toEqual({
      schemaVersion: 1,
      name: "Future Theme",
      global: { "--jb-primary": "#123456" },
      typography: { textScale: 1.2 },
    });
    expect(result.omittedIssues.map(issue => issue.path)).toEqual(expect.arrayContaining([
      "/future",
      "/global/--future-token",
      "/typography/futureFontOption",
      "/defaults/controlSize",
      "/background/patternId",
    ]));
  });

  it("never downgrades an unsupported schema version or invents a required name", () => {
    const version = prepareThemeImport('{"schemaVersion":2,"name":"Future","future":true}', [], { supportedValuesOnly: true });
    const name = prepareThemeImport('{"schemaVersion":1,"future":true}', [], { supportedValuesOnly: true });

    expect(version.valid).toBe(false);
    expect(name.valid).toBe(false);
  });
});
