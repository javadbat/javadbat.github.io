import type {
  JBFormWizardBeforeChangeDetail,
  JBFormWizardChangeDetail,
  JBFormWizardCompleteDetail,
  JBFormWizardValidationMode,
} from "./types.js";
import "jb-button";
import "jb-icons/arrow";

export const JB_FORM_WIZARD_TAG_NAME = "jb-form-wizard" as const;

type ValidatableElement = HTMLElement & {
  disabled?: boolean;
  reportValidity?: () => boolean;
};

export class JBFormWizardWebComponent extends HTMLElement {
  #activeStep = 0;
  #observer: MutationObserver;
  #heading: HTMLElement;
  #progress: HTMLOutputElement;
  #previousButton: HTMLElementTagNameMap["jb-button"];
  #nextButton: HTMLElementTagNameMap["jb-button"];
  #previousLabel: HTMLSpanElement;
  #nextLabel: HTMLSpanElement;
  #completionBadge: HTMLSpanElement;

  constructor() {
    super();
    const root = this.attachShadow({ mode: "open" });
    const style = document.createElement("style");
    style.textContent = `:host{display:block}.step-heading{display:block;margin-block-end:1rem;color:var(--jb-form-wizard-color,currentColor)}.step-heading[hidden]{display:none}.progress{display:flex;flex:1;align-items:baseline;justify-content:center;margin:0;color:var(--jb-form-wizard-muted,currentColor)}.navigation{display:flex;gap:.75rem;align-items:center;margin-block-start:1rem}.navigation jb-button{flex:none}.navigation jb-button[hidden]{display:none}.navigation jb-button jb-icon-arrow{flex:none;transition:transform .2s ease}.navigation jb-button.previous:hover jb-icon-arrow{transform:translateX(-.2rem)}.navigation jb-button.next:hover jb-icon-arrow{transform:translateX(.2rem)}:host-context([dir=rtl]) .navigation jb-button.previous:hover jb-icon-arrow{transform:translateX(.2rem)}:host-context([dir=rtl]) .navigation jb-button.next:hover jb-icon-arrow{transform:translateX(-.2rem)}.completion-badge{display:inline-flex;align-items:center;min-block-size:2.25rem;border:.0625rem dashed color-mix(in srgb,var(--jb-primary,currentColor) 38%,transparent);border-radius:999px;padding:.35rem .75rem;color:color-mix(in srgb,var(--jb-primary,currentColor) 72%,currentColor);background:color-mix(in srgb,var(--jb-primary,currentColor) 8%,transparent);font-size:.875em;font-weight:600}.completion-badge[hidden]{display:none}@media (prefers-reduced-motion:reduce){.navigation jb-button jb-icon-arrow{transition:none}}`;
    this.#heading = document.createElement("strong");
    this.#heading.className = "step-heading";
    this.#heading.setAttribute("part", "step-heading");
    this.#progress = document.createElement("output");
    this.#progress.className = "progress";
    this.#progress.setAttribute("part", "progress");
    this.#progress.setAttribute("aria-live", "polite");
    const slot = document.createElement("slot");
    const navigation = document.createElement("nav");
    navigation.className = "navigation";
    navigation.setAttribute("part", "navigation");
    navigation.setAttribute("aria-label", "Wizard navigation");
    this.#previousButton = document.createElement("jb-button");
    this.#previousButton.setAttribute("type", "button");
    this.#previousButton.setAttribute("variant", "outline");
    this.#previousButton.setAttribute("color", "secondary");
    this.#previousButton.className = "previous";
    this.#previousButton.setAttribute("part", "previous-button");
    this.#previousButton.addEventListener("click", () => this.previous());
    this.#previousLabel = document.createElement("span");
    const previousIcon = document.createElement("jb-icon-arrow");
    previousIcon.setAttribute("direction", "inline-start");
    previousIcon.setAttribute("size", "sm");
    previousIcon.setAttribute("aria-hidden", "true");
    this.#previousButton.append(previousIcon, this.#previousLabel);
    this.#nextButton = document.createElement("jb-button");
    this.#nextButton.setAttribute("type", "button");
    this.#nextButton.setAttribute("variant", "solid");
    this.#nextButton.setAttribute("color", "primary");
    this.#nextButton.className = "next";
    this.#nextButton.dataset.primary = "";
    this.#nextButton.setAttribute("part", "next-button");
    this.#nextButton.addEventListener("click", () => {
      if (this.#activeStep === this.stepCount - 1) this.complete();
      else this.next();
    });
    this.#nextLabel = document.createElement("span");
    const nextIcon = document.createElement("jb-icon-arrow");
    nextIcon.setAttribute("direction", "inline-end");
    nextIcon.setAttribute("size", "sm");
    nextIcon.setAttribute("aria-hidden", "true");
    this.#nextButton.append(this.#nextLabel, nextIcon);
    this.#completionBadge = document.createElement("span");
    this.#completionBadge.className = "completion-badge";
    this.#completionBadge.setAttribute("part", "completion-badge");
    this.#completionBadge.setAttribute("role", "status");
    this.#completionBadge.hidden = true;
    navigation.append(this.#previousButton, this.#progress, this.#nextButton, this.#completionBadge);
    root.append(style, this.#heading, slot, navigation);
    this.#observer = new MutationObserver(() => this.#sync());
  }

  static get observedAttributes(): string[] {
    return ["active-step", "validation-mode", "previous-label", "next-label", "complete-label", "completion-display"];
  }

  connectedCallback(): void {
    this.#observer.observe(this, { childList: true, subtree: false, attributes: true, attributeFilter: ["data-step-label"] });
    this.#sync();
  }

  disconnectedCallback(): void {
    this.#observer.disconnect();
  }

  attributeChangedCallback(name: string): void {
    if (name === "active-step") {
      const requested = Number(this.getAttribute("active-step"));
      if (Number.isInteger(requested)) this.#activeStep = requested;
    }
    if (this.isConnected) this.#sync();
  }

  get activeStep(): number {
    return this.#activeStep;
  }

  set activeStep(value: number) {
    this.goTo(value);
  }

  get stepCount(): number {
    return this.#steps().length;
  }

  get validationMode(): JBFormWizardValidationMode {
    return this.getAttribute("validation-mode") === "none" ? "none" : "current";
  }

  set validationMode(value: JBFormWizardValidationMode) {
    this.setAttribute("validation-mode", value === "none" ? "none" : "current");
  }

  next(): boolean {
    if (this.#activeStep >= this.stepCount - 1 || !this.#validateActiveStep()) return false;
    return this.#changeStep(this.#activeStep + 1, "next");
  }

  previous(): boolean {
    if (this.#activeStep <= 0) return false;
    return this.#changeStep(this.#activeStep - 1, "previous");
  }

  goTo(step: number): boolean {
    const target = Math.max(0, Math.min(Math.trunc(step), Math.max(0, this.stepCount - 1)));
    if (target === this.#activeStep) {
      this.#sync();
      return true;
    }
    if (target > this.#activeStep && !this.#validateActiveStep()) return false;
    return this.#changeStep(target, "programmatic");
  }

  reset(): void {
    const previousStep = this.#activeStep;
    this.#activeStep = 0;
    this.#sync();
    if (previousStep !== 0) this.#dispatchChange(previousStep, "programmatic");
  }

  complete(): boolean {
    if (this.stepCount === 0 || this.#activeStep !== this.stepCount - 1 || !this.#validateActiveStep()) return false;
    this.dispatchEvent(new CustomEvent<JBFormWizardCompleteDetail>("wizard-complete", {
      bubbles: true,
      composed: true,
      detail: { activeStep: this.#activeStep, stepCount: this.stepCount },
    }));
    return true;
  }

  #steps(): HTMLElement[] {
    return Array.from(this.children).filter((child): child is HTMLElement => child instanceof HTMLElement && child.hasAttribute("data-wizard-step"));
  }

  #changeStep(target: number, direction: JBFormWizardChangeDetail["direction"]): boolean {
    const previousStep = this.#activeStep;
    const detail: JBFormWizardBeforeChangeDetail = { previousStep, activeStep: target, direction };
    const allowed = this.dispatchEvent(new CustomEvent<JBFormWizardBeforeChangeDetail>("wizard-before-change", {
      bubbles: true,
      composed: true,
      cancelable: true,
      detail,
    }));
    if (!allowed) return false;
    this.#activeStep = target;
    this.#sync();
    this.#dispatchChange(previousStep, direction);
    this.#steps()[target]?.focus({ preventScroll: true });
    return true;
  }

  #dispatchChange(previousStep: number, direction: JBFormWizardChangeDetail["direction"]): void {
    this.dispatchEvent(new CustomEvent<JBFormWizardChangeDetail>("wizard-change", {
      bubbles: true,
      composed: true,
      detail: { previousStep, activeStep: this.#activeStep, direction },
    }));
  }

  #validateActiveStep(): boolean {
    if (this.validationMode === "none") return true;
    const active = this.#steps()[this.#activeStep];
    if (!active) return true;
    let valid = true;
    for (const control of active.querySelectorAll<ValidatableElement>("[data-form-element-id],input,select,textarea")) {
      if (control.disabled || typeof control.reportValidity !== "function") continue;
      if (!control.reportValidity()) valid = false;
    }
    return valid;
  }

  #sync(): void {
    const steps = this.#steps();
    this.#activeStep = Math.max(0, Math.min(this.#activeStep, Math.max(0, steps.length - 1)));
    steps.forEach((step, index) => {
      const active = index === this.#activeStep;
      step.hidden = !active;
      step.setAttribute("role", "group");
      step.setAttribute("aria-hidden", String(!active));
      step.setAttribute("aria-label", step.dataset.stepLabel || `Step ${index + 1}`);
      step.tabIndex = -1;
      this.#setStepEnabled(step, active);
    });
    const currentLabel = steps[this.#activeStep]?.dataset.stepLabel || `Step ${this.#activeStep + 1}`;
    this.#heading.textContent = steps.length > 0 ? currentLabel : "";
    this.#heading.hidden = steps.length === 0;
    this.#progress.textContent = steps.length > 0 ? `${this.#activeStep + 1} / ${steps.length}` : "";
    this.#previousLabel.textContent = this.getAttribute("previous-label") ?? "Previous";
    this.#previousButton.disabled = this.#activeStep === 0 || steps.length === 0;
    const isLast = steps.length > 0 && this.#activeStep === steps.length - 1;
    const completeLabel = this.getAttribute("complete-label") ?? "Complete";
    const statusCompletion = isLast && this.getAttribute("completion-display") === "status";
    this.#nextLabel.textContent = isLast ? completeLabel : this.getAttribute("next-label") ?? "Next";
    this.#nextButton.hidden = statusCompletion;
    this.#nextButton.disabled = steps.length === 0 || statusCompletion;
    this.#completionBadge.textContent = completeLabel;
    this.#completionBadge.hidden = !statusCompletion;
    const serializedActiveStep = String(this.#activeStep);
    if (this.getAttribute("active-step") !== serializedActiveStep) {
      this.setAttribute("active-step", serializedActiveStep);
    }
  }

  #setStepEnabled(step: HTMLElement, enabled: boolean): void {
    for (const control of step.querySelectorAll<ValidatableElement>("[data-form-element-id],input,select,textarea,button")) {
      if (!control.dataset.wizardDocumentDisabled) control.dataset.wizardDocumentDisabled = String(control.disabled === true);
      const nextDisabled = control.dataset.wizardDocumentDisabled === "true" || !enabled;
      control.disabled = nextDisabled;
      control.toggleAttribute("disabled", nextDisabled);
    }
  }
}

export function defineJBFormWizard(): void {
  if (typeof globalThis.HTMLElement === "undefined" || typeof globalThis.customElements === "undefined") return;
  if (!globalThis.customElements.get(JB_FORM_WIZARD_TAG_NAME)) globalThis.customElements.define(JB_FORM_WIZARD_TAG_NAME, JBFormWizardWebComponent);
}

defineJBFormWizard();
