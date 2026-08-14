// @vitest-environment happy-dom

import { describe, expect, it } from "vitest";
import { BuilderStore } from "../BuilderStore";
import { copyLocaleDefinitions } from "./FormSettingsModal";

describe("FormSettingsModal locale drafts", () => {
  it("copies observable locale definitions into detached plain objects", () => {
    const store = new BuilderStore();

    store.setFormLocalization({
      defaultLocale: "en",
      locales: {
        en: { direction: "ltr" },
        fa: { direction: "rtl" },
      },
    });

    const draft = copyLocaleDefinitions(store.document.localization.locales);

    expect(draft).toEqual({
      en: { direction: "ltr" },
      fa: { direction: "rtl" },
    });
    expect(() => structuredClone(draft)).not.toThrow();

    draft.fa.direction = "ltr";
    expect(store.document.localization.locales.fa.direction).toBe("rtl");
  });
});
