// @vitest-environment happy-dom

import { render, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { Form404App } from "./Form404App";

vi.mock("../builder/BuilderApp/BuilderApp", () => ({ BuilderApp: () => <main>Builder</main> }));
vi.mock("../designer/DesignerPlaceholderApp", () => ({ DesignerPlaceholderApp: () => <main>Designer</main> }));
vi.mock("../preview/PreviewApp", () => ({ PreviewApp: () => <main>Preview</main> }));

describe("Form404App", () => {
  afterEach(() => {
    window.history.replaceState({}, "", "/");
    document.title = "";
  });

  it.each([
    ["/form/builder/form1", "JB Form Builder"],
    ["/form/designer/form1", "JB Form Designer"],
    ["/form/preview/form1", "JB Form Preview"],
  ])("replaces the fallback title for %s", async (pathname, expectedTitle) => {
    window.history.replaceState({}, "", pathname);
    document.title = "Page not found";

    render(<Form404App />);

    await waitFor(() => expect(document.title).toBe(expectedTitle));
  });

  it("retains the not-found title for unrelated paths", async () => {
    window.history.replaceState({}, "", "/missing");
    document.title = "Page not found";

    render(<Form404App />);

    await waitFor(() => expect(document.title).toBe("Page not found"));
  });
});
