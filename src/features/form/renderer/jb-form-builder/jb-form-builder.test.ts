// @vitest-environment happy-dom

import { beforeEach, describe, expect, it, vi } from "vitest";
import { createEmptyFormDocument, localizedText, type JBFormDocumentV1 } from "../../domain/form-document";
import { createDefaultElement, formElementRegistry } from "../../registry/form-element-registry";
import { defineJBFormBuilder } from "./define";
import type { FormValues, JBFormBuilderElement } from "./types";

defineJBFormBuilder();

class StubFormElement extends HTMLElement {
  required = false;
  disabled = false;
  validation = { list: [] };
  value: unknown = "";
  #initialValue: unknown = "";

  get initialValue(): unknown {
    return this.#initialValue;
  }

  set initialValue(value: unknown) {
    this.#initialValue = value;
    this.value = value;
  }

  reset(): void {
    this.value = this.#initialValue;
  }
}

class StubJBForm extends HTMLElement {
  get value(): FormValues {
    return this.getFormValues();
  }

  set value(values: FormValues) {
    this.setFormValues(values);
  }

  getFormValues(): FormValues {
    const values: FormValues = {};
    for (const element of this.querySelectorAll<StubFormElement>("[name]")) {
      const name = element.getAttribute("name");
      if (!name) {
        continue;
      }
      if (!(name in values)) {
        values[name] = element.value;
      } else if (Array.isArray(values[name])) {
        (values[name] as unknown[]).push(element.value);
      } else {
        values[name] = [values[name], element.value];
      }
    }
    return values;
  }

  setFormValues(values: FormValues): void {
    for (const element of this.querySelectorAll<StubFormElement>("[name]")) {
      const name = element.getAttribute("name");
      if (name && name in values) {
        element.value = values[name];
      }
    }
  }

  reset(): void {
    for (const element of this.querySelectorAll<StubFormElement>("[name]")) {
      element.reset();
    }
  }

  checkValidity(): boolean {
    return true;
  }

  reportValidity(): boolean {
    return true;
  }

  async jbCheckValidity(): Promise<{ isAllValid: boolean }> {
    return { isAllValid: true };
  }
}

function registerStubDependencies(): void {
  if (!customElements.get("jb-form")) {
    customElements.define("jb-form", StubJBForm);
  }
  for (const entry of formElementRegistry) {
    if (!entry.isContent && !customElements.get(entry.tagName)) {
      customElements.define(entry.tagName, class extends StubFormElement {});
    }
  }
  if (!customElements.get("jb-option")) {
    customElements.define("jb-option", class extends HTMLElement {});
  }
}

function allElementsDocument(): JBFormDocumentV1 {
  const documentValue = createEmptyFormDocument();
  documentValue.metadata.name = localizedText("Renderer coverage");
  documentValue.elements = formElementRegistry.map((entry, index) => createDefaultElement(entry, `field${index + 1}`));
  return documentValue;
}

function createRenderer(): JBFormBuilderElement {
  const renderer = document.createElement("jb-form-builder");
  document.body.append(renderer);
  return renderer;
}

beforeEach(() => {
  document.body.replaceChildren();
});

describe("JBFormBuilderWebComponent", () => {
  it("renders and reports exact requirements when no dependency loader is supplied", async () => {
    const renderer = createRenderer();
    const required = vi.fn();
    renderer.addEventListener("dependencies-required", required);
    renderer.formDocument = createEmptyFormDocument();

    await renderer.updateComplete;

    expect(renderer.state).toBe("degraded");
    expect(renderer.form?.localName).toBe("jb-form");
    expect(renderer.requiredDependencies).toEqual([{ packageName: "jb-form", tagNames: ["jb-form"] }]);
    expect(required).toHaveBeenCalledOnce();
    expect(renderer.shadowRoot?.textContent).toContain("jb-form");
  });

  it("renders all registered element types without importing packages", async () => {
    registerStubDependencies();
    const renderer = createRenderer();
    const documentValue = allElementsDocument();
    renderer.formDocument = documentValue;

    await renderer.updateComplete;

    expect(renderer.state).toBe("ready");
    expect(renderer.form).toBeInstanceOf(StubJBForm);
    expect(renderer.shadowRoot?.querySelectorAll("[data-form-element-id]")).toHaveLength(formElementRegistry.length);
    for (const element of documentValue.elements) {
      const runtime = renderer.shadowRoot?.querySelector(`[data-form-element-id="${element.id}"]`);
      const entry = formElementRegistry.find(candidate => candidate.type === element.type)!;
      expect(runtime?.localName).toBe(entry.tagName);
      expect(runtime?.getAttribute("name")).toBe(entry.isContent ? null : element.name);
    }
    expect(renderer.requiredDependencies).toHaveLength(formElementRegistry.filter(entry => !entry.isContent).length + 1);
  });

  it("uses a host-provided dependency loader", async () => {
    registerStubDependencies();
    const loader = vi.fn(async () => ({ failures: [], missing: [] }));
    const renderer = createRenderer();
    renderer.loadDependencies = loader;
    renderer.formDocument = createEmptyFormDocument();

    await renderer.updateComplete;

    expect(loader).toHaveBeenCalledOnce();
    expect(loader).toHaveBeenCalledWith([{ packageName: "jb-form", tagNames: ["jb-form"] }]);
    expect(renderer.state).toBe("ready");
  });

  it("preserves repeated names, forwards value events, and resets values", async () => {
    registerStubDependencies();
    const renderer = createRenderer();
    const input = formElementRegistry.find(entry => entry.type === "jb-input")!;
    const documentValue = createEmptyFormDocument();
    const first = createDefaultElement(input, "phone");
    const second = createDefaultElement(input, "phone");
    first.initialValue = "111";
    second.initialValue = "222";
    documentValue.elements = [first, second];
    renderer.formDocument = documentValue;
    await renderer.updateComplete;

    expect(renderer.value.phone).toEqual(["111", "222"]);

    const onChange = vi.fn();
    renderer.addEventListener("change", onChange);
    const firstRuntime = renderer.shadowRoot?.querySelector<StubFormElement>(`[data-form-element-id="${first.id}"]`);
    firstRuntime!.value = "333";
    firstRuntime!.dispatchEvent(new Event("change", { bubbles: true, composed: true }));

    expect(onChange).toHaveBeenCalledOnce();
    expect(onChange.mock.calls[0][0].detail.value.phone).toEqual(["333", "222"]);

    renderer.reset();
    expect(renderer.value.phone).toEqual(["111", "222"]);
  });

  it("rejects an invalid document without mutating the source", async () => {
    registerStubDependencies();
    const renderer = createRenderer();
    const documentValue = createEmptyFormDocument();
    const input = formElementRegistry.find(entry => entry.type === "jb-input")!;
    const invalidElement = createDefaultElement(input, "validBeforeEdit");
    invalidElement.name = "";
    documentValue.elements = [invalidElement];
    const invalid = vi.fn();
    renderer.addEventListener("document-invalid", invalid);
    renderer.formDocument = documentValue;

    await renderer.updateComplete;

    expect(renderer.state).toBe("invalid");
    expect(renderer.form).toBeNull();
    expect(invalid).toHaveBeenCalledOnce();
    expect(documentValue.elements[0].name).toBe("");
  });

  it("accepts a dependency loader property and reflects locale", () => {
    const renderer = document.createElement("jb-form-builder");
    const loader = vi.fn(async () => ({ failures: [], missing: [] }));

    renderer.loadDependencies = loader;
    renderer.locale = "fa";

    expect(renderer.loadDependencies).toBe(loader);
    expect(renderer.getAttribute("locale")).toBe("fa");
  });
});
