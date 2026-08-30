import { describe, expect, it } from "vitest";
import {
  calculateSizeGroup,
  recalculateAllThemeSizes,
  updateBaseThemeSize,
  withCalculatedThemeSizes,
} from "./theme-size-calculator";

describe("theme size calculator", () => {
  it("builds the jb-core control-height scale from medium", () => {
    const sizes = calculateSizeGroup("--jb-control-height-md", "2.5rem");

    expect(sizes).toEqual({
      "--jb-control-height-xs": "1.5rem",
      "--jb-control-height-sm": "2rem",
      "--jb-control-height-md": "2.5rem",
      "--jb-control-height-lg": "3rem",
      "--jb-control-height-xl": "4rem",
    });
  });

  it("builds the jb-core radius scale from the base radius", () => {
    const sizes = calculateSizeGroup("--jb-radius", "1rem");

    expect(sizes["--jb-radius-xs"]).toBe("0.5rem");
    expect(sizes["--jb-radius-xl"]).toBe("1.5rem");
  });

  it("preserves expert overrides when a family is unlinked", () => {
    const sizes = updateBaseThemeSize({
      "--jb-control-height-md": "2.5rem",
      "--jb-control-height-xl": "5rem",
    }, "--jb-control-height-md", "3rem", false);

    expect(sizes["--jb-control-height-md"]).toBe("3rem");
    expect(sizes["--jb-control-height-xl"]).toBe("5rem");
  });

  it("recalculates expert overrides when a family is linked", () => {
    const sizes = updateBaseThemeSize({
      "--jb-radius": "1rem",
      "--jb-radius-xl": "3rem",
    }, "--jb-radius", "0.8rem", true);

    expect(sizes["--jb-radius"]).toBe("0.8rem");
    expect(sizes["--jb-radius-xl"]).toBe("1.2rem");
  });

  it("fills missing sizes without replacing explicit variants", () => {
    const sizes = withCalculatedThemeSizes({
      "--jb-radius": "1rem",
      "--jb-radius-sm": "0.6rem",
    });

    expect(sizes["--jb-radius-xs"]).toBe("0.5rem");
    expect(sizes["--jb-radius-sm"]).toBe("0.6rem");
  });

  it("can restore an expert-edited size to the calculated value", () => {
    const sizes = recalculateAllThemeSizes({
      "--jb-control-height-md": "2.5rem",
      "--jb-control-height-xl": "5rem",
    });

    expect(sizes["--jb-control-height-xl"]).toBe("4rem");
  });
});
