import { describe, expect, it } from "vitest";
import { createEmptyFormDocument } from "../../domain/form-document";
import { formElementRegistry } from "../../registry/form-element-registry";
import { BuilderDraftStore } from "./BuilderDraftStore";
import { BuilderElementStore } from "./BuilderElementStore";
import { BuilderLocalizationStore } from "./BuilderLocalizationStore";

describe("BuilderLocalizationStore", () => {
  it("manages editing locale and localized element text", () => {
    const draft = new BuilderDraftStore(createEmptyFormDocument());
    const elements = new BuilderElementStore(draft);
    const localization = new BuilderLocalizationStore(draft, elements);
    const elementId = elements.add(formElementRegistry[0]);

    localization.setFormLocalization({
      defaultLocale: "en",
      locales: { en: { direction: "ltr" }, fa: { direction: "rtl" } },
    });
    localization.setEditingLocale("fa");
    localization.updateSelectedText("label", "برچسب", "fa");

    expect(localization.editingLocale).toBe("fa");
    expect(draft.document.elements.find(element => element.id === elementId)?.label?.translations.fa).toBe("برچسب");
    expect(draft.isDirty).toBe(true);
  });

  it("prunes translations when supported locales are removed", () => {
    const draft = new BuilderDraftStore(createEmptyFormDocument());
    const elements = new BuilderElementStore(draft);
    const localization = new BuilderLocalizationStore(draft, elements);
    elements.add(formElementRegistry[0]);
    localization.setFormLocalization({ defaultLocale: "en", locales: { en: { direction: "ltr" }, fa: { direction: "rtl" } } });
    localization.updateSelectedText("label", "برچسب", "fa");

    localization.setFormLocalization({ defaultLocale: "en", locales: { en: { direction: "ltr" } } });

    expect(elements.selected?.label?.translations).not.toHaveProperty("fa");
  });
});
