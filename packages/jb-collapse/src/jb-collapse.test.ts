// @vitest-environment happy-dom

import { describe, expect, it, vi } from "vitest";
import { defineJBCollapse } from "./define";
import type { JBCollapseWebComponent } from "./jb-collapse";

defineJBCollapse();

describe("jb-collapse", () => {
  it("keeps the triangle before the title and toggles accessible state", () => {
    const collapse = document.createElement("jb-collapse") as JBCollapseWebComponent;
    const title = document.createElement("span");
    title.slot = "title";
    title.textContent = "Settings";
    collapse.append(title, document.createElement("input"));
    document.body.append(collapse);

    const button = collapse.shadowRoot!.querySelector("button")!;
    const content = collapse.shadowRoot!.querySelector<HTMLElement>(".content")!;
    const changed = vi.fn();
    collapse.addEventListener("collapse-change", changed);

    expect(button.firstElementChild?.classList.contains("icon")).toBe(true);
    expect(button.lastElementChild?.getAttribute("name")).toBe("title");
    expect(button.getAttribute("aria-expanded")).toBe("false");
    expect(content.inert).toBe(true);

    button.click();

    expect(collapse.open).toBe(true);
    expect(button.getAttribute("aria-expanded")).toBe("true");
    expect(content.inert).toBe(false);
    expect(changed).toHaveBeenCalledOnce();
  });
});
