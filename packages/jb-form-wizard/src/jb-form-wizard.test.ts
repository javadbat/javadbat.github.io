// @vitest-environment happy-dom

import { beforeEach, describe, expect, it, vi } from "vitest";
import { JBFormWizardWebComponent, defineJBFormWizard } from "./jb-form-wizard";

function createWizard(): JBFormWizardWebComponent {
  const wizard = document.createElement("jb-form-wizard") as JBFormWizardWebComponent;
  for (const label of ["Profile", "Review"]) {
    const step = document.createElement("section");
    step.dataset.wizardStep = "";
    step.dataset.stepLabel = label;
    wizard.append(step);
  }
  document.body.append(wizard);
  return wizard;
}

describe("jb-form-wizard", () => {
  beforeEach(() => {
    defineJBFormWizard();
    document.body.innerHTML = "";
  });

  it("shows one step and moves forward and backward", () => {
    const wizard = createWizard();
    const steps = Array.from(wizard.children) as HTMLElement[];
    expect(steps.map(step => step.hidden)).toEqual([false, true]);
    expect(wizard.next()).toBe(true);
    expect(steps.map(step => step.hidden)).toEqual([true, false]);
    expect(wizard.previous()).toBe(true);
    expect(wizard.activeStep).toBe(0);
  });

  it("places progress between the navigation buttons", () => {
    const wizard = createWizard();
    const navigation = wizard.shadowRoot?.querySelector(".navigation");

    expect(Array.from(navigation?.children ?? []).map(child => child.getAttribute("part"))).toEqual([
      "previous-button",
      "progress",
      "next-button",
      "completion-badge",
    ]);
  });

  it("uses the host-provided localized navigation label", () => {
    const wizard = createWizard();
    wizard.setAttribute("navigation-label", "پیمایش مراحل فرم");

    expect(wizard.shadowRoot?.querySelector("nav")?.getAttribute("aria-label")).toBe("پیمایش مراحل فرم");
  });

  it("keeps the step heading above the content and only the position in navigation", () => {
    const wizard = createWizard();
    const heading = wizard.shadowRoot?.querySelector("strong[part='step-heading']");
    const slot = wizard.shadowRoot?.querySelector("slot");
    const progress = wizard.shadowRoot?.querySelector("[part='progress']");

    expect(heading?.textContent).toBe("Profile");
    expect(heading?.nextElementSibling).toBe(slot);
    expect(progress?.textContent).toBe("1 / 2");
    expect(progress?.querySelector("strong")).toBeNull();
  });

  it("renders direction-aware arrow icons in both navigation buttons", () => {
    const wizard = createWizard();
    const previousIcon = wizard.shadowRoot?.querySelector(".previous jb-icon-arrow");
    const nextIcon = wizard.shadowRoot?.querySelector(".next jb-icon-arrow");

    expect(previousIcon?.getAttribute("direction")).toBe("inline-start");
    expect(nextIcon?.getAttribute("direction")).toBe("inline-end");
    expect(previousIcon?.getAttribute("aria-hidden")).toBe("true");
    expect(nextIcon?.getAttribute("aria-hidden")).toBe("true");
  });

  it("can show completion as a status badge instead of a button", () => {
    const wizard = createWizard();
    wizard.setAttribute("validation-mode", "none");
    wizard.setAttribute("completion-display", "status");
    wizard.next();

    expect((wizard.shadowRoot?.querySelector(".next") as HTMLElement | null)?.hidden).toBe(true);
    expect(wizard.shadowRoot?.querySelector(".next")?.hasAttribute("hidden")).toBe(true);
    expect(wizard.shadowRoot?.querySelector(".completion-badge")?.textContent).toBe("Complete");
    expect((wizard.shadowRoot?.querySelector(".completion-badge") as HTMLElement | null)?.hidden).toBe(false);
  });

  it("blocks forward navigation when the active step is invalid", () => {
    const wizard = createWizard();
    const control = document.createElement("input");
    control.required = true;
    wizard.children[0].append(control);
    expect(wizard.next()).toBe(false);
    expect(wizard.activeStep).toBe(0);
  });

  it("allows hosts to cancel a step change", () => {
    const wizard = createWizard();
    wizard.addEventListener("wizard-before-change", event => event.preventDefault());
    expect(wizard.next()).toBe(false);
    expect(wizard.activeStep).toBe(0);
  });

  it("emits completion on the last valid step", () => {
    const wizard = createWizard();
    const complete = vi.fn();
    wizard.addEventListener("wizard-complete", complete);
    wizard.validationMode = "none";
    expect(wizard.next()).toBe(true);
    expect(wizard.complete()).toBe(true);
    expect(complete).toHaveBeenCalledOnce();
  });
});
