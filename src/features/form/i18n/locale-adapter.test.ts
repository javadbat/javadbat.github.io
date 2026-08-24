// @vitest-environment happy-dom

import { act, cleanup, renderHook } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { i18n } from "jb-core/i18n";
import { formAppDictionary, useFormLocale } from "./locale-adapter";

describe("form application JBDictionary", () => {
  const originalLocale = i18n.locale;

  afterEach(() => {
    cleanup();
    localStorage.clear();
    i18n.setLocale(originalLocale);
  });

  it("resolves the active JB locale", () => {
    i18n.setLocale("fa");

    expect(formAppDictionary.get(i18n, "save")).toBe("ذخیره");
    expect(i18n.locale.calendar).toBe("persian");
    expect(i18n.locale.numberingSystem).toBe("latn");
  });

  it("uses the JBDictionary English fallback", () => {
    i18n.setLocale("de");

    expect(formAppDictionary.get(i18n, "save")).toBe("Save");
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
