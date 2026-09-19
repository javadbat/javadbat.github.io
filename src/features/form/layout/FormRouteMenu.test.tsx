// @vitest-environment happy-dom

import { renderForm as render } from "../i18n/test-utils";

import { act, cleanup } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { formI18n } from "../i18n/i18n";
import { formResources } from "../i18n/resources";
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
beforeEach(async () => { await formI18n.changeLanguage("en"); });

// happy-dom lacks Web Animations; actual close timing is covered in browser tests.
if (typeof Element.prototype.animate !== "function") {
  Element.prototype.animate = () => ({
    finished: Promise.resolve(),
    cancel() {},
  }) as unknown as Animation;
}

describe("FormRouteMenu", () => {
  it("keeps interface language and form content language independent", () => {
    const onContentLanguageChange = vi.fn();
    const view = render(<FormRouteMenu
      currentPage="builder"
      contentLanguage="en"
      contentLanguageOptions={[{ value: "en", label: "EN" }, { value: "fa", label: "FA" }]}
      onContentLanguageChange={onContentLanguageChange}
    />);
    const content = view.container.querySelector('jb-select[name="formRouteLanguageContent"]') as HTMLElement & { value: string };
    const interfaceLanguage = view.container.querySelector('jb-select[name="formRouteLanguage"]') as HTMLElement & { value: string };

    act(() => { content.value = "fa"; content.dispatchEvent(new Event("change")); });
    expect(onContentLanguageChange).toHaveBeenCalledWith("fa");
    expect(formI18n.resolvedLanguage).toBe("en");

    onContentLanguageChange.mockClear();
    act(() => { interfaceLanguage.value = "fa"; interfaceLanguage.dispatchEvent(new Event("change")); });
    expect(formI18n.resolvedLanguage).toBe("fa");
    expect(onContentLanguageChange).not.toHaveBeenCalled();
  });
  it("preserves route context and identifies the active link in both responsive renderings", () => {
    const view = render(
      <FormRouteMenu
        currentPage="designer"
        formSlug="customer-survey"
        themeSlug="ocean"
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
    const view = render(
      <FormRouteMenu currentPage="builder" />,
    );
    const trigger = view.getByRole("button", { name: formResources.en.formRouteMenu.openFormNavigation });

    act(() => trigger.click());
    expect(trigger.getAttribute("aria-expanded")).toBe("true");

    const mobileSelect = view.container.querySelector<HTMLElement>('jb-select[name="formRouteMobileLanguage"]') as HTMLElement & { value: string };
    act(() => {
      mobileSelect.value = "fa";
      mobileSelect.dispatchEvent(new Event("change"));
    });

    expect(formI18n.resolvedLanguage).toBe("fa");
    expect(trigger.getAttribute("aria-expanded")).toBe("false");
  });
});
