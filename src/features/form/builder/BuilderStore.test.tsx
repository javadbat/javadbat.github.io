// @vitest-environment happy-dom

import { act, fireEvent, render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { IDBFactory } from "fake-indexeddb";
import { formAppDictionary } from "../i18n/locale-adapter";
import { formElementRegistry } from "../registry/form-element-registry";
import { IndexedDbFormRepository } from "../storage/form-repository";
import { BuilderStore } from "./BuilderStore";
import { BuilderStoreProvider } from "./BuilderStoreContext";
import { CATALOG_DRAG_TYPE } from "./builder-drag";
import { FormCanvas } from "./FormCanvas";

function createDataTransfer(): DataTransfer {
  const data = new Map<string, string>();
  const types: string[] = [];

  return {
    dropEffect: "none",
    effectAllowed: "all",
    files: [] as unknown as FileList,
    items: [] as unknown as DataTransferItemList,
    types,
    clearData: () => {
      data.clear();
      types.splice(0);
    },
    getData: (type: string) => data.get(type) ?? "",
    setData: (type: string, value: string) => {
      data.set(type, value);
      if (!types.includes(type)) {
        types.push(type);
      }
    },
    setDragImage: () => undefined,
  };
}

describe("Builder shell performance baseline", () => {
  it("creates 100 valid registry elements within the shell budget", () => {
    const store = new BuilderStore();
    const startedAt = performance.now();

    for (let index = 0; index < 100; index += 1) {
      store.addElement(formElementRegistry[index % formElementRegistry.length]);
    }

    const duration = performance.now() - startedAt;
    const ids = new Set(store.document.elements.map(element => element.id));

    expect(store.document.elements).toHaveLength(100);
    expect(ids.size).toBe(100);
    expect(store.document.elements.every(element => element.name.length > 0)).toBe(true);
    expect(duration).toBeLessThan(1_000);
  });

  it("renders and updates one field in a 100-element canvas", () => {
    const store = new BuilderStore();
    for (let index = 0; index < 100; index += 1) {
      store.addElement(formElementRegistry[index % formElementRegistry.length]);
    }

    const renderStartedAt = performance.now();
    const view = render(
      <BuilderStoreProvider value={store}>
        <FormCanvas messages={formAppDictionary.dictionary.en} />
      </BuilderStoreProvider>,
    );
    const renderDuration = performance.now() - renderStartedAt;
    const target = store.document.elements[49];

    expect(view.container.querySelectorAll("[id^='element-select-']")).toHaveLength(100);
    expect(renderDuration).toBeLessThan(1_000);

    act(() => {
      store.selectElement(target.id);
      store.updateSelectedElement({ name: "benchmarkField" });
    });

    expect(view.getByText("benchmarkField")).toBeTruthy();
    expect(view.container.querySelectorAll("[data-selected='true']")).toHaveLength(1);
  });
});

describe("Builder core editing", () => {
  it("creates registry defaults without sharing mutable props", () => {
    const store = new BuilderStore();

    for (const entry of formElementRegistry) {
      store.addElement(entry);
    }

    expect(store.document.elements).toHaveLength(formElementRegistry.length);
    expect(store.document.elements.every(element => element.name.length > 0)).toBe(true);
    formElementRegistry.forEach((entry, index) => {
      const element = store.document.elements[index];
      expect(Object.hasOwn(element, "required")).toBe(entry.commonFields.required);
      expect(Object.hasOwn(element, "disabled")).toBe(entry.commonFields.disabled);
    });

    const selectEntry = formElementRegistry.find(entry => entry.type === "jb-select");
    expect(selectEntry).toBeTruthy();
    const firstSelectId = store.addElement(selectEntry!);
    const secondSelectId = store.addElement(selectEntry!);
    store.selectElement(firstSelectId);
    store.updateSelectedProp("options", []);

    expect(store.document.elements.find(element => element.id === firstSelectId)?.props.options).toEqual([]);
    expect(store.document.elements.find(element => element.id === secondSelectId)?.props.options).not.toEqual([]);
  });

  it("allows repeated valid names while reporting invalid intermediate names", () => {
    const store = new BuilderStore();
    const entry = formElementRegistry[0];
    const firstId = store.addElement(entry);
    const secondId = store.addElement(entry);

    store.selectElement(secondId);
    store.updateSelectedElement({
      name: store.document.elements[0].name,
    });
    expect(store.getElementNameError(firstId)).toBeNull();
    expect(store.getElementNameError(secondId)).toBeNull();

    store.updateSelectedElement({ name: "" });
    expect(store.getElementNameError(secondId)).toBe("required");

    store.updateSelectedElement({ name: "2-invalid" });
    expect(store.getElementNameError(secondId)).toBe("invalid");
  });

  it("reorders, duplicates, and removes while preserving selection rules", () => {
    const store = new BuilderStore();
    const [firstEntry, secondEntry, thirdEntry] = formElementRegistry;
    const firstId = store.addElement(firstEntry);
    const secondId = store.addElement(secondEntry);
    const thirdId = store.addElement(thirdEntry);

    expect(store.moveElementBy(thirdId, -1)).toBe(1);
    expect(store.document.elements.map(element => element.id)).toEqual([firstId, thirdId, secondId]);

    expect(store.moveElementToInsertionIndex(firstId, 3)).toBe(2);
    expect(store.document.elements.map(element => element.id)).toEqual([thirdId, secondId, firstId]);

    store.selectElement(secondId);
    store.updateSelectedProp("custom", { nested: ["value"] });
    const duplicateId = store.duplicateElement(secondId);
    expect(duplicateId).not.toBeNull();
    const source = store.document.elements.find(element => element.id === secondId);
    const duplicate = store.document.elements.find(element => element.id === duplicateId);
    expect(duplicate?.id).not.toBe(source?.id);
    expect(duplicate?.name).toBe(source?.name);
    expect(duplicate?.props).toEqual(source?.props);
    expect(store.selectedElementId).toBe(duplicateId);

    expect(store.removeElement(duplicateId!)).toBe(firstId);
    expect(store.selectedElementId).toBe(firstId);
    expect(store.removeElement(firstId)).toBe(secondId);
    expect(store.removeElement(secondId)).toBe(thirdId);
    expect(store.removeElement(thirdId)).toBeNull();
    expect(store.selectedElementId).toBeNull();
  });

  it("supports catalog drag insertion and canvas drag reordering", () => {
    const store = new BuilderStore();
    const view = render(
      <BuilderStoreProvider value={store}>
        <FormCanvas messages={formAppDictionary.dictionary.en} />
      </BuilderStoreProvider>,
    );
    const emptyDropTarget = view.container.querySelector<HTMLElement>("[data-drop-active='false']");
    const catalogTransfer = createDataTransfer();

    expect(emptyDropTarget).toBeTruthy();
    catalogTransfer.setData(CATALOG_DRAG_TYPE, formElementRegistry[0].type);
    fireEvent.dragOver(emptyDropTarget!, { dataTransfer: catalogTransfer });
    fireEvent.drop(emptyDropTarget!, { dataTransfer: catalogTransfer });

    expect(store.document.elements).toHaveLength(1);
    const firstId = store.document.elements[0].id;

    act(() => {
      store.addElement(formElementRegistry[1]);
    });
    const secondId = store.document.elements[1].id;
    const canvasHandle = view.container.querySelector<HTMLElement>("jb-button[aria-label='Drag to reorder']");
    const firstInsertionTarget = view.container.querySelectorAll<HTMLElement>("div[data-active='false']")[0];
    const canvasTransfer = createDataTransfer();

    expect(canvasHandle).toBeTruthy();
    expect(canvasHandle?.hasAttribute("draggable")).toBe(true);
    expect(firstInsertionTarget).toBeTruthy();
    fireEvent.dragStart(canvasHandle!, { dataTransfer: canvasTransfer });
    fireEvent.dragOver(firstInsertionTarget!, {
      dataTransfer: canvasTransfer,
    });
    fireEvent.drop(firstInsertionTarget!, { dataTransfer: canvasTransfer });

    expect(store.document.elements.map(element => element.id)).toEqual([secondId, firstId]);
  });
});

describe("Builder explicit persistence", () => {
  it("does not write while editing and restores only after explicit Save", async () => {
    const repository = new IndexedDbFormRepository({
      name: `builder-store-${crypto.randomUUID()}`,
      factory: new IDBFactory(),
    });
    const store = new BuilderStore(undefined, repository);
    await store.initialize();
    store.addElement(formElementRegistry[0]);

    expect(store.isDirty).toBe(true);
    expect(await repository.getCurrentDraft()).toEqual({
      ok: true,
      value: null,
    });

    expect(await store.save()).toBe(true);
    expect(store.isDirty).toBe(false);
    expect(store.hasSavedDraft).toBe(true);

    const restored = new BuilderStore(undefined, repository);
    expect(await restored.initialize()).toBe(true);
    expect(restored.document.elements).toHaveLength(1);
    expect(restored.document.elements[0].name).toBe("text");
    expect(restored.isDirty).toBe(false);
    repository.close();
  });

  it("restores a named form by slug with its revision link", async () => {
    const repository = new IndexedDbFormRepository({
      name: `builder-slug-${crypto.randomUUID()}`,
      factory: new IDBFactory(),
    });
    const store = new BuilderStore(undefined, repository);
    await store.initialize();
    store.addElement(formElementRegistry[1]);

    expect(await store.save({ slug: "numbers" })).toBe(true);
    expect(store.linkedRecord).toMatchObject({
      slug: "numbers",
      revision: 1,
    });

    const restored = new BuilderStore(undefined, repository);
    expect(await restored.initialize("numbers")).toBe(true);
    expect(restored.document.slug).toBe("numbers");
    expect(restored.linkedRecord).toMatchObject({
      slug: "numbers",
      revision: 1,
    });
    repository.close();
  });
});
