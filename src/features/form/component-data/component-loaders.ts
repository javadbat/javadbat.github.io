import type { JBFormElementType } from "jb-form-builder/contract";

export const componentLoaders: Record<JBFormElementType, () => Promise<unknown>> = {
  text: () => Promise.resolve(),
  divider: () => Promise.resolve(),
  "section-heading": () => Promise.resolve(),
  image: () => Promise.resolve(),
  voice: () => Promise.resolve(),
  link: () => Promise.resolve(),
  "jb-input": () => import("jb-input"),
  "jb-number-input": () => import("jb-number-input"),
  "jb-range-input": () => import("jb-range-input"),
  "jb-mobile-input": () => import("jb-mobile-input"),
  "jb-password-input": () => import("jb-password-input"),
  "jb-payment-input": () => import("jb-payment-input"),
  "jb-national-input": () => import("jb-national-input"),
  "jb-date-input": () => import("jb-date-input"),
  "jb-time-input": () => import("jb-time-input"),
  "jb-pin-input": () => import("jb-pin-input"),
  "jb-textarea": () => import("jb-textarea"),
  // jb-select 8 publishes jb-option as a separate entry point. Preview loads
  // field dependencies lazily, so importing only the select entry would leave
  // its declarative options as unregistered HTML elements.
  "jb-select": () => Promise.all([import("jb-select"), import("jb-select/option")]),
  "jb-listbox": () => Promise.all([import("jb-select/listbox"), import("jb-checkbox")]),
  "jb-checkbox": () => import("jb-checkbox"),
  "jb-switch": () => import("jb-switch"),
  "jb-file-input": () => import("jb-file-input"),
  "jb-image-input": () => import("jb-image-input"),
  "jb-button": () => import("jb-button"),
  "jb-tab": () => import("jb-tab"),
  "jb-condition": () => import("jb-condition"),
  "jb-form-wizard": () => import("jb-form-wizard"),
  "jb-repeatable-group": async () => {
    // Repeatable controls are rendered by the framework rather than by a
    // document child, so load their design-system buttons alongside the
    // lightweight group host.
    await import("jb-button");
    if (!customElements.get("jb-repeatable-group")) customElements.define("jb-repeatable-group", class extends HTMLElement {});
  },
};

