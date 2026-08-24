// @vitest-environment happy-dom

import { act, cleanup, renderHook } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { i18n } from "jb-core/i18n";
import { formAppI18n, useFormLocale } from "./locale-adapter";

describe("form application i18next adapter", () => {
  const originalLocale = i18n.locale;

  afterEach(() => {
    cleanup();
    localStorage.clear();
    void formAppI18n.changeLanguage("en");
    i18n.setLocale(originalLocale);
  });

  it("resolves the active i18next locale and configures JB components", async () => {
    localStorage.setItem("jb-form:locale", "fa");
    await formAppI18n.changeLanguage("fa");
    const route = renderHook(() => useFormLocale("en"));

    expect(route.result.current.messages.save).toBe("ذخیره");
    expect(i18n.locale.calendar).toBe("persian");
    expect(i18n.locale.numberingSystem).toBe("latn");
  });

  it("uses the i18next English fallback", () => {
    expect(formAppI18n.t("save", { lng: "de" })).toBe("Save");
  });

  it("persists one interface locale across all form routes", () => {
    const firstRoute = renderHook(() => useFormLocale("en"));

    act(() => firstRoute.result.current.setLocale("fa"));
    firstRoute.unmount();

    const nextRoute = renderHook(() => useFormLocale("en"));
    expect(nextRoute.result.current.locale).toBe("fa");
    expect(nextRoute.result.current.direction).toBe("rtl");
  });
});
