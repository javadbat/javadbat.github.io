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
