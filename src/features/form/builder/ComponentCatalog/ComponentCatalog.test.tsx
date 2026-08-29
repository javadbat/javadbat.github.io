// @vitest-environment happy-dom

import { act, cleanup, fireEvent, render } from "@testing-library/react";
import { makeObservable, observable, runInAction } from "mobx";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { formAppMessages } from "../../i18n/locale-adapter";
import { formElementRegistry, getFormElementDescription, getFormElementDisplayName } from "jb-form-builder/registry/form-element-registry";
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
makeObservable(store, { editingLocale: observable });

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
  beforeEach(() => {
    runInAction(() => {
      store.editingLocale = "en";
    });
    store.document.elements.length = 0;
    addCatalogElement.mockReset();
    announce.mockReset();
  });
  afterEach(cleanup);

  it("updates component names when the editing locale changes", () => {
    const entry = formElementRegistry[0];
    const view = render(<ComponentCatalog messages={formAppMessages.en} />);

    expect(view.getByRole("button", { name: `Add ${getFormElementDisplayName(entry, "en")}` })).toBeTruthy();

    act(() => {
      runInAction(() => {
        store.editingLocale = "fa";
      });
    });

    expect(view.getByRole("button", { name: `Add ${getFormElementDisplayName(entry, "fa")}` })).toBeTruthy();
    expect(view.getByText(getFormElementDescription(entry, "fa"))).toBeTruthy();
  });

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
