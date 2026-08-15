// @vitest-environment happy-dom

import { fireEvent, render } from "@testing-library/react";
import type { ReactNode } from "react";
import { describe, expect, it, vi } from "vitest";
import { createEmptyFormDocument } from "../../domain/form-document";
import { formAppMessages } from "../../i18n/locale-adapter";
import { BuilderStore } from "../store/BuilderStore";
import { BuilderStoreProvider } from "../store/BuilderStoreContext";
import { ImportJsonModal } from "./ImportJsonModal";

vi.mock("../../../../components/react/components/modal/ClientJBModal", () => ({
  ClientJBModal: ({ isOpen, children }: { isOpen?: boolean; children: ReactNode }) => (isOpen ? <div>{children}</div> : null),
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

describe("ImportJsonModal", () => {
  it("checks pasted JSON against the form schema before importing it", () => {
    const store = new BuilderStore();
    const imported = createEmptyFormDocument();
    imported.metadata.name.translations.en = "Imported from paste";
    const onClose = vi.fn();
    const view = render(
      <BuilderStoreProvider value={store}>
        <ImportJsonModal isOpen messages={formAppMessages.en} onClose={onClose} />
      </BuilderStoreProvider>,
    );
    const textarea = view.container.querySelector<HTMLElement>('jb-textarea[name="importJson"]')!;

    fireEvent.input(textarea, { target: { value: "{broken" } });
    expect(view.container.querySelector("[role='alert']")?.textContent).toContain("not valid JSON");

    fireEvent.input(textarea, { target: { value: JSON.stringify(imported) } });
    expect(view.container.querySelector("[role='status']")?.textContent).toContain("matches the form schema");

    fireEvent.click(view.container.querySelector<HTMLElement>('jb-button[color="primary"]')!);
    expect(store.formName).toBe("Imported from paste");
    expect(onClose).toHaveBeenCalledOnce();
  });
});
