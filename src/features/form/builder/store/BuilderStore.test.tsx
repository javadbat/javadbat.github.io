// @vitest-environment happy-dom

import { act, fireEvent, render, waitFor } from "@testing-library/react";
import { IDBFactory } from "fake-indexeddb";
import { autorun } from "mobx";
import { describe, expect, it, vi } from "vitest";
import { createEmptyFormDocument } from "../../domain/form-document";
import { validateFormDocument } from "../../domain/form-document-validation";
import { formAppMessages } from "../../i18n/locale-adapter";
import { formElementRegistry } from "jb-form-builder/registry/form-element-registry";
import { IndexedDbFormRepository } from "../../storage/form-repository";
import { BuilderStore } from "./BuilderStore";
import { BuilderStoreProvider } from "./BuilderStoreContext";
import { CATALOG_DRAG_TYPE } from "../builder-drag";
import { FormCanvas } from "../FormCanvas/FormCanvas";
import { PropertyField } from "../ConfigurationPanel/PropertyField";
import { CommonFieldsEditor } from "../ConfigurationPanel/CommonFieldsEditor";

// Happy DOM lacks the ElementInternals API used by jb-tooltip. Real supported
// browsers provide it; this shim keeps these component tests on the real UI path.
if (typeof HTMLElement.prototype.attachInternals !== "function") {
  HTMLElement.prototype.attachInternals = () =>
    ({
      states: new Set<string>(),
      form: null,
      validationMessage: "",
      setFormValue: () => undefined,
      setValidity: () => undefined,
    }) as unknown as ElementInternals;
}
if (typeof Element.prototype.animate !== "function") {
  Element.prototype.animate = () => ({ cancel: () => undefined }) as Animation;
}
if (typeof Element.prototype.getAnimations !== "function") {
  Element.prototype.getAnimations = () => [];
}
if (!("part" in Element.prototype)) {
  Object.defineProperty(Element.prototype, "part", {
    configurable: true,
    get(this: Element) {
      const readTokens = () => new Set((this.getAttribute("part") ?? "").split(/\s+/).filter(Boolean));
      return {
        add: (...values: string[]) => this.setAttribute("part", [...new Set([...readTokens(), ...values])].join(" ")),
      };
    },
  });
}

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
    expect(validateFormDocument(store.createDocumentSnapshot())).toMatchObject({ valid: true, issues: [] });
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
        <FormCanvas messages={formAppMessages.en} />
      </BuilderStoreProvider>,
    );
    const renderDuration = performance.now() - renderStartedAt;
    const target = store.document.elements.find(element => element.type === "jb-input")!;

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
  it.each([
    ["jb-mobile-input", 'jb-input[name="elementInitialValue"]'],
    ["jb-password-input", 'jb-input[name="elementInitialValue"]'],
    ["jb-payment-input", 'jb-input[name="elementInitialValue"]'],
    ["jb-national-input", 'jb-input[name="elementInitialValue"]'],
    ["jb-pin-input", 'jb-input[name="elementInitialValue"]'],
    ["jb-time-input", "jb-time-input"],
    ["jb-textarea", 'jb-textarea[name="elementInitialValue"]'],
    ["jb-listbox", 'jb-select[name="elementInitialValue"]'],
  ] as const)("renders %s initial values with %s", (type, selector) => {
    const store = new BuilderStore();
    const entry = formElementRegistry.find(candidate => candidate.type === type)!;
    store.addElement(entry);

    const view = render(
      <BuilderStoreProvider value={store}>
        <CommonFieldsEditor entry={entry} locale="en" defaultLocale="en" messages={formAppMessages.en} />
      </BuilderStoreProvider>,
    );

    expect(view.container.querySelector(selector)).toBeTruthy();
    if (type === "jb-time-input") {
      expect((view.container.querySelector("jb-time-input") as HTMLElement & { secondEnabled: boolean }).secondEnabled).toBe(false);
    }
  });

  it.each(["jb-checkbox", "jb-switch"] as const)("renders localized boolean options for %s", type => {
    const store = new BuilderStore();
    const entry = formElementRegistry.find(candidate => candidate.type === type)!;
    store.addElement(entry);

    const view = render(
      <BuilderStoreProvider value={store}>
        <CommonFieldsEditor entry={entry} locale="fa" defaultLocale="en" messages={formAppMessages.fa} />
      </BuilderStoreProvider>,
    );
    const options = Array.from(view.container.querySelectorAll("jb-option"), option => option.textContent);

    expect(options).toEqual(["—", "بله", "خیر"]);
  });

  it("uses two numeric initial-value controls for range mode", () => {
    const store = new BuilderStore();
    const entry = formElementRegistry.find(candidate => candidate.type === "jb-range-input")!;
    store.addElement(entry);
    store.updateSelectedProp("mode", "range");
    store.updateSelectedElement({ initialValue: [2, 8] });

    const view = render(
      <BuilderStoreProvider value={store}>
        <CommonFieldsEditor entry={entry} locale="en" defaultLocale="en" messages={formAppMessages.en} />
      </BuilderStoreProvider>,
    );

    expect(view.container.querySelector('jb-number-input[name="elementInitialValueStart"]')).toBeTruthy();
    expect(view.container.querySelector('jb-number-input[name="elementInitialValueEnd"]')).toBeTruthy();
  });

  it("commits a time-picker selection before the property editor unmounts", () => {
    const store = new BuilderStore();
    const entry = formElementRegistry.find(candidate => candidate.type === "jb-time-input")!;
    store.addElement(entry);
    const view = render(
      <BuilderStoreProvider value={store}>
        <CommonFieldsEditor entry={entry} locale="en" defaultLocale="en" messages={formAppMessages.en} />
      </BuilderStoreProvider>,
    );
    const timeInput = view.container.querySelector("jb-time-input") as HTMLElement & {
      elements: { timePicker: { component: HTMLElement & { value: { hour: number; minute: number; second?: number } } } };
    };

    act(() => {
      timeInput.elements.timePicker.component.value = { hour: 9, minute: 45 };
      timeInput.elements.timePicker.component.dispatchEvent(new Event("change"));
    });

    expect(store.selectedElement?.initialValue).toBe("09:45");
  });

  it("keeps a required name empty while editing and restores it on blur", () => {
    const store = new BuilderStore();
    const inputEntry = formElementRegistry.find(entry => entry.type === "jb-input")!;
    store.addElement(inputEntry);
    const originalName = store.selectedElement!.name;
    const view = render(
      <BuilderStoreProvider value={store}>
        <CommonFieldsEditor entry={inputEntry} locale="en" defaultLocale="en" messages={formAppMessages.en} />
      </BuilderStoreProvider>,
    );
    const nameInput = view.container.querySelector<HTMLElement>('jb-input[name="elementName"]')!;

    fireEvent.input(nameInput, { target: { value: "" } });
    expect(store.selectedElement?.name).toBe("");

    fireEvent.blur(nameInput, { target: { value: "" } });
    expect(store.selectedElement?.name).toBe(originalName);
  });

  it("uses the field's built-in error UI for invalid English-only names", () => {
    const store = new BuilderStore();
    const inputEntry = formElementRegistry.find(entry => entry.type === "jb-input")!;
    store.addElement(inputEntry);
    const view = render(
      <BuilderStoreProvider value={store}>
        <CommonFieldsEditor entry={inputEntry} locale="fa" defaultLocale="en" messages={formAppMessages.fa} />
      </BuilderStoreProvider>,
    );
    const nameInput = view.container.querySelector<HTMLElement>('jb-input[name="elementName"]')!;

    fireEvent.input(nameInput, { target: { value: "سیب" } });

    expect(store.getElementNameError(store.selectedElement!.id)).toBe("invalid");
    expect(nameInput.getAttribute("error")).toContain("حرف انگلیسی");
    expect(view.container.querySelector('[id^="element-name-error-"]')).toBeNull();
  });

  it("keeps an explicitly cleared optional localized field empty", () => {
    const store = new BuilderStore();
    const inputEntry = formElementRegistry.find(entry => entry.type === "jb-input")!;
    store.addElement(inputEntry);
    store.updateSelectedText("label", "English label", "en");
    store.updateSelectedText("label", "برچسب فارسی", "fa");
    const view = render(
      <BuilderStoreProvider value={store}>
        <CommonFieldsEditor entry={inputEntry} locale="fa" defaultLocale="en" messages={formAppMessages.fa} />
      </BuilderStoreProvider>,
    );
    const labelInput = view.container.querySelector<HTMLElement>('jb-input[name="elementLabel"]')!;

    fireEvent.input(labelInput, { target: { value: "" } });

    expect(store.selectedElement?.label).toEqual({ translations: { en: "English label", fa: "" } });
    expect((labelInput as unknown as { value: string }).value).toBe("");
  });

  it("edits static text content with jb-textarea", () => {
    const store = new BuilderStore();
    const textEntry = formElementRegistry.find(entry => entry.type === "text")!;
    store.addElement(textEntry);
    const contentDefinition = textEntry.propertyDefinitions.find(definition => definition.key === "content")!;
    const view = render(
      <BuilderStoreProvider value={store}>
        <PropertyField definition={contentDefinition} locale="en" defaultLocale="en" messages={formAppMessages.en} />
      </BuilderStoreProvider>,
    );
    const textarea = view.container.querySelector<HTMLElement>('jb-textarea[name="prop-content"]');

    expect(textarea).toBeTruthy();
    fireEvent.input(textarea!, { target: { value: "A longer introduction\nwith two lines." } });
    expect(store.selectedElement?.props.content).toEqual({ translations: { en: "A longer introduction\nwith two lines." } });
  });

  it("edits color properties with jb-color-input", () => {
    const store = new BuilderStore();
    const textEntry = formElementRegistry.find(entry => entry.type === "text")!;
    store.addElement(textEntry);
    const colorDefinition = textEntry.propertyDefinitions.find(definition => definition.key === "color")!;
    const view = render(
      <BuilderStoreProvider value={store}>
        <PropertyField definition={colorDefinition} locale="en" defaultLocale="en" messages={formAppMessages.en} />
      </BuilderStoreProvider>,
    );
    const colorInput = view.container.querySelector<HTMLElement>('jb-color-input[name="prop-color"]');

    expect(colorDefinition.control).toBe("color");
    expect(colorInput).toBeTruthy();
    fireEvent.input(colorInput!, { target: { value: "oklch(0.6 0.2 250)" } });
    expect(store.selectedElement?.props.color).toBe("oklch(0.6 0.2 250)");
  });

  it("edits font size in pixels while storing rem", () => {
    const store = new BuilderStore();
    const textEntry = formElementRegistry.find(entry => entry.type === "text")!;
    store.addElement(textEntry);
    store.updateSelectedProp("fontSize", 1.5);
    const fontSizeDefinition = textEntry.propertyDefinitions.find(definition => definition.key === "fontSize")!;
    const view = render(
      <BuilderStoreProvider value={store}>
        <PropertyField definition={fontSizeDefinition} locale="en" defaultLocale="en" messages={formAppMessages.en} />
      </BuilderStoreProvider>,
    );
    const numberInput = view.container.querySelector<HTMLElement>('jb-number-input[name="prop-fontSize"]')!;

    expect(numberInput).toBeTruthy();
    expect((numberInput as unknown as { value: string }).value).toBe("24");
    expect((numberInput as unknown as { minValue: number }).minValue).toBe(8);
    expect((numberInput as unknown as { maxValue: number }).maxValue).toBe(96);
    expect((numberInput as unknown as { step: number }).step).toBe(2);

    act(() => {
      (numberInput as unknown as { value: string }).value = "32";
      numberInput.dispatchEvent(new Event("input", { bubbles: true }));
    });

    expect(store.selectedElement?.props.fontSize).toBe(2);
  });

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

  it("imports a detached document as an unsaved current draft", () => {
    const store = new BuilderStore();
    const imported = createEmptyFormDocument();
    imported.metadata.name = { translations: { en: "Imported form" } };

    store.addElement(formElementRegistry[0]);
    expect(store.importDocument(imported)).toBe(true);

    expect(store.document).toEqual(imported);
    expect(store.document).not.toBe(imported);
    expect(store.selectedElementId).toBeNull();
    expect(store.linkedRecord).toBeNull();
    expect(store.hasSavedDraft).toBe(false);
    expect(store.isDirty).toBe(true);
  });

  it("undoes and redoes document edits and clears the redo branch after a new edit", () => {
    const store = new BuilderStore();
    const entry = formElementRegistry[0];

    store.addElement(entry);
    expect(store.canUndo).toBe(true);
    expect(store.canRedo).toBe(false);

    expect(store.undo()).toBe(true);
    expect(store.document.elements).toHaveLength(0);
    expect(store.canUndo).toBe(false);
    expect(store.canRedo).toBe(true);

    expect(store.redo()).toBe(true);
    expect(store.document.elements).toHaveLength(1);

    store.undo();
    store.addElement(entry);
    expect(store.canRedo).toBe(false);
  });

  it("manages editing locales and preserves fallback text when a locale is removed", () => {
    const store = new BuilderStore();
    const elementId = store.addElement(formElementRegistry[0]);
    store.updateSelectedText("label", "English label", "en");
    store.setFormLocalization({
      defaultLocale: "fa",
      locales: {
        en: { direction: "ltr" },
        fa: { direction: "rtl" },
      },
    });
    store.setEditingLocale("fa");
    store.updateSelectedText("label", "برچسب فارسی", "fa");

    expect(store.editingLocale).toBe("fa");
    expect(store.document.elements.find(element => element.id === elementId)?.label?.translations).toMatchObject({ en: "English label", fa: "برچسب فارسی" });

    store.setFormLocalization({ defaultLocale: "fa", locales: { fa: { direction: "rtl" } } });
    expect(store.document.elements.find(element => element.id === elementId)?.label?.translations).toEqual({ fa: "برچسب فارسی" });
  });

  it("accepts localization assembled from observable store state", () => {
    const store = new BuilderStore();
    const localization = {
      ...store.document.localization,
      locales: {
        ...store.document.localization.locales,
        fa: { direction: "rtl" as const },
      },
    };

    expect(() => store.setFormLocalization(localization)).not.toThrow();
    expect(store.document.localization).toEqual({
      defaultLocale: "en",
      locales: {
        en: { direction: "ltr" },
        fa: { direction: "rtl" },
      },
    });
  });

  it("updates an observable validation rule as portable form data", () => {
    const store = new BuilderStore();
    const inputEntry = formElementRegistry.find(entry => entry.type === "jb-input")!;
    const elementId = store.addElement(inputEntry);
    store.selectElement(elementId);
    const ruleId = store.addSelectedValidationRule("minLength");
    const rule = store.selectedElement?.validation[0];

    expect(ruleId).toBeTruthy();
    expect(rule?.rule).toBe("minLength");
    if (rule?.rule !== "minLength") {
      throw new Error("Expected a minimum-length validation rule.");
    }
    expect(() =>
      store.updateSelectedValidationRule(ruleId!, {
        ...rule,
        params: { value: 5 },
      }),
    ).not.toThrow();
    expect(store.selectedElement?.validation[0]).toMatchObject({
      id: ruleId,
      rule: "minLength",
      params: { value: 5 },
    });
    expect(store.isDirty).toBe(true);
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
        <FormCanvas messages={formAppMessages.en} />
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
    const canvasHandle = view.container.querySelector<HTMLElement>("[data-selected='true'] jb-button[aria-label='Drag to reorder']");
    const firstInsertionTarget = view.container.querySelectorAll<HTMLElement>("div[data-active='false']")[0];
    const firstInsertionHitArea = firstInsertionTarget?.querySelector<HTMLElement>("[aria-hidden='true']");
    const canvasTransfer = createDataTransfer();

    expect(canvasHandle).toBeTruthy();
    expect(canvasHandle?.hasAttribute("draggable")).toBe(true);
    expect(firstInsertionTarget).toBeTruthy();
    expect(firstInsertionHitArea).toBeTruthy();
    expect(firstInsertionTarget?.textContent).toContain("Drop here");
    fireEvent.dragStart(canvasHandle!, { dataTransfer: canvasTransfer });
    expect(document.body.dataset.formBuilderDragging).toBe("true");
    fireEvent.dragOver(firstInsertionHitArea!, {
      dataTransfer: canvasTransfer,
    });
    fireEvent.drop(firstInsertionHitArea!, { dataTransfer: canvasTransfer });

    expect(store.document.elements.map(element => element.id)).toEqual([secondId, firstId]);
    expect(document.body.dataset.formBuilderDragging).toBeUndefined();
  });

  it("reorders selected fields through explicit touch-safe controls", () => {
    const store = new BuilderStore();
    const firstId = store.addElement(formElementRegistry[0]);
    const secondId = store.addElement(formElementRegistry[1]);
    const view = render(
      <BuilderStoreProvider value={store}>
        <FormCanvas messages={formAppMessages.en} />
      </BuilderStoreProvider>,
    );
    const moveUp = view.container.querySelector<HTMLElement>("jb-button[aria-label='Move up']");

    expect(moveUp).toBeTruthy();
    fireEvent.click(moveUp!);
    expect(store.document.elements.map(element => element.id)).toEqual([secondId, firstId]);
    expect(store.selectedElementId).toBe(secondId);
  });

  it("notifies the workspace when a field is selected", () => {
    const store = new BuilderStore();
    const firstId = store.addElement(formElementRegistry[0]);
    const secondId = store.addElement(formElementRegistry[1]);
    const onSelectElement = vi.fn();
    const view = render(
      <BuilderStoreProvider value={store}>
        <FormCanvas messages={formAppMessages.en} onSelectElement={onSelectElement} />
      </BuilderStoreProvider>,
    );

    fireEvent.click(view.container.querySelector<HTMLElement>(`#element-select-${firstId}`)!);

    expect(store.selectedElementId).toBe(firstId);
    expect(store.selectedElementId).not.toBe(secondId);
    expect(onSelectElement).toHaveBeenCalledWith(firstId);
  });

  it("shows card actions when a field inside a tab is selected", () => {
    const store = new BuilderStore();
    const tabEntry = formElementRegistry.find(entry => entry.type === "jb-tab")!;
    const inputEntry = formElementRegistry.find(entry => entry.type === "jb-input")!;
    store.addElement(tabEntry);
    const tabElement = store.selectedElement;
    if (!tabElement || tabElement.type !== "jb-tab") throw new Error("Expected a selected tab container.");
    const childId = store.addElementToTab(tabElement.id, tabElement.tabs[0].id, inputEntry);
    if (!childId) throw new Error("Expected a child element to be added to the tab.");
    const view = render(
      <BuilderStoreProvider value={store}>
        <FormCanvas messages={formAppMessages.en} />
      </BuilderStoreProvider>,
    );

    fireEvent.click(view.container.querySelector<HTMLElement>(`#element-select-${childId}`)!);

    const childCard = view.container.querySelector<HTMLElement>(`#element-card-${childId}`)!;
    expect(store.selectedElementId).toBe(childId);
    expect(childCard.dataset.selected).toBe("true");
    expect(childCard.querySelector("jb-button[aria-label='Configure']")).toBeTruthy();
  });

  it("opens form-name settings when the canvas title is clicked", () => {
    const store = new BuilderStore();
    const onOpenFormNameSettings = vi.fn();
    const view = render(
      <BuilderStoreProvider value={store}>
        <FormCanvas messages={formAppMessages.en} onOpenFormNameSettings={onOpenFormNameSettings} />
      </BuilderStoreProvider>,
    );

    fireEvent.click(view.container.querySelector<HTMLElement>("#form-canvas-title button")!);

    expect(onOpenFormNameSettings).toHaveBeenCalledOnce();
  });

  it("focuses and scrolls to a tab's properties row when its canvas tab is clicked", async () => {
    const store = new BuilderStore();
    const tabEntry = formElementRegistry.find(entry => entry.type === "jb-tab")!;
    store.addElement(tabEntry);
    const tabElement = store.selectedElement;
    if (!tabElement || tabElement.type !== "jb-tab") throw new Error("Expected a selected tab container.");
    const targetTab = tabElement.tabs[1];

    const view = render(
      <BuilderStoreProvider value={store}>
        <FormCanvas messages={formAppMessages.en} />
        <section id={`tab-editor-${targetTab.id}`} tabIndex={-1} />
      </BuilderStoreProvider>,
    );
    const editorRow = view.container.querySelector<HTMLElement>(`#tab-editor-${targetTab.id}`)!;
    editorRow.scrollIntoView = vi.fn();
    const canvasTabs = view.container.querySelectorAll<HTMLElement>("[role='tab']");

    fireEvent.click(canvasTabs[1]);

    await waitFor(() => {
      expect(document.activeElement).toBe(editorRow);
      expect(editorRow.scrollIntoView).toHaveBeenCalledWith({ behavior: "smooth", block: "nearest", inline: "nearest" });
    });
  });

  it("implements keyboard navigation and relationships for builder tabs", () => {
    const store = new BuilderStore();
    const tabEntry = formElementRegistry.find(entry => entry.type === "jb-tab")!;
    store.addElement(tabEntry);
    const view = render(
      <BuilderStoreProvider value={store}>
        <FormCanvas messages={formAppMessages.en} />
      </BuilderStoreProvider>,
    );

    const tabs = view.container.querySelectorAll<HTMLButtonElement>("[role='tab']");
    const panel = view.container.querySelector<HTMLElement>("[role='tabpanel']");

    expect(tabs).toHaveLength(2);
    expect(tabs[0].tabIndex).toBe(0);
    expect(tabs[1].tabIndex).toBe(-1);
    expect(tabs[0].getAttribute("aria-controls")).toBe(panel?.id);
    expect(panel?.getAttribute("aria-labelledby")).toBe(tabs[0].id);

    fireEvent.keyDown(tabs[0], { key: "ArrowRight" });

    expect(tabs[1].getAttribute("aria-selected")).toBe("true");
    expect(tabs[1].tabIndex).toBe(0);
  });
});

describe("Builder explicit persistence", () => {
  it("commits async repository results inside MobX actions", async () => {
    const repository = new IndexedDbFormRepository({
      name: `builder-actions-${crypto.randomUUID()}`,
      factory: new IDBFactory(),
    });
    const store = new BuilderStore(undefined, repository);
    const warn = vi.spyOn(console, "warn").mockImplementation(() => undefined);
    // MobX only enforces its default strict-action rule for observed values.
    // Mirror the React observer boundary so this test catches the browser-only
    // warnings that plain store assertions would otherwise miss.
    const stopObserving = autorun(() => {
      void store.document;
      void store.isDirty;
      void store.linkedRecord;
      void store.status;
    });

    try {
      expect(await store.initialize()).toBe(true);
      store.addElement(formElementRegistry[0]);
      expect(await store.save()).toBe(true);

      const actionWarnings = warn.mock.calls
        .map(arguments_ => arguments_.join(" "))
        .filter(message => message.includes("changing (observed) observable values without using an action"));
      expect(actionWarnings).toEqual([]);
    } finally {
      stopObserving();
      warn.mockRestore();
      repository.close();
    }
  });

  it("does not write while editing and restores only after explicit Save", async () => {
    const repository = new IndexedDbFormRepository({
      name: `builder-store-${crypto.randomUUID()}`,
      factory: new IDBFactory(),
    });
    const store = new BuilderStore(undefined, repository);
    await store.initialize();
    const firstEntry = formElementRegistry[0];
    store.addElement(firstEntry);

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
    expect(restored.document.elements[0].name).toBe(firstEntry.defaultName);
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
