// @vitest-environment happy-dom

import { act, cleanup, render, renderHook } from "@testing-library/react";
import { useTranslation } from "react-i18next";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { i18n as jbI18n } from "jb-core/i18n";
import { FormI18nProvider } from "./FormI18nProvider";
import { formI18n } from "./i18n";
import { formResources } from "./resources";

describe("form page locale boundary", () => {
  const originalJbLocale = jbI18n.locale;

  beforeEach(async () => {
    localStorage.clear();
    await formI18n.changeLanguage("en");
  });

  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
    localStorage.clear();
    jbI18n.setLocale(originalJbLocale);
  });

  it("restores one preference for component copy, shared copy, document semantics, and JB defaults", () => {
    localStorage.setItem("jb-form:locale", "fa");
    const route = renderHook(() => {
      const { t } = useTranslation("builderHeader");
      const { t: tCommon } = useTranslation("common");
      return { saved: t("saved"), save: tCommon("save") };
    }, { wrapper: FormI18nProvider });

    expect(route.result.current).toEqual({
      saved: formResources.fa.builderHeader.saved,
      save: formResources.fa.common.save,
    });
    expect(document.documentElement.lang).toBe("fa");
    expect(document.documentElement.dir).toBe("rtl");
    expect(jbI18n.locale.calendar).toBe("persian");
    expect(jbI18n.locale.numberingSystem).toBe("latn");
  });

  it("updates every namespace while synchronizing JB once, regardless of consumer count", async () => {
    function Copy() {
      const { t } = useTranslation("builderHeader");
      const { t: tCommon } = useTranslation("common");
      return <p>{t("saved")} / {tCommon("save")}</p>;
    }
    const synchronize = vi.spyOn(jbI18n, "setLocale");
    const page = render(<FormI18nProvider><Copy /><Copy /><Copy /></FormI18nProvider>);
    synchronize.mockClear();

    await act(() => formI18n.changeLanguage("fa"));

    expect(page.getAllByText(`${formResources.fa.builderHeader.saved} / ${formResources.fa.common.save}`)).toHaveLength(3);
    expect(synchronize).toHaveBeenCalledTimes(1);
    expect(synchronize).toHaveBeenCalledWith("fa");
    expect(localStorage.getItem("jb-form:locale")).toBe("fa");

    page.unmount();
    synchronize.mockClear();
    await formI18n.changeLanguage("en");
    expect(synchronize).not.toHaveBeenCalled();
  });

  it("restores the saved choice after navigating to another form page", async () => {
    const firstPage = render(<FormI18nProvider><span /></FormI18nProvider>);
    await act(() => formI18n.changeLanguage("fa"));
    firstPage.unmount();
    await formI18n.changeLanguage("en");

    const nextPage = renderHook(() => useTranslation("common"), { wrapper: FormI18nProvider });
    expect(nextPage.result.current.t("save")).toBe(formResources.fa.common.save);
    expect(document.documentElement.dir).toBe("rtl");
  });

  it("uses the configured default for invalid preferences and unavailable storage", async () => {
    localStorage.setItem("jb-form:locale", "unsupported");
    const page = render(<FormI18nProvider><span /></FormI18nProvider>);
    expect(formI18n.resolvedLanguage).toBe("en");
    page.unmount();

    vi.spyOn(Storage.prototype, "getItem").mockImplementation(() => { throw new Error("blocked"); });
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => { throw new Error("blocked"); });
    render(<FormI18nProvider><span /></FormI18nProvider>);
    await act(() => formI18n.changeLanguage("fa"));
    expect(document.documentElement.dir).toBe("rtl");
  });

  it("uses native interpolation and the English fallback", () => {
    expect(formI18n.getFixedT("en", "designerCommon")("designerControlHeightLabel", { size: "Medium" })).toContain("Medium");
    expect(formI18n.t("save", { lng: "de", ns: "common" })).toBe("Save");
  });
});
