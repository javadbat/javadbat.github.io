import { JBFormBuilderWebComponent } from "./jb-form-builder";

export const JB_FORM_BUILDER_TAG_NAME = "jb-form-builder" as const;

export function defineJBFormBuilder(): void {
  // Do not reference browser constructors unless they exist. Today this keeps
  // tests and build tooling safe; it is also the registration seam for future
  // SSR consumers that emit an inert <jb-form-builder> tag on the server.
  if (typeof globalThis.HTMLElement === "undefined" || typeof globalThis.customElements === "undefined") {
    return;
  }
  // Custom-element registries reject duplicate names. Checking first also lets
  // host applications own registration order without an exception.
  if (!globalThis.customElements.get(JB_FORM_BUILDER_TAG_NAME)) {
    globalThis.customElements.define(JB_FORM_BUILDER_TAG_NAME, JBFormBuilderWebComponent);
  }
}
