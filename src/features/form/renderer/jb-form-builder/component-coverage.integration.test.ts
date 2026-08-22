// @vitest-environment happy-dom

import { beforeAll, beforeEach, describe, expect, it } from "vitest";
import { i18n } from "jb-core/i18n";
import { createEmptyFormDocument, getLocalizedText, type JBFormElementType, type JBFormElementV1, type JSONValue, type LocalizedText } from "../../domain/form-document";
import { configurationByType } from "../../registry/form-element-configuration";
import { createDefaultElement, formElementRegistry, type FormElementRegistryEntry } from "../../registry/form-element-registry";
import { defineJBFormBuilder } from "./define";
import type { JBFormBuilderElement } from "./types";

defineJBFormBuilder();

// happy-dom provides ElementInternals but currently omits CustomStateSet. JB
// components use internals.states during construction and validation, so this
// test-only patch preserves the real component path without replacing any JB
// component with a stub or weakening production code.
const nativeAttachInternals = HTMLElement.prototype.attachInternals;
HTMLElement.prototype.attachInternals = function attachInternalsWithStates() {
  const fallbackInternals = {
    form: null,
    validationMessage: "",
    setFormValue: () => undefined,
    setValidity(_flags: ValidityStateFlags, message = "") {
      fallbackInternals.validationMessage = message;
    },
  };
  const internals = nativeAttachInternals ? nativeAttachInternals.call(this) : (fallbackInternals as unknown as ElementInternals);
  // Some happy-dom releases expose a `states` key whose value is undefined.
  // Check the usable API instead of only checking property presence.
  if (!internals.states || typeof internals.states.add !== "function") {
    Object.defineProperty(internals, "states", {
      configurable: true,
      value: new Set<string>(),
    });
  }
  return internals;
};

// happy-dom also omits the CSS Shadow Parts token list. jb-select uses
// `element.part.add(...)` when it paints a selected value. This small DOMToken
// shim reflects tokens to the real `part` attribute, which is sufficient for
// exercising the package without changing application behavior.
if (!("part" in Element.prototype)) {
  Object.defineProperty(Element.prototype, "part", {
    configurable: true,
    get(this: Element) {
      const readTokens = () => new Set((this.getAttribute("part") ?? "").split(/\s+/).filter(Boolean));
      const writeTokens = (tokens: Set<string>) => this.setAttribute("part", [...tokens].join(" "));
      return {
        add(...values: string[]) {
          const tokens = readTokens();
          values.forEach(value => {
            tokens.add(value);
          });
          writeTokens(tokens);
        },
        contains(value: string) {
          return readTokens().has(value);
        },
        remove(...values: string[]) {
          const tokens = readTokens();
          values.forEach(value => {
            tokens.delete(value);
          });
          writeTokens(tokens);
        },
      };
    },
  });
}

// The platform contract resolves `whenDefined()` with the registered
// constructor. happy-dom currently resolves it without that value, while
// jb-form legitimately inspects the constructor's `formAssociated` flag.
// Preserve the browser contract for real jb-form integration tests.
const nativeWhenDefined = customElements.whenDefined.bind(customElements);
customElements.whenDefined = async name => {
  const elementConstructor = await nativeWhenDefined(name);
  return elementConstructor ?? customElements.get(name)!;
};

type RuntimeField = HTMLElement & {
  checked?: boolean;
  disabled?: boolean;
  initialValue?: unknown;
  required?: boolean;
  value?: unknown;
  [key: string]: unknown;
};

const initialValueByType: Partial<Record<JBFormElementType, string | number | boolean | [number, number]>> = {
  "jb-input": "Initial text",
  "jb-number-input": "1200",
  "jb-range-input": 4,
  "jb-mobile-input": "09121234567",
  "jb-password-input": "secret-value",
  "jb-payment-input": "6037997514567890",
  "jb-national-input": "0013542369",
  "jb-date-input": "2026-08-03",
  "jb-time-input": "12:30",
  "jb-pin-input": "1234",
  "jb-textarea": "Initial long text",
  "jb-select": "option_1",
  "jb-listbox": "option_1",
  "jb-checkbox": true,
  "jb-switch": true,
};

// These components depend on browser parsing/upgrading behavior that happy-dom
// does not currently reproduce. Their packages are still imported and their
// registrations are asserted below; their actual renderer behavior is covered
// in the real-browser acceptance pass documented in COMPONENT-SUPPORT.md.
const browserOnlyRenderTypes = new Set<JBFormElementType>(["jb-date-input", "jb-time-input"]);
const componentEntries = formElementRegistry.filter(entry => !entry.isContent);
const happyDomRenderEntries = componentEntries.filter(entry => !entry.isContainer && !browserOnlyRenderTypes.has(entry.type));
let selectLoaderRegisteredOption = false;

function createRenderer(element: JBFormElementV1): JBFormBuilderElement {
  const formDocument = createEmptyFormDocument();
  formDocument.elements = [element];
  const renderer = document.createElement("jb-form-builder");
  // Packages are registered once in beforeAll. Omitting a loader proves that
  // the renderer consumes consumer-owned dependencies without imports.
  document.body.append(renderer);
  renderer.formDocument = formDocument;
  return renderer;
}

function runtimeField(renderer: JBFormBuilderElement, element: JBFormElementV1): RuntimeField | null {
  return renderer.shadowRoot?.querySelector<RuntimeField>(`[data-form-element-id="${element.id}"]`) ?? null;
}

function expectReadyRuntime(renderer: JBFormBuilderElement, element: JBFormElementV1): RuntimeField {
  expect(renderer.state, renderer.shadowRoot?.textContent ?? "Renderer has no Shadow DOM text.").toBe("ready");
  const runtime = runtimeField(renderer, element);
  expect(runtime, renderer.shadowRoot?.textContent ?? `${element.type} did not render.`).not.toBeNull();
  return runtime!;
}

function resolvedRuntimeValue(value: JSONValue, locale: string): unknown {
  if (typeof value === "object" && value !== null && !Array.isArray(value) && "translations" in value) {
    return getLocalizedText(value as unknown as LocalizedText, locale);
  }
  return value;
}

function expectDefaultProperties(runtime: RuntimeField, element: JBFormElementV1): void {
  for (const [key, value] of Object.entries(element.props)) {
    if (key === "content") {
      expect(runtime.textContent).toBe(resolvedRuntimeValue(value, "en"));
    } else if (key === "options") {
      const expectedOptions = Array.isArray(value) ? value : [];
      expect(runtime.querySelectorAll("jb-option")).toHaveLength(expectedOptions.length);
    } else {
      expect(runtime[key], `${element.type}.${key}`).toEqual(resolvedRuntimeValue(value, "en"));
    }
  }
}

beforeAll(async () => {
  // Prove the select dependency is self-contained before listbox (which also
  // imports jb-option) can mask a missing option registration.
  const selectEntry = formElementRegistry.find(entry => entry.type === "jb-select")!;
  await Promise.all([import("jb-form"), selectEntry.loadComponent()]);
  selectLoaderRegisteredOption = Boolean(customElements.get("jb-option"));

  // Load the remaining independent packages concurrently, matching the
  // renderer's production dependency strategy.
  await Promise.all(componentEntries.filter(entry => entry !== selectEntry).map(entry => entry.loadComponent()));
});

beforeEach(() => {
  document.body.replaceChildren();
  i18n.setLocale("en");
});

describe("real JB component Preview coverage", () => {
  it("loads jb-option with jb-select for an isolated Preview document", () => {
    expect(selectLoaderRegisteredOption).toBe(true);
  });

  it.each(componentEntries)("loads and defines the $type package", (entry: FormElementRegistryEntry) => {
    expect(customElements.get(entry.tagName)).toBeDefined();
  });

  it.each(happyDomRenderEntries)("renders $type defaults through its registered custom element", async (entry: FormElementRegistryEntry) => {
    const element = createDefaultElement(entry, `${entry.defaultName}Field`);
    const renderer = createRenderer(element);

    await renderer.updateComplete;

    const runtime = expectReadyRuntime(renderer, element);
    expect(runtime).toBeInstanceOf(customElements.get(entry.tagName));
    expect(runtime.localName).toBe(entry.tagName);
    expect(runtime.getAttribute("name")).toBe(element.name);
    expectDefaultProperties(runtime, element);
    expect(renderer.reportValidity()).toBe(true);
  });

  it("renders jb-tab as a structural container with triggers and panels", async () => {
    const entry = formElementRegistry.find(candidate => candidate.type === "jb-tab")!;
    const element = createDefaultElement(entry, "profileTabs");
    const renderer = createRenderer(element);

    await renderer.updateComplete;

    const runtime = expectReadyRuntime(renderer, element);
    expect(runtime.localName).toBe("jb-tab");
    expect(runtime.querySelectorAll("jb-tab-trigger")).toHaveLength(2);
    expect(runtime.querySelectorAll("jb-tab-content")).toHaveLength(2);
    expect(runtime.getAttribute("name")).toBeNull();
  });

  it("renders fields inside tab panels and disables inactive fields for active-only validation", async () => {
    const tabEntry = formElementRegistry.find(candidate => candidate.type === "jb-tab")!;
    const inputEntry = formElementRegistry.find(candidate => candidate.type === "jb-input")!;
    const element = createDefaultElement(tabEntry, "audienceTabs");
    if (element.type !== "jb-tab") throw new Error("Expected tab container");
    element.validationScope = "active";
    element.tabs[0].children.push(createDefaultElement(inputEntry, "femaleName") as never);
    element.tabs[1].children.push(createDefaultElement(inputEntry, "maleName") as never);
    const renderer = createRenderer(element);

    await renderer.updateComplete;
    await Promise.resolve();

    const runtime = expectReadyRuntime(renderer, element);
    const panels = runtime.querySelectorAll<HTMLElement>("jb-tab-content");
    const firstInput = panels[0].querySelector<RuntimeField>("jb-input")!;
    const secondInput = panels[1].querySelector<RuntimeField>("jb-input")!;
    expect(firstInput.disabled).toBe(false);
    expect(secondInput.disabled).toBe(true);
  });

  it("renders every happy-dom-compatible real package together in one form", async () => {
    const formDocument = createEmptyFormDocument();
    formDocument.elements = happyDomRenderEntries.map((entry, index) => createDefaultElement(entry, `coverageField${index + 1}`));
    const renderer = document.createElement("jb-form-builder");
    document.body.append(renderer);
    renderer.formDocument = formDocument;

    await renderer.updateComplete;

    expect(renderer.state, renderer.shadowRoot?.textContent ?? "Renderer has no Shadow DOM text.").toBe("ready");
    expect(renderer.shadowRoot?.querySelectorAll("[data-form-element-id]")).toHaveLength(happyDomRenderEntries.length);
    for (const element of formDocument.elements) {
      const runtime = expectReadyRuntime(renderer, element);
      expect(runtime.localName).toBe(element.type);
      expect(runtime.getAttribute("name")).toBe(element.name);
    }
    expect(renderer.reportValidity()).toBe(true);
  });

  it("renders text, image, and voice content without component dependencies", async () => {
    const formDocument = createEmptyFormDocument();
    formDocument.elements = formElementRegistry.filter(entry => entry.isContent).map((entry, index) => createDefaultElement(entry, `content${index + 1}`));
    formDocument.elements[0].props.content = { translations: { en: "Welcome" } };
    formDocument.elements[1].props.url = "https://example.com/hero.jpg";
    formDocument.elements[1].props.alt = { translations: { en: "Hero" } };
    formDocument.elements[2].props.url = "https://example.com/welcome.mp3";
    const renderer = document.createElement("jb-form-builder");
    document.body.append(renderer);
    renderer.formDocument = formDocument;

    await renderer.updateComplete;

    expect(renderer.state).toBe("ready");
    expect(renderer.shadowRoot?.querySelector("p")?.textContent).toBe("Welcome");
    expect(renderer.shadowRoot?.querySelector("img")?.getAttribute("src")).toBe("https://example.com/hero.jpg");
    expect(renderer.shadowRoot?.querySelector("img")?.getAttribute("alt")).toBe("Hero");
    expect(renderer.shadowRoot?.querySelector("audio")?.getAttribute("src")).toBe("https://example.com/welcome.mp3");
    expect(renderer.shadowRoot?.querySelector("audio")?.hasAttribute("controls")).toBe(true);
  });

  it("keeps the real checkbox pointer and Space-key interactions boolean", async () => {
    const checkboxEntry = formElementRegistry.find(entry => entry.type === "jb-checkbox")!;
    const checkbox = createDefaultElement(checkboxEntry, "interactionCheckbox");
    const renderer = createRenderer(checkbox);

    await renderer.updateComplete;

    const runtime = expectReadyRuntime(renderer, checkbox);
    const keyboardTarget = runtime.shadowRoot?.querySelector<HTMLElement>(".jb-checkbox-web-component");
    expect(keyboardTarget).toBeTruthy();
    expect(runtime.value).toBe(false);

    keyboardTarget!.click();
    expect(runtime.checked).toBe(true);
    renderer.reset();
    expect(runtime.checked).toBe(false);

    keyboardTarget!.dispatchEvent(new KeyboardEvent("keydown", { key: " ", bubbles: true }));
    keyboardTarget!.dispatchEvent(new KeyboardEvent("keyup", { key: " ", bubbles: true }));
    expect(runtime.checked).toBe(true);
  });

  it.each(happyDomRenderEntries.filter(entry => entry.commonFields.initialValue))("restores $type to its configured initial value", async (entry: FormElementRegistryEntry) => {
    const element = createDefaultElement(entry, `${entry.defaultName}ResetField`);
    element.initialValue = initialValueByType[entry.type];
    const renderer = createRenderer(element);

    await renderer.updateComplete;

    const runtime = expectReadyRuntime(renderer, element);
    const renderedInitialValue = runtime.value;
    runtime.value = typeof renderedInitialValue === "boolean" ? !renderedInitialValue : "changed-value";
    renderer.reset();

    expect(runtime.value).toEqual(renderedInitialValue);
  });

  it("preserves both initial values for jb-range-input range mode", async () => {
    const entry = formElementRegistry.find(candidate => candidate.type === "jb-range-input")!;
    const element = createDefaultElement(entry, "priceRange");
    element.props.mode = "range";
    element.initialValue = [2, 8];
    const renderer = createRenderer(element);

    await renderer.updateComplete;

    const runtime = expectReadyRuntime(renderer, element);
    expect(runtime.value).toEqual([2, 8]);
    expect(runtime.initialValue).toEqual([2, 8]);
  });

  it("applies the portable jb-range-input digit configuration", async () => {
    const entry = formElementRegistry.find(candidate => candidate.type === "jb-range-input")!;
    const element = createDefaultElement(entry, "localizedRange");
    element.props.showPersianNumber = true;
    const renderer = createRenderer(element);

    await renderer.updateComplete;

    const runtime = expectReadyRuntime(renderer, element);
    expect(runtime.showPersianNumber).toBe(true);

  });

  it.each(happyDomRenderEntries.filter(entry => entry.commonFields.disabled))("applies the disabled state to $type", async (entry: FormElementRegistryEntry) => {
    const element = createDefaultElement(entry, `${entry.defaultName}DisabledField`);
    element.disabled = true;
    const renderer = createRenderer(element);

    await renderer.updateComplete;

    const runtime = expectReadyRuntime(renderer, element);
    expect(runtime.disabled).toBe(true);
    expect(runtime.hasAttribute("disabled")).toBe(true);
  });

  it("keeps every registry component represented by the real-package suite", () => {
    expect(formElementRegistry).toHaveLength(22);
    expect(new Set(formElementRegistry.map(entry => entry.type)).size).toBe(22);
    expect(Object.keys(configurationByType)).toHaveLength(22);
  });
});
