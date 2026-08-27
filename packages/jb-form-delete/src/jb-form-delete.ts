import type { JBFormDeleteRequestEvent } from "./index.js";

export const JB_FORM_DELETE_TAG_NAME = "jb-form-delete" as const;

export class JBFormDeleteWebComponent extends HTMLElement {
  #button: HTMLButtonElement;

  constructor() {
    super();
    const root = this.attachShadow({ mode: "open" });
    const style = document.createElement("style");
    style.textContent = `:host{display:inline-block}button{min-block-size:2.75rem;min-inline-size:2.75rem;border:0;border-radius:.5rem;padding:.5rem .75rem;color:var(--jb-form-delete-color,#a61b1b);background:var(--jb-form-delete-background,transparent);cursor:pointer;font:inherit}button:hover{background:var(--jb-form-delete-hover-background,#fff0f0)}button:focus-visible{outline:.2rem solid currentColor;outline-offset:.15rem}button:disabled{cursor:not-allowed;opacity:.55}`;
    this.#button = document.createElement("button");
    this.#button.type = "button";
    this.#button.addEventListener("click", () => this.#requestDelete());
    root.append(style, this.#button);
  }

  static get observedAttributes(): string[] { return ["form-id", "label", "disabled"]; }
  attributeChangedCallback(): void { this.#syncButton(); }
  connectedCallback(): void { this.#syncButton(); }

  get formId(): string { return this.getAttribute("form-id") ?? ""; }
  set formId(value: string) { this.setAttribute("form-id", value); }

  #syncButton(): void {
    const label = this.getAttribute("label") ?? "Delete form";
    this.#button.textContent = label;
    this.#button.setAttribute("aria-label", label);
    this.#button.disabled = this.hasAttribute("disabled") || this.formId.length === 0;
  }

  #requestDelete(): void {
    if (!this.formId) return;
    this.dispatchEvent(new CustomEvent("delete-request", { bubbles: true, composed: true, detail: { formId: this.formId } }) as JBFormDeleteRequestEvent);
  }
}

export function defineJBFormDelete(): void {
  if (typeof globalThis.HTMLElement === "undefined" || typeof globalThis.customElements === "undefined") return;
  if (!globalThis.customElements.get(JB_FORM_DELETE_TAG_NAME)) globalThis.customElements.define(JB_FORM_DELETE_TAG_NAME, JBFormDeleteWebComponent);
}

defineJBFormDelete();
