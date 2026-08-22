import { describe, expect, it } from "vitest";
import { BuilderStore } from "../builder/store/BuilderStore";
import { validateFormDocument } from "./form-document-validation";
import { isContainerElement } from "./form-document";
import { registryByType } from "../registry/form-element-registry";
import { getRequiredDependencies } from "../renderer/jb-form-builder/dependency-loader";

describe("jb-tab container contract", () => {
  it("owns one level of leaf children and validates recursively", () => {
    const store = new BuilderStore();
    const tabEntry = registryByType.get("jb-tab")!;
    const inputEntry = registryByType.get("jb-input")!;
    const containerId = store.addElement(tabEntry);
    const container = store.findElement(containerId)!;
    expect(isContainerElement(container)).toBe(true);
    if (!isContainerElement(container)) return;

    const childId = store.addElementToTab(container.id, container.tabs[0].id, inputEntry);
    expect(childId).toBeTruthy();
    expect(container.tabs[0].children.map(child => child.id)).toEqual([childId]);
    expect(store.addElementToTab(container.id, container.tabs[0].id, tabEntry)).toBeNull();
    expect(validateFormDocument(store.createDocumentSnapshot())).toMatchObject({ valid: true });

    const dependencyNames = getRequiredDependencies(store.document).map(dependency => dependency.packageName);
    expect(dependencyNames).toEqual(["jb-form", "jb-tab", "jb-input"]);
  });

  it("rejects duplicate tab values and a missing default tab", () => {
    const store = new BuilderStore();
    const container = store.findElement(store.addElement(registryByType.get("jb-tab")!))!;
    if (!isContainerElement(container)) throw new Error("Expected tab container");
    container.tabs[1].value = container.tabs[0].value;
    container.props.defaultValue = "missing";

    const result = validateFormDocument(store.createDocumentSnapshot());
    expect(result.valid).toBe(false);
    expect(result.issues.map(issue => issue.code)).toEqual(expect.arrayContaining(["duplicate_tab_value", "unknown_default_tab"]));
  });
});
