import { describe, expect, it } from "vitest";
import {
  calculateColorGroup,
  recalculateAllThemeColors,
  withCalculatedThemeColors,
} from "./theme-color-calculator";

describe("theme color calculator", () => {
  it("uses the jb-core semantic group to create all interaction colors", () => {
    const colors = calculateColorGroup("--jb-primary", "#2455e8");

    expect(colors["--jb-primary"]).toBe("#2455e8");
    expect(colors["--jb-primary-hover"]).toMatch(/^oklch\(/);
    expect(colors["--jb-primary-pressed"]).toMatch(/^oklch\(/);
    expect(colors["--jb-primary-subtle"]).toMatch(/^oklch\(/);
    expect(Object.keys(colors)).toHaveLength(7);
  });

  it("builds the complete neutral ramp from one base color", () => {
    const colors = calculateColorGroup("--jb-neutral", "#596174");

    expect(colors["--jb-neutral"]).toBe("#596174");
    expect(colors["--jb-neutral-0"]).toMatch(/^oklch\(/);
    expect(colors["--jb-neutral-10"]).toMatch(/^oklch\(/);
    expect(Object.keys(colors)).toHaveLength(12);
  });

  it("preserves expert overrides when filling missing calculated shades", () => {
    const colors = withCalculatedThemeColors({
      "--jb-primary": "#2455e8",
      "--jb-primary-hover": "#ffffff",
    });

    expect(colors["--jb-primary-hover"]).toBe("#ffffff");
    expect(colors["--jb-primary-subtle"]).toMatch(/^oklch\(/);
  });

  it("can restore an expert-edited shade to the calculated value", () => {
    const colors = recalculateAllThemeColors({
      "--jb-primary": "#2455e8",
      "--jb-primary-hover": "#ffffff",
    });

    expect(colors["--jb-primary-hover"]).not.toBe("#ffffff");
  });
});
