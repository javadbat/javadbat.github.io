// @vitest-environment happy-dom

import { render } from "@testing-library/react";
import type { ReactNode } from "react";
import { describe, expect, it, vi } from "vitest";
import { ModalLoadingFallback } from "./ModalLoadingFallback";

vi.mock("jb-modal/react", () => ({
  JBModal: ({ isOpen, label, children }: { isOpen?: boolean; label?: string; children: ReactNode }) =>
    isOpen ? (
      <div role="dialog" aria-label={label}>
        {children}
      </div>
    ) : null,
}));

vi.mock("jb-loading/react", () => ({
  JBLoading: () => <jb-loading data-testid="modal-spinner" />,
}));

describe("ModalLoadingFallback", () => {
  it("renders a loading spinner and a text row inside a sized modal", () => {
    const view = render(<ModalLoadingFallback label="Loading dialog…" />);
    const dialog = view.getByRole("dialog", { name: "Loading dialog…" });
    const status = view.getByRole("status");
    const spinner = view.getByTestId("modal-spinner");

    expect(dialog.contains(status)).toBe(true);
    expect(status.getAttribute("slot")).toBe("content");
    expect(status.getAttribute("aria-busy")).toBe("true");
    expect(spinner.nextElementSibling?.textContent).toBe("Loading dialog…");
  });
});
