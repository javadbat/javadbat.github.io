import { describe, expect, it } from "vitest";
import { createEmptyFormDocument } from "../../domain/form-document";
import { formElementRegistry } from "../../registry/form-element-registry";
import { BuilderDraftStore } from "./BuilderDraftStore";
import { BuilderElementStore } from "./BuilderElementStore";

function createStores() {
  const document = createEmptyFormDocument();
  const draft = new BuilderDraftStore(document);
  return { document, draft, elements: new BuilderElementStore(draft) };
}

describe("BuilderElementStore", () => {
  it("adds uniquely named elements and manages selection", () => {
    const { elements } = createStores();
    const entry = formElementRegistry[0];

    const firstId = elements.add(entry);
    const secondId = elements.add(entry, 0);

    expect(elements.all.map(element => element.id)).toEqual([secondId, firstId]);
    expect(elements.all[1].name).toBe(entry.defaultName);
    expect(elements.all[0].name).toBe(`${entry.defaultName}_2`);
    expect(elements.selected?.id).toBe(secondId);
    expect(elements.select("missing-id")).toBe(false);
  });

  it("creates new element defaults in the form default locale", () => {
    const document = createEmptyFormDocument();
    document.localization = { defaultLocale: "fa", locales: { fa: { direction: "rtl" } } };
    const elements = new BuilderElementStore(new BuilderDraftStore(document));
    const inputEntry = formElementRegistry.find(entry => entry.type === "jb-input")!;
    const buttonEntry = formElementRegistry.find(entry => entry.type === "jb-button")!;

    elements.add(inputEntry);
    expect(elements.selected?.label?.translations).toEqual({ fa: "ورودی متن" });
    expect(elements.selected?.placeholder?.translations).toEqual({ fa: "ورودی متن را وارد کنید" });

    elements.add(buttonEntry);
    expect(elements.selected?.props.content).toEqual({ translations: { fa: "ارسال" } });
    expect(elements.selected?.props.loadingText).toEqual({ translations: { fa: "لطفاً صبر کنید" } });
  });

  it("creates localized component defaults for every supported locale", () => {
    const document = createEmptyFormDocument();
    document.localization.locales.fa = { direction: "rtl" };
    const elements = new BuilderElementStore(new BuilderDraftStore(document));
    const textEntry = formElementRegistry.find(entry => entry.type === "text")!;

    elements.add(textEntry);

    expect((elements.selected?.props.content as { translations: Record<string, string> }).translations).toEqual({ en: "Text", fa: "متن" });
  });

  it("updates the selected element and its component properties", () => {
    const { elements } = createStores();
    elements.add(formElementRegistry[0]);

    expect(elements.updateSelected({ name: "renamedField", required: true })).toBe(true);
    expect(elements.updateSelectedProp("custom", { nested: ["value"] })).toBe(true);
    expect(elements.selected).toMatchObject({ name: "renamedField", required: true, props: { custom: { nested: ["value"] } } });

    elements.updateSelectedProp("custom", undefined);
    expect(elements.selected?.props).not.toHaveProperty("custom");
  });

  it("reorders, duplicates, and removes elements while preserving selection rules", () => {
    const { elements } = createStores();
    const firstId = elements.add(formElementRegistry[0]);
    const secondId = elements.add(formElementRegistry[1]);

    expect(elements.moveBy(secondId, -1)).toBe(0);
    expect(elements.all.map(element => element.id)).toEqual([secondId, firstId]);

    const duplicateId = elements.duplicate(secondId);
    expect(duplicateId).not.toBeNull();
    expect(duplicateId).not.toBe(secondId);
    expect(elements.selectedElementId).toBe(duplicateId);
    expect(elements.remove(duplicateId!)).toBe(firstId);
    expect(elements.remove(firstId)).toBe(secondId);
    expect(elements.remove(secondId)).toBeNull();
  });

  it("follows parent document replacements and reconciles selection", () => {
    const { draft, elements } = createStores();
    const selectedId = elements.add(formElementRegistry[0]);

    draft.hydrate(createEmptyFormDocument());
    elements.reconcileSelection();

    expect(elements.all).toBe(draft.document.elements);
    expect(elements.selectedElementId).toBeNull();
    expect(elements.select(selectedId)).toBe(false);
  });
});
