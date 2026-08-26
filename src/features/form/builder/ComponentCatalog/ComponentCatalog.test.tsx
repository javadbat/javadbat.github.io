// @vitest-environment happy-dom

import { fireEvent, render } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { formAppMessages } from "../../i18n/locale-adapter";
import { formElementRegistry } from "../../registry/form-element-registry";
import { ComponentCatalog } from "./ComponentCatalog";

const addCatalogElement = vi.fn();
const announce = vi.fn();
const store = {
  editingLocale: "en",
  document: { elements: [] as unknown[] },
  addCatalogElement,
  getElementPosition: () => 0,
  announce,
};

vi.mock("../store/BuilderStoreContext", () => ({
  useBuilderStore: () => store,
}));

vi.mock("jb-button/react", () => ({
  JBButton: ({ children, ...props }: React.ButtonHTMLAttributes<HTMLButtonElement>) => <button {...props}>{children}</button>,
}));

vi.mock("jb-input/react", () => ({
  JBInput: ({ children, onInput, ...props }: React.InputHTMLAttributes<HTMLInputElement>) => (
    <label>
      <input {...props} onInput={onInput} />
      {children}
    </label>
  ),
}));

vi.mock("../../CatalogIcon/CatalogIcon", () => ({ CatalogIcon: () => <span aria-hidden="true" /> }));

describe("ComponentCatalog", () => {
  it("adds every registered component through its accessible Add action", () => {
    addCatalogElement.mockImplementation(entry => {
      store.document.elements.push({ type: entry.type });
      return `${entry.type}-${store.document.elements.length}`;
    });

    const view = render(<ComponentCatalog messages={formAppMessages.en} />);
    const buttons = view.getAllByRole("button", { name: /^Add / });

    expect(buttons).toHaveLength(formElementRegistry.length);

    buttons.forEach(button => fireEvent.click(button));

    expect(addCatalogElement).toHaveBeenCalledTimes(formElementRegistry.length);
    expect(new Set(addCatalogElement.mock.calls.map(([entry]) => entry.type))).toEqual(new Set(formElementRegistry.map(entry => entry.type)));
    expect(store.document.elements).toHaveLength(formElementRegistry.length);
    expect(announce).toHaveBeenCalledTimes(formElementRegistry.length);
  });
});
