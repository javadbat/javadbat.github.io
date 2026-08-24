// @vitest-environment happy-dom

import { cleanup, fireEvent, render, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { JBFormDocumentV1 } from "../domain/form-document";
import { formAppMessages } from "../i18n/locale-adapter";
import { PreviewFormPanel } from "./PreviewFormPanel";

const renderer = vi.hoisted(() => ({
  values: { name: "Ada", subscribed: true },
}));

vi.mock("jb-button/react", () => ({
  JBButton: ({ children, onClick, disabled }: { children: ReactNode; onClick?: () => void; disabled?: boolean }) => (
    <button type="button" disabled={disabled} onClick={onClick}>{children}</button>
  ),
}));

vi.mock("jb-modal/react", () => ({
  JBModal: ({ isOpen, children, label }: { isOpen?: boolean; children: ReactNode; label?: string }) =>
    isOpen ? <div role="dialog" aria-label={label}>{children}</div> : null,
}));

vi.mock("../../../components/react/components/modal/ModalCloseButton", () => ({
  ModalCloseButton: ({ label, onClick }: { label: string; onClick: () => void }) => (
    <button type="button" aria-label={label} onClick={onClick} />
  ),
}));

vi.mock("jb-form-builder/react", async () => {
  const React = await import("react");
  return {
    JBFormBuilder: React.forwardRef(function MockFormBuilder(
      { onReady, onSubmitValue }: { onReady?: () => void; onSubmitValue?: (event: CustomEvent) => void },
      ref,
    ) {
      React.useImperativeHandle(ref, () => ({
        updateComplete: Promise.resolve(),
        form: {
          jbCheckValidity: async () => ({ isAllValid: true }),
        },
        getFormValues: () => renderer.values,
        reset: vi.fn(),
      }));
      React.useEffect(() => onReady?.(), [onReady]);
      return (
        <button
          type="button"
          onClick={() => onSubmitValue?.(new CustomEvent("submit", { detail: { value: renderer.values } }))}
        >
          Rendered submit
        </button>
      );
    }),
  };
});

vi.mock("jb-form-builder/dependency-loader", () => ({ loadDependencies: vi.fn() }));

const document = {} as JBFormDocumentV1;

afterEach(cleanup);

beforeEach(() => {
  Object.defineProperties(URL, {
    createObjectURL: {
      configurable: true,
      value: vi.fn(() => "blob:form-result"),
    },
    revokeObjectURL: {
      configurable: true,
      value: vi.fn(),
    },
  });
});

function renderPanel() {
  return render(
    <PreviewFormPanel
      document={document}
      locale="en"
      accessibleName="Test form"
      messages={formAppMessages.en}
    />,
  );
}

describe("PreviewFormPanel", () => {
  it("opens a modal with pretty JSON after the preview submit action validates", async () => {
    const view = renderPanel();

    const submitButton = view.getByText(formAppMessages.en.submitForm) as HTMLButtonElement;
    await waitFor(() => expect(submitButton.disabled).toBe(false));
    fireEvent.click(submitButton);

    const dialog = await view.findByRole("dialog", { name: formAppMessages.en.formResult });
    expect(dialog.textContent).toContain('"name": "Ada"');
    expect(dialog.textContent).toContain('"subscribed": true');
  });

  it("shows values when a valid submit comes from the rendered form", async () => {
    const view = renderPanel();

    fireEvent.click(view.getByText("Rendered submit"));

    expect(await view.findByRole("dialog", { name: formAppMessages.en.formResult })).toBeTruthy();
  });

  it("downloads the submitted values as JSON from the result modal", async () => {
    const click = vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(() => undefined);
    const view = renderPanel();

    const submitButton = view.getByText(formAppMessages.en.submitForm) as HTMLButtonElement;
    await waitFor(() => expect(submitButton.disabled).toBe(false));
    fireEvent.click(submitButton);
    fireEvent.click(await view.findByText(formAppMessages.en.downloadJson));

    expect(URL.createObjectURL).toHaveBeenCalledOnce();
    expect(click).toHaveBeenCalledOnce();
    expect(URL.revokeObjectURL).toHaveBeenCalledWith("blob:form-result");
  });
});
