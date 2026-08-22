import { describe, expect, it } from "vitest";
import { BuilderStore } from "../builder/store/BuilderStore";
import { registryByType } from "../registry/form-element-registry";
import { getRequiredDependencies } from "../renderer/jb-form-builder/dependency-loader";
import { isConditionElement } from "./form-document";
import { validateFormDocument } from "./form-document-validation";

describe("jb-condition container contract", () => {
  it("stores leaf children and portable field-name conditions", () => {
    const store = new BuilderStore();
    store.addElement(registryByType.get("jb-input")!);
    const container = store.findElement(store.addElement(registryByType.get("jb-condition")!))!;
    expect(isConditionElement(container)).toBe(true);
    if (!isConditionElement(container)) return;
    const childId = store.addElementToCondition(container.id, registryByType.get("jb-input")!);
    store.selectElement(container.id);
    store.addSelectedConditionRule("text");

    expect(container.children.map(child => child.id)).toEqual([childId]);
    expect(container.conditions).toMatchObject({ match: "all", rules: [{ fieldName: "text", operator: "equals" }] });
    expect(validateFormDocument(store.createDocumentSnapshot())).toMatchObject({ valid: true });
    expect(getRequiredDependencies(store.document).map(dependency => dependency.packageName)).toEqual(["jb-form", "jb-input", "jb-condition"]);
  });

  it("rejects self references and conditional dependency cycles", () => {
    const store = new BuilderStore();
    const first = store.findElement(store.addElement(registryByType.get("jb-condition")!))!;
    const second = store.findElement(store.addElement(registryByType.get("jb-condition")!))!;
    if (!isConditionElement(first) || !isConditionElement(second)) throw new Error("Expected conditional containers");
    store.addElementToCondition(first.id, registryByType.get("jb-input")!);
    store.addElementToCondition(second.id, registryByType.get("jb-input")!);
    first.children[0].name = "firstSource";
    second.children[0].name = "secondSource";
    first.conditions.rules.push({ id: crypto.randomUUID(), fieldName: "secondSource", operator: "isNotEmpty" });
    second.conditions.rules.push({ id: crypto.randomUUID(), fieldName: "firstSource", operator: "isNotEmpty" });

    const cyclic = validateFormDocument(store.createDocumentSnapshot());
    expect(cyclic.valid).toBe(false);
    expect(cyclic.issues.map(issue => issue.code)).toContain("cyclic_condition_dependency");

    second.conditions.rules[0].fieldName = "secondSource";
    const selfReferenced = validateFormDocument(store.createDocumentSnapshot());
    expect(selfReferenced.issues.map(issue => issue.code)).toContain("self_condition_reference");
  });

  it("rejects non-value sources and missing comparison values", () => {
    const store = new BuilderStore();
    const text = store.findElement(store.addElement(registryByType.get("text")!))!;
    const container = store.findElement(store.addElement(registryByType.get("jb-condition")!))!;
    if (!isConditionElement(container)) throw new Error("Expected conditional container");
    container.conditions.rules.push({ id: crypto.randomUUID(), fieldName: text.name, operator: "equals" });

    const result = validateFormDocument(store.createDocumentSnapshot());
    expect(result.issues.map(issue => issue.code)).toEqual(expect.arrayContaining(["missing_condition_value", "unknown_condition_field"]));
  });
});
