// @vitest-environment happy-dom

import "jb-form";
import "jb-input";
import { beforeEach, describe, expect, it } from "vitest";
import { createEmptyFormDocument, localizedText } from "../../domain/form-document";
import { createDefaultElement, formElementRegistry } from "../../registry/form-element-registry";
import { defineJBFormBuilder } from "./define";
import type { JBFormBuilderElement } from "./types";

defineJBFormBuilder();

// happy-dom implements ElementInternals but not the CustomStateSet used by JB
// inputs. Keep the polyfill local to this integration test so the real
// component code reaches its validation path without changing production DOM.
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
  if (!("states" in internals)) {
    Object.defineProperty(internals, "states", {
      configurable: true,
      value: new Set<string>(),
    });
  }
  return internals;
};

interface RuntimeInput extends HTMLElement {
  value: string;
  validationMessage: string;
  validation: {
    list: unknown[];
  };
}

function createValidationRenderer(): JBFormBuilderElement {
  const renderer = document.createElement("jb-form-builder");
  // Real dependencies are registered explicitly above. Manual mode keeps this
  // integration test deterministic and isolates validation from package loading.
  renderer.autoImport = false;
  document.body.append(renderer);
  return renderer;
}

beforeEach(() => {
  document.body.replaceChildren();
});

describe("jb-form-builder validation integration", () => {
  it("runs portable rules through a real jb-input and jb-form", async () => {
    const documentValue = createEmptyFormDocument();
    const inputEntry = formElementRegistry.find(entry => entry.type === "jb-input")!;
    const input = createDefaultElement(inputEntry, "inviteCode");
    input.initialValue = "wrong";
    input.validation = [
      {
        id: crypto.randomUUID(),
        rule: "pattern",
        params: { source: "^accepted$", flags: "u" },
        message: localizedText("Enter the accepted code."),
      },
    ];
    documentValue.elements = [input];

    const renderer = createValidationRenderer();
    renderer.formDocument = documentValue;
    await renderer.updateComplete;

    const runtimeInput = renderer.shadowRoot?.querySelector<RuntimeInput>("jb-input");
    expect(renderer.shadowRoot?.querySelector('[part="error-summary"]')?.textContent).toBe("");
    expect(renderer.state).toBe("ready");
    expect(runtimeInput?.validation.list).toHaveLength(1);
    expect(renderer.checkValidity()).toBe(false);
    expect(renderer.reportValidity()).toBe(false);
    expect(runtimeInput?.validationMessage).toBe("Enter the accepted code.");
    expect(runtimeInput?.shadowRoot?.querySelector('[part="message"]')?.textContent).toBe("Enter the accepted code.");
    await expect(renderer.checkValidityAsync(true)).resolves.toBe(false);

    runtimeInput!.value = "accepted";
    expect(renderer.checkValidity()).toBe(true);
    await expect(renderer.checkValidityAsync(true)).resolves.toBe(true);
  });
});
