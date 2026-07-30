// @vitest-environment happy-dom

import { afterEach, describe, expect, it } from "vitest";
import { i18n } from "jb-core/i18n";
import { formAppDictionary } from "./locale-adapter";

describe("form application JBDictionary", () => {
  const originalLocale = i18n.locale;

  afterEach(() => {
    i18n.setLocale(originalLocale);
  });

  it("resolves the active JB locale", () => {
    i18n.setLocale(new Intl.Locale("fa"));

    expect(formAppDictionary.get(i18n, "save")).toBe("ذخیره");
  });

  it("uses the JBDictionary English fallback", () => {
    i18n.setLocale(new Intl.Locale("de"));

    expect(formAppDictionary.get(i18n, "save")).toBe("Save");
  });
});
