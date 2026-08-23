// @vitest-environment node

import { describe, expect, it } from "vitest";
import { defineJBFormBuilder } from "./define";

describe("jb-form-builder server import boundary", () => {
  it("can import and call registration without browser globals", () => {
    expect(globalThis.HTMLElement).toBeUndefined();
    expect(globalThis.customElements).toBeUndefined();
    expect(() => defineJBFormBuilder()).not.toThrow();
  });

  it("keeps the auto-registration and React wrapper entries importable", async () => {
    await expect(import("./index")).resolves.toBeDefined();
    await expect(import("./react")).resolves.toBeDefined();
  });
});
