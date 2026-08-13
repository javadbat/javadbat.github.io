// @vitest-environment happy-dom

import { describe, expect, it } from "vitest";
import { formElementRegistry } from "../../registry/form-element-registry";

describe("jb-listbox Preview dependency", () => {
  it("loads from its package entry without another select component preloading it", async () => {
    expect(customElements.get("jb-listbox")).toBeUndefined();
    expect(customElements.get("jb-option")).toBeUndefined();
    expect(customElements.get("jb-checkbox")).toBeUndefined();

    const listbox = formElementRegistry.find(entry => entry.type === "jb-listbox")!;
    await listbox.loadComponent();

    expect(customElements.get("jb-listbox")).toBeDefined();
    expect(customElements.get("jb-option")).toBeDefined();
    expect(customElements.get("jb-checkbox")).toBeDefined();
  });
});
