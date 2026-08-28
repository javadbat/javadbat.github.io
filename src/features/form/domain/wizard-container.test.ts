import { describe, expect, it } from "vitest";
import { getRequiredDependencies } from "jb-form-builder/dependency-loader";
import { BuilderStore } from "../builder/store/BuilderStore";
import { registryByType } from "jb-form-builder/registry/form-element-registry";
import { isWizardElement } from "./form-document";
import { validateFormDocument } from "./form-document-validation";

describe("jb-form-wizard container contract", () => {
  it("owns ordered leaf-only steps and remains optional", () => {
    const store = new BuilderStore();
    const wizardEntry = registryByType.get("jb-form-wizard")!;
    const inputEntry = registryByType.get("jb-input")!;
    const wizard = store.findElement(store.addElement(wizardEntry))!;
    expect(isWizardElement(wizard)).toBe(true);
    if (!isWizardElement(wizard)) return;

    const childId = store.addElementToWizard(wizard.id, wizard.steps[0].id, inputEntry);
    expect(wizard.steps[0].children.map(child => child.id)).toEqual([childId]);
    expect(store.addElementToWizard(wizard.id, wizard.steps[0].id, wizardEntry)).toBeNull();
    expect(validateFormDocument(store.createDocumentSnapshot())).toMatchObject({ valid: true });
    expect(getRequiredDependencies(store.document).map(dependency => dependency.packageName)).toEqual(["jb-form", "jb-form-wizard", "jb-input"]);

    const plainStore = new BuilderStore();
    plainStore.addElement(inputEntry);
    expect(getRequiredDependencies(plainStore.document).map(dependency => dependency.packageName)).toEqual(["jb-form", "jb-input"]);
  });

  it("rejects duplicate step ids and stable values", () => {
    const store = new BuilderStore();
    const wizard = store.findElement(store.addElement(registryByType.get("jb-form-wizard")!))!;
    if (!isWizardElement(wizard)) throw new Error("Expected wizard container");
    wizard.steps[1].id = wizard.steps[0].id;
    wizard.steps[1].value = wizard.steps[0].value;

    const result = validateFormDocument(store.createDocumentSnapshot());
    expect(result.valid).toBe(false);
    expect(result.issues.map(issue => issue.code)).toEqual(expect.arrayContaining(["duplicate_wizard_step_id", "duplicate_wizard_step_value"]));
  });
});
