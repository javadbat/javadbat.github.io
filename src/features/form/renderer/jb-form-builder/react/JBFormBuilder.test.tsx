// @vitest-environment happy-dom

import { render, waitFor } from "@testing-library/react";
import { createRef } from "react";
import { describe, expect, it, vi } from "vitest";
import { createEmptyFormDocument } from "../../../domain/form-document";
import type { JBFormBuilderElement } from "../types";
import { JBFormBuilder } from "./JBFormBuilder";

describe("JBFormBuilder React wrapper", () => {
  it("assigns object properties, forwards the host ref, and bridges events", async () => {
    const documentValue = createEmptyFormDocument();
    const ref = createRef<JBFormBuilderElement>();
    const onReady = vi.fn();
    const { container } = render(<JBFormBuilder ref={ref} formDocument={documentValue} autoImport={false} locale="fa" onReady={onReady} aria-label="Wrapped form" />);

    const host = container.querySelector("jb-form-builder") as JBFormBuilderElement;
    await waitFor(() => {
      expect(ref.current).toBe(host);
      expect(host.formDocument?.id).toBe(documentValue.id);
      expect(host.autoImport).toBe(false);
      expect(host.locale).toBe("fa");
    });

    host.dispatchEvent(
      new CustomEvent("ready", {
        detail: {
          documentId: documentValue.id,
          state: "ready",
          value: {},
        },
      }),
    );

    expect(onReady).toHaveBeenCalledOnce();
    expect(host.getAttribute("aria-label")).toBe("Wrapped form");
    expect(host.getAttribute("auto-import")).toBe("false");
  });
});
