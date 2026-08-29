import type { JBCollapseChangeEvent, JBCollapseVariant } from "./types.js";

const HTMLElementBase = (globalThis.HTMLElement ?? class {}) as typeof HTMLElement;
let collapseId = 0;

const templateHtml = `
  <style>
    :host {
      --jb-collapse-ink: var(--form-ink, var(--designer-ink, #101b48));
      --jb-collapse-line: var(--form-inner-line, var(--designer-line, #dde2ef));
      --jb-collapse-surface: var(--form-surface, #fff);
      --jb-collapse-accent: var(--form-accent, var(--designer-blue, #2455e8));
      display: block;
      min-inline-size: 0;
    }
    fieldset {
      min-inline-size: 0;
      margin: 0;
      padding: 0.85rem;
      overflow: auto;
      overscroll-behavior: contain;
      scrollbar-gutter: stable;
      scrollbar-width: thin;
      border: 0.0625rem solid var(--jb-collapse-line);
      border-radius: 0.75rem;
      background: var(--jb-collapse-surface);
      box-shadow: none;
      corner-shape: squircle;
    }
    :host([variant="flush"]) fieldset {
      padding: 0;
      overflow: visible;
      border: 0;
      border-block-end: 0.0625rem solid var(--jb-collapse-line);
      border-radius: 0;
    }
    legend {
      box-sizing: border-box;
      inline-size: 100%;
      max-inline-size: 100%;
      padding: 0;
    }
    button {
      display: inline-flex;
      gap: 0.35rem;
      align-items: center;
      justify-content: flex-start;
      inline-size: 100%;
      max-inline-size: 100%;
      min-block-size: 2rem;
      padding: 0.2rem 0;
      border: 0;
      border-radius: 0.6rem;
      color: var(--jb-collapse-ink);
      background: transparent;
      font: inherit;
      font-size: 0.68rem;
      font-weight: 750;
      line-height: 1.3;
      text-align: start;
      cursor: pointer;
    }
    :host([variant="flush"]) button {
      gap: 0.45rem;
      min-block-size: 3.35rem;
      padding: 0.8rem 1.8rem;
      border-radius: 0;
      font-size: 0.9rem;
      font-weight: 680;
    }
    button:hover {
      color: var(--jb-collapse-accent);
      background: color-mix(in srgb, var(--jb-collapse-accent) 5%, transparent);
    }
    button:focus-visible {
      color: var(--jb-collapse-accent);
      outline: 0.125rem solid color-mix(in srgb, var(--jb-collapse-accent) 30%, transparent);
      outline-offset: -0.125rem;
    }
    .icon {
      display: inline-flex;
      flex: 0 0 auto;
      inline-size: 0.55rem;
      block-size: 0.55rem;
      color: currentcolor;
      transition: transform 180ms ease;
    }
    .icon svg {
      display: block;
      inline-size: 100%;
      block-size: 100%;
      fill: currentcolor;
    }
    :host([open]) .icon { transform: rotate(90deg); }
    .content {
      display: grid;
      grid-template-rows: 0fr;
      opacity: 0;
      transition: grid-template-rows 240ms cubic-bezier(0.2, 0, 0, 1), opacity 180ms ease;
    }
    :host([open]) .content {
      grid-template-rows: 1fr;
      opacity: 1;
    }
    .content-inner {
      min-block-size: 0;
      overflow: hidden;
    }
    :host(:not([variant="flush"])) .content-inner { padding-block-start: 0.65rem; }
    @media (max-width: 63.999rem) {
      :host(:not([variant="flush"])) { margin-block-end: 0.75rem; }
    }
    @media (max-width: 40rem) {
      :host([variant="flush"]) button { padding-inline: 1rem; }
    }
    @media (prefers-reduced-motion: reduce) {
      .content, .icon { transition: none; }
    }
  </style>
  <fieldset part="section">
    <legend part="legend">
      <button part="toggle" type="button">
        <span class="icon" part="icon" aria-hidden="true">
          <svg viewBox="0 0 10 10" focusable="false"><path d="M2 1.5 8 5 2 8.5Z" /></svg>
        </span>
        <slot name="title"></slot>
      </button>
    </legend>
    <div class="content" part="content">
      <div class="content-inner" part="content-inner"><slot></slot></div>
    </div>
  </fieldset>
`;

export class JBCollapseWebComponent extends HTMLElementBase {
  static observedAttributes = ["open", "variant"];

  #button: HTMLButtonElement;
  #content: HTMLDivElement;
  #defaultOpen = false;
  #initialized = false;

  constructor() {
    super();
    const template = document.createElement("template");
    template.innerHTML = templateHtml;
    const root = this.attachShadow({ mode: "open" });
    root.append(template.content.cloneNode(true));
    this.#button = root.querySelector("button")!;
    this.#content = root.querySelector(".content")!;
    this.#button.addEventListener("click", () => this.#toggle());
  }

  connectedCallback(): void {
    if (!this.#initialized) {
      this.#initialized = true;
      if (this.#defaultOpen && !this.hasAttribute("open")) this.open = true;
    }
    this.#syncAccessibility();
  }

  attributeChangedCallback(): void {
    this.#syncAccessibility();
  }

  get open(): boolean {
    return this.hasAttribute("open");
  }

  set open(value: boolean) {
    this.toggleAttribute("open", Boolean(value));
  }

  get defaultOpen(): boolean {
    return this.#defaultOpen;
  }

  set defaultOpen(value: boolean) {
    this.#defaultOpen = Boolean(value);
    if (!this.#initialized && this.#defaultOpen) this.open = true;
  }

  get variant(): JBCollapseVariant {
    return this.getAttribute("variant") === "flush" ? "flush" : "card";
  }

  set variant(value: JBCollapseVariant) {
    this.setAttribute("variant", value === "flush" ? "flush" : "card");
  }

  #toggle(): void {
    this.open = !this.open;
    this.dispatchEvent(new CustomEvent("collapse-change", {
      bubbles: true,
      composed: true,
      detail: { open: this.open },
    }) as JBCollapseChangeEvent);
  }

  #syncAccessibility(): void {
    if (!this.#button || !this.#content) return;
    const contentId = this.#content.id || `jb-collapse-${++collapseId}`;
    this.#content.id = contentId;
    this.#button.setAttribute("aria-expanded", String(this.open));
    this.#button.setAttribute("aria-controls", contentId);
    this.#content.setAttribute("aria-hidden", String(!this.open));
    this.#content.inert = !this.open;
  }
}
