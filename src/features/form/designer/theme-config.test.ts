import { describe, expect, it } from "vitest";
import { cloneTheme, DEFAULT_DESIGNER_THEME, fromPortableThemeConfig, toPortableThemeConfig } from "./theme-config";

describe("Designer ThemeConfig adapter", () => {
  it("exports the editor model through the portable sparse contract", () => {
    const theme = cloneTheme(DEFAULT_DESIGNER_THEME);
    theme.global["--jb-neutral-4"] = null;

    const result = toPortableThemeConfig(theme);

    expect(result.schemaVersion).toBe(1);
    expect(result.global).not.toHaveProperty("--jb-neutral-4");
    expect(result.background).toEqual(expect.objectContaining({
      type: "pattern",
      patternId: "science-doodles",
    }));
  });

  it("does not export a missing temporary image source", () => {
    const theme = cloneTheme(DEFAULT_DESIGNER_THEME);
    theme.background.mode = "image";
    delete theme.background.imageUrl;

    expect(toPortableThemeConfig(theme).background).toEqual({
      type: "color",
      color: theme.background.color,
    });
  });

  it("hydrates a stored portable theme into friendly editor controls", () => {
    const result = fromPortableThemeConfig({
      schemaVersion: 1,
      name: "Stored",
      typography: { textScale: 1.2 },
      background: { type: "color", color: "#abcdef" },
    });

    expect(result.name).toBe("Stored");
    expect(result.typography.textScale).toBe(1.2);
    expect(result.background).toEqual(expect.objectContaining({ mode: "color", color: "#abcdef" }));
  });

  it("preserves portable image presentation fields through editor hydration", () => {
    const editor = fromPortableThemeConfig({
      schemaVersion: 1,
      name: "Image",
      background: {
        type: "image",
        source: "https://example.com/background.webp",
        fit: "contain",
        position: "top center",
        opacity: 60,
        overlayColor: "rgb(0 0 0 / 20%)",
        fallbackColor: "#eeeeee",
      },
    });

    expect(toPortableThemeConfig(editor).background).toEqual({
      type: "image",
      source: "https://example.com/background.webp",
      fit: "contain",
      position: "top center",
      opacity: 60,
      overlayColor: "rgb(0 0 0 / 20%)",
      fallbackColor: "#eeeeee",
    });
  });

  it("preserves supported component overrides through editor hydration and export", () => {
    const editor = fromPortableThemeConfig({
      schemaVersion: 1,
      name: "Component overrides",
      components: {
        "jb-input": { tokens: { "--jb-input-border-color": "#123456" } },
      },
    });

    expect(toPortableThemeConfig(editor).components).toEqual({
      "jb-input": { tokens: { "--jb-input-border-color": "#123456" } },
    });
  });
});
