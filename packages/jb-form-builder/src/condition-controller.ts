import type { JBConditionGroup, JBConditionValue } from "jb-condition";
import type { RuntimeJBForm } from "./types";

export interface RuntimeJBCondition extends HTMLElement {
  conditions: JBConditionGroup;
  value: JBConditionValue;
  readonly matched: boolean;
  refresh(): void;
  resetContent(): void;
}

export class ConditionController {
  readonly #form: RuntimeJBForm;
  #scheduled = false;
  #connected = false;

  constructor(form: RuntimeJBForm) {
    this.#form = form;
  }

  connect(): void {
    if (this.#connected) return;
    this.#connected = true;
    // Number-input control buttons update the component value before emitting
    // a non-bubbling `change` event. The click is the only form-level signal
    // for that interaction, so include it when scheduling condition refreshes.
    for (const eventName of ["input", "change", "form-change", "condition-change", "click"]) {
      this.#form.addEventListener(eventName, this.#schedule);
    }
    this.sync();
  }

  disconnect(): void {
    if (!this.#connected) return;
    this.#connected = false;
    for (const eventName of ["input", "change", "form-change", "condition-change", "click"]) {
      this.#form.removeEventListener(eventName, this.#schedule);
    }
  }

  sync(): void {
    this.#scheduled = false;
    if (!this.#connected) return;
    if (typeof this.#form.getFormValues !== "function") return;
    const value = this.#form.getFormValues();
    this.#conditions().forEach(condition => { condition.value = value; });
  }

  resetPreservedContent(): void {
    this.#conditions().forEach(condition => {
      if (typeof condition.resetContent === "function") condition.resetContent();
    });
    this.#schedule();
  }

  #conditions(): RuntimeJBCondition[] {
    return Array.from(this.#form.querySelectorAll<RuntimeJBCondition>("jb-condition"));
  }

  #schedule = (): void => {
    if (!this.#connected || this.#scheduled) return;
    this.#scheduled = true;
    queueMicrotask(() => this.sync());
  };
}
