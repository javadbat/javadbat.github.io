import { evaluateConditions } from "./evaluate.js";
import type { JBConditionChangeEvent, JBConditionGroup, JBConditionValue } from "./types.js";

const emptyConditions = (): JBConditionGroup => ({ match: "all", rules: [] });

const HTMLElementBase = globalThis.HTMLElement ?? class {};

export class JBConditionWebComponent extends HTMLElementBase {
  #conditions = emptyConditions();
  #value: JBConditionValue = {};
  #matched = true;
  #preservedContent = new DocumentFragment();
  #observer: MutationObserver | null = null;
  #movingContent = false;

  constructor() {
    super();
    const root = this.attachShadow({ mode: "open", clonable: true, serializable: true });
    const style = document.createElement("style");
    style.textContent = ":host{display:contents}";
    root.append(style, document.createElement("slot"));
  }

  connectedCallback(): void {
    this.#observeChildren();
    this.#applyMatch(false);
  }

  disconnectedCallback(): void {
    this.#observer?.disconnect();
  }

  get conditions(): JBConditionGroup {
    return structuredClone(this.#conditions);
  }

  set conditions(value: JBConditionGroup) {
    this.#conditions = value && (value.match === "all" || value.match === "any") && Array.isArray(value.rules)
      ? structuredClone(value)
      : emptyConditions();
    this.#evaluate();
  }

  get value(): JBConditionValue {
    return this.#value;
  }

  set value(value: JBConditionValue) {
    this.#value = value && typeof value === "object" ? value : {};
    this.#evaluate();
  }

  get matched(): boolean {
    return this.#matched;
  }

  refresh(): void {
    this.#evaluate();
  }

  /** Reset preserved controls that are currently disconnected from an owning form. */
  resetContent(): void {
    if (this.#matched) return;
    const elements = Array.from(this.#preservedContent.querySelectorAll<HTMLElement>("*"));
    for (const element of elements) {
      const formControl = element as HTMLElement & { formResetCallback?: () => void };
      if (typeof formControl.formResetCallback === "function") {
        formControl.formResetCallback();
      } else if (element instanceof HTMLInputElement) {
        if (element.type === "checkbox" || element.type === "radio") element.checked = element.defaultChecked;
        else if (element.type !== "file") element.value = element.defaultValue;
        else element.value = "";
      } else if (element instanceof HTMLTextAreaElement) {
        element.value = element.defaultValue;
      } else if (element instanceof HTMLSelectElement) {
        Array.from(element.options).forEach(option => { option.selected = option.defaultSelected; });
      }
    }
  }

  #evaluate(): void {
    this.#setMatched(evaluateConditions(this.#value, this.#conditions));
  }

  #setMatched(matched: boolean): void {
    const changed = matched !== this.#matched;
    this.#matched = matched;
    if (this.isConnected) this.#applyMatch(changed);
  }

  #applyMatch(dispatchChange: boolean): void {
    this.toggleAttribute("matched", this.#matched);
    this.#movingContent = true;
    if (this.#matched) {
      this.append(this.#preservedContent);
    } else {
      while (this.firstChild) this.#preservedContent.append(this.firstChild);
    }
    this.#movingContent = false;
    if (dispatchChange) {
      this.dispatchEvent(new CustomEvent("condition-change", {
        bubbles: true,
        composed: true,
        detail: { matched: this.#matched },
      }) as JBConditionChangeEvent);
    }
  }

  #observeChildren(): void {
    this.#observer?.disconnect();
    this.#observer = new MutationObserver(records => {
      if (this.#movingContent || this.#matched) return;
      const addedNodes = records.flatMap(record => Array.from(record.addedNodes));
      if (addedNodes.length === 0) return;
      this.#movingContent = true;
      for (const node of addedNodes) this.#preservedContent.append(node);
      this.#movingContent = false;
    });
    this.#observer.observe(this, { childList: true });
  }
}

if (typeof globalThis.customElements !== "undefined" && !globalThis.customElements.get("jb-condition")) {
  globalThis.customElements.define("jb-condition", JBConditionWebComponent as CustomElementConstructor);
}
