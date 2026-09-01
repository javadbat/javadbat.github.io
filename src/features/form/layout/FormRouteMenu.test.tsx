// @vitest-environment happy-dom

import { act, cleanup, render } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { formAppMessages } from "../i18n/locale-adapter";
import { FormRouteMenu } from "./FormRouteMenu";

if (typeof HTMLElement.prototype.attachInternals !== "function") {
  HTMLElement.prototype.attachInternals = () => ({
    states: new Set<string>(),
    form: null,
    validationMessage: "",
    setFormValue: () => undefined,
    setValidity: () => undefined,
  }) as unknown as ElementInternals;
}
if (!("part" in Element.prototype)) {
  Object.defineProperty(Element.prototype, "part", {
    configurable: true,
    get(this: Element) {
      return { add: (...values: string[]) => this.setAttribute("part", values.join(" ")) };
    },
  });
}

afterEach(cleanup);

describe("FormRouteMenu", () => {
  it("preserves route context and identifies the active link in both responsive renderings", () => {
    const view = render(
      <FormRouteMenu
        currentPage="designer"
        messages={formAppMessages.en}
        formSlug="customer-survey"
        themeSlug="ocean"
        language="en"
        onLanguageChange={() => undefined}
      />,
    );

    const links = Array.from(view.container.querySelectorAll<HTMLAnchorElement>("a"));
    expect(links.filter(link => link.getAttribute("href") === "/form")).toHaveLength(2);
    expect(links.filter(link => link.getAttribute("href") === "/form/builder?form=customer-survey")).toHaveLength(2);
    expect(links.filter(link => link.getAttribute("href") === "/form/designer?form=customer-survey&theme=ocean")).toHaveLength(2);
    expect(links.filter(link => link.getAttribute("aria-current") === "page")).toHaveLength(2);
    expect(links.every(link => link.querySelector("svg"))).toBe(true);
  });

  it("opens the mobile popover and closes it after changing language", () => {
    const onLanguageChange = vi.fn();
    const view = render(
      <FormRouteMenu currentPage="builder" messages={formAppMessages.en} language="en" onLanguageChange={onLanguageChange} />,
    );
    const trigger = view.getByRole("button", { name: formAppMessages.en.openFormNavigation });

    act(() => trigger.click());
    expect(trigger.getAttribute("aria-expanded")).toBe("true");

    const mobileSelect = view.container.querySelector<HTMLElement>('jb-select[name="formRouteMobileLanguage"]') as HTMLElement & { value: string };
    act(() => {
      mobileSelect.value = "fa";
      mobileSelect.dispatchEvent(new Event("change"));
    });

    expect(onLanguageChange).toHaveBeenCalledWith("fa");
    expect(trigger.getAttribute("aria-expanded")).toBe("false");
  });
});
