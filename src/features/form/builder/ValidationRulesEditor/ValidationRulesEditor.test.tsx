// @vitest-environment happy-dom

import { cleanup, fireEvent, render, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { formAppMessages } from "../../i18n/locale-adapter";
import { formElementRegistry } from "../../registry/form-element-registry";
import { BuilderStore } from "../store/BuilderStore";
import { BuilderStoreProvider } from "../store/BuilderStoreContext";
import { ValidationRulesEditor } from "./ValidationRulesEditor";

vi.mock("jb-modal/react", () => ({
  JBModal: ({ isOpen, label, children }: { isOpen?: boolean; label?: string; children: ReactNode }) =>
    isOpen ? (
      <div role="dialog" aria-label={label}>
        {children}
      </div>
    ) : null,
}));

vi.mock("jb-select/react", () => ({
  JBSelect: ({ name, value, onChange, children }: { name?: string; value?: string; onChange?: (event: { target: { value: string } }) => void; children: ReactNode }) => (
    <select name={name} value={value} onChange={event => onChange?.({ target: { value: event.target.value } })}>
      {children}
    </select>
  ),
}));

vi.mock("jb-select/option/react", () => ({
  JBOption: ({ value, children }: { value?: string; children: ReactNode }) => <option value={value}>{children}</option>,
}));

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
  Element.prototype.animate = () => ({ cancel: () => undefined, play: () => undefined }) as unknown as Animation;
}

afterEach(cleanup);

describe("ValidationRulesEditor", () => {
  it("keeps rule editing in a modal and leaves a compact summary in the sidebar", async () => {
    const store = new BuilderStore();
    const inputEntry = formElementRegistry.find(entry => entry.type === "jb-input")!;
    const elementId = store.addElement(inputEntry);
    store.selectElement(elementId);

    const view = render(
      <BuilderStoreProvider value={store}>
        <ValidationRulesEditor locale="en" messages={formAppMessages.en} supportedRules={inputEntry.validationRules} />
      </BuilderStoreProvider>,
    );

    expect(view.queryByRole("dialog")).toBeNull();
    expect(view.container.querySelector('select[name="newValidationRule"]')).toBeNull();

    fireEvent.click(view.getByText(formAppMessages.en.addValidation));
    expect(await view.findByRole("dialog", { name: formAppMessages.en.validationRules })).toBeTruthy();
    expect(view.container.querySelector('select[name="newValidationRule"]')).toBeTruthy();

    fireEvent.click(view.getByText(formAppMessages.en.addRule));
    expect(store.selectedElement?.validation[0]?.rule).toBe("minLength");
    expect(view.container.querySelector('jb-input[name^="validation-value-"]')).toBeTruthy();

    fireEvent.click(view.getByText(formAppMessages.en.done));
    expect(view.queryByRole("dialog")).toBeNull();
    expect(view.getByText(formAppMessages.en.manageValidation)).toBeTruthy();
    expect(view.getByText("Minimum length")).toBeTruthy();
  });

  it("shows a Regex101 guide link in the pattern input message", async () => {
    const store = new BuilderStore();
    const inputEntry = formElementRegistry.find(entry => entry.type === "jb-input")!;
    const elementId = store.addElement(inputEntry);
    store.selectElement(elementId);
    store.addSelectedValidationRule("pattern");

    const view = render(
      <BuilderStoreProvider value={store}>
        <ValidationRulesEditor locale="en" messages={formAppMessages.en} supportedRules={inputEntry.validationRules} />
      </BuilderStoreProvider>,
    );

    const manageButton = Array.from(view.container.querySelectorAll("jb-button")).find(button => button.textContent === formAppMessages.en.manageValidation)!;
    fireEvent.click(manageButton);
    await view.findByRole("dialog", { name: formAppMessages.en.validationRules });
    const patternInput = await waitFor(() => {
      const input = view.container.querySelector('jb-input[name^="validation-source-"]');
      expect(input).toBeTruthy();
      return input;
    });

    expect(patternInput?.getAttribute("message")).toContain("https://regex101.com/?flavor=javascript");
    expect(patternInput?.getAttribute("message")).toContain(formAppMessages.en.openRegexBuilder);
  });
});
