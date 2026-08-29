import { describe, expect, it } from "vitest";
import { resolveThemeBackground } from "./theme-controller";

describe("resolveThemeBackground", () => {
  it("resolves colors without an image layer", () => {
    expect(resolveThemeBackground({ type: "color", color: "#fff" })).toEqual({ type: "color", color: "#fff" });
  });

  it("materializes stable patterns without application asset paths", () => {
    const result = resolveThemeBackground({
      type: "pattern",
      patternId: "academic-waves",
      color: "#f8faff",
      foregroundColor: "#3156b8",
      opacity: 25,
      scale: 150,
    });

    expect(result.type).toBe("pattern");
    expect(result.image).toContain("data:image/svg+xml");
    expect(result.image).not.toContain("/form/theme-patterns");
    expect(result.size).toBe("216px");
    expect(result.opacity).toBe(1);
  });

  it("keeps image fallback independent from image availability", () => {
    expect(resolveThemeBackground({
      type: "image",
      source: "https://example.com/background.webp",
      fit: "contain",
      position: "top center",
      opacity: 40,
      overlayColor: "rgb(0 0 0 / 20%)",
      fallbackColor: "#eee",
    })).toEqual({
      type: "image",
      color: "#eee",
      image: 'linear-gradient(rgb(0 0 0 / 20%), rgb(0 0 0 / 20%)), url("https://example.com/background.webp")',
      size: "contain",
      position: "top center",
      repeat: "no-repeat",
      opacity: 0.4,
    });
  });
});
