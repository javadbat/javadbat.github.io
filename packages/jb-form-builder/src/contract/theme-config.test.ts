import { describe, expect, it } from "vitest";
import { canonicalizeThemeConfig, validateThemeConfig } from "./theme-config";

describe("ThemeConfig v1", () => {
  it("canonicalizes sparse values and deterministic token ordering", () => {
    const result = canonicalizeThemeConfig({
      schemaVersion: 1,
      name: "  School theme  ",
      description: "  Calm and readable  ",
      global: { "--jb-text-primary": " #111 ", "--jb-primary": "#2455e8" },
      defaults: { controlSize: "lg" },
    });

    expect(result).toEqual({
      schemaVersion: 1,
      name: "School theme",
      description: "Calm and readable",
      global: { "--jb-primary": "#2455e8", "--jb-text-primary": "#111" },
      defaults: { controlSize: "lg" },
    });
  });

  it("rejects unsupported and invalid values without stripping them", () => {
    const result = validateThemeConfig({
      schemaVersion: 2,
      name: "",
      unknown: true,
      global: { "--not-supported": "red" },
      defaults: { controlSize: "huge" },
    });

    expect(result.valid).toBe(false);
    expect(result.issues.map(issue => issue.path)).toEqual(expect.arrayContaining([
      "/schemaVersion",
      "/name",
      "/unknown",
      "/global/--not-supported",
      "/defaults/controlSize",
    ]));
  });

  it("rejects temporary image URLs", () => {
    expect(validateThemeConfig({
      schemaVersion: 1,
      name: "Temporary",
      background: { type: "image", source: "blob:https://example.com/id" },
    }).issues).toContainEqual(expect.objectContaining({ path: "/background/source" }));
  });

  it("rejects Base64 background images above the portable size limit", () => {
    const source = `data:image/png;base64,${"A".repeat(Math.ceil(801 * 1024 * 4 / 3))}`;
    const result = validateThemeConfig({ schemaVersion: 1, name: "Too large", background: { type: "image", source } });

    expect(result.issues).toContainEqual(expect.objectContaining({ path: "/background/source", message: expect.stringContaining("800 KB") }));
  });
});
