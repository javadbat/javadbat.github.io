// @vitest-environment happy-dom

import { fireEvent, render } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { formAppMessages } from "../../i18n/locale-adapter";
import { BuilderWorkspace } from "./BuilderWorkspace";

vi.mock("../ComponentCatalog/ComponentCatalog", () => ({
  ComponentCatalog: ({ onElementAdded }: { onElementAdded?: (elementId: string) => void }) => (
    <aside data-panel="catalog">
      <button type="button" onClick={() => onElementAdded?.("added-id")}>
        Add mock field
      </button>
    </aside>
  ),
}));
vi.mock("../FormCanvas/FormCanvas", () => ({
  FormCanvas: ({ onSelectElement, onConfigureElement }: { onSelectElement?: (elementId: string) => void; onConfigureElement?: (elementId: string) => void }) => (
    <main data-panel="canvas">
      <button type="button" onClick={() => onSelectElement?.("selected-id")}>
        Select mock field
      </button>
      <button type="button" onClick={() => onConfigureElement?.("selected-id")}>
        Configure mock field
      </button>
    </main>
  ),
}));
vi.mock("../ConfigurationPanel/ConfigurationPanel", () => ({ ConfigurationPanel: () => <aside data-panel="properties" /> }));

describe("BuilderWorkspace", () => {
  it("switches between the three mobile workspace panels", () => {
    const view = render(<BuilderWorkspace messages={formAppMessages.en} />);
    const workspace = view.container.querySelector<HTMLElement>("[data-mobile-panel]");
    const mobileTabs = view.container.querySelector<HTMLElement>("nav[aria-label='Mobile workspace panels']");
    const buttons = mobileTabs?.querySelectorAll<HTMLElement>("jb-button");

    expect(workspace?.dataset.mobilePanel).toBe("canvas");
    expect(buttons).toHaveLength(3);
    expect(buttons?.[1].getAttribute("aria-pressed")).toBe("true");

    fireEvent.click(buttons![0]);
    expect(workspace?.dataset.mobilePanel).toBe("catalog");
    expect(buttons?.[0].getAttribute("aria-pressed")).toBe("true");

    fireEvent.click(buttons![2]);
    expect(workspace?.dataset.mobilePanel).toBe("properties");
  });

  it("advances touch workflows after adding and configuring a field", () => {
    const view = render(<BuilderWorkspace messages={formAppMessages.en} />);
    const workspace = view.container.querySelector<HTMLElement>("[data-mobile-panel]");
    const mobileButtons = view.container.querySelectorAll<HTMLElement>("nav[aria-label='Mobile workspace panels'] jb-button");
    const compactButtons = view.container.querySelectorAll<HTMLElement>("nav[aria-label='Side panels'] jb-button");

    fireEvent.click(mobileButtons[0]);
    expect(workspace?.dataset.mobilePanel).toBe("catalog");

    fireEvent.click(view.container.querySelector<HTMLElement>("[data-panel='catalog'] button")!);
    expect(workspace?.dataset.mobilePanel).toBe("canvas");

    fireEvent.click(view.container.querySelectorAll<HTMLElement>("[data-panel='canvas'] button")[1]);
    expect(workspace?.dataset.mobilePanel).toBe("properties");
    expect(workspace?.dataset.sidePanel).toBe("properties");
    expect(compactButtons[1].getAttribute("aria-pressed")).toBe("true");
  });

  it("keeps the mobile canvas open when a field is only selected", () => {
    const view = render(<BuilderWorkspace messages={formAppMessages.en} />);
    const workspace = view.container.querySelector<HTMLElement>("[data-mobile-panel]");

    fireEvent.click(view.container.querySelectorAll<HTMLElement>("[data-panel='canvas'] button")[0]);

    expect(workspace?.dataset.mobilePanel).toBe("canvas");
    expect(workspace?.dataset.sidePanel).toBe("properties");
  });
});
