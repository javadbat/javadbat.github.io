import type { FormValues, JBFormBuilderElement, JBFormBuilderEventMap, RendererValueDetail, RuntimeJBForm } from "./types";

export function dispatchRendererEvent<Name extends keyof JBFormBuilderEventMap>(
  host: JBFormBuilderElement,
  name: Name,
  detail: JBFormBuilderEventMap[Name]["detail"],
  cancelable = false,
): boolean {
  return host.dispatchEvent(
    new CustomEvent(name, {
      bubbles: true,
      composed: true,
      cancelable,
      detail,
    }),
  );
}

export class FormEventController {
  readonly #host: JBFormBuilderElement;
  readonly #form: RuntimeJBForm;
  readonly #getValues: () => FormValues;
  readonly #listeners: Array<{
    name: "input" | "change" | "submit";
    listener: EventListener;
  }>;
  constructor(host: JBFormBuilderElement, form: RuntimeJBForm, getValues: () => FormValues) {
    this.#host = host;
    this.#form = form;
    this.#getValues = getValues;
    this.#listeners = [
      { name: "input", listener: this.#forward.bind(this, "input") },
      { name: "change", listener: this.#forward.bind(this, "change") },
      { name: "submit", listener: this.#forward.bind(this, "submit") },
    ];
  }

  connect(): void {
    // Listeners live on the current jb-form rather than every child. This keeps
    // listener count constant as form size grows.
    for (const { name, listener } of this.#listeners) {
      this.#form.addEventListener(name, listener);
    }
  }

  disconnect(): void {
    for (const { name, listener } of this.#listeners) {
      this.#form.removeEventListener(name, listener);
    }
  }

  #forward(name: "input" | "change" | "submit", sourceEvent: Event): void {
    // jb-form consumes a trusted submit, validates, and emits a synthetic valid
    // submit. Forward only that second event to avoid duplicate host submits.
    if (name === "submit" && sourceEvent.isTrusted) {
      return;
    }
    // Stop the internal event at the Shadow boundary, then publish one stable,
    // composed host event whose target is always jb-form-builder.
    sourceEvent.stopPropagation();
    const detail: RendererValueDetail = {
      value: this.#getValues(),
      sourceEvent,
    };
    const accepted = dispatchRendererEvent(this.#host, name, detail, sourceEvent.cancelable);
    if (!accepted) {
      sourceEvent.preventDefault();
    }
  }
}
