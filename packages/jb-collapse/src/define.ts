import { JBCollapseWebComponent } from "./jb-collapse.js";

export const JB_COLLAPSE_TAG_NAME = "jb-collapse";

export function defineJBCollapse(): void {
  if (typeof globalThis.customElements === "undefined") return;
  if (!globalThis.customElements.get(JB_COLLAPSE_TAG_NAME)) {
    globalThis.customElements.define(JB_COLLAPSE_TAG_NAME, JBCollapseWebComponent);
  }
}

defineJBCollapse();
