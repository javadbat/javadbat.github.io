// @vitest-environment happy-dom

import { describe, expect, it } from "vitest";
import { BuilderStore } from "../store/BuilderStore";
import { formAppMessages } from "../../i18n/locale-adapter";
import { copyLocaleDefinitions } from "./FormSettingsModal";
import { getFormSettingsSaveError } from "./useFormSettings";

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

  it("shows the exact form issue instead of hiding it behind a generic save error", () => {
    const error = getFormSettingsSaveError(formAppMessages.en, {
      code: "validation-failed",
      message: "The form must be valid before it can be saved.",
      formIssues: [
        {
          source: "registry",
          code: "invalid-name",
          path: "/elements/2/name",
          messageKey: "invalid-name",
          message: "Name must begin with a letter.",
        },
      ],
    });

    expect(error).toContain("/elements/2/name: Name must begin with a letter.");
  });
});
