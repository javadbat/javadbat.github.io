import { describe, expect, it } from "vitest";
import { createEmptyFormDocument } from "../../domain/form-document";
import { formElementRegistry } from "../../registry/form-element-registry";
import { BuilderDraftStore } from "./BuilderDraftStore";
import { BuilderElementStore } from "./BuilderElementStore";
import type { BuilderLocalePreferences } from "./BuilderLocalePreferences";
import { BuilderLocalizationStore } from "./BuilderLocalizationStore";

class MemoryLocalePreferences implements BuilderLocalePreferences {
  readonly values = new Map<string, string>();

  get(scope: string): string | null {
    return this.values.get(scope) ?? null;
  }

  set(scope: string, locale: string): void {
    this.values.set(scope, locale);
  }
}

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

  it("adds translated Farsi text for untouched built-in field defaults", () => {
    const document = createEmptyFormDocument();
    const draft = new BuilderDraftStore(document);
    const elements = new BuilderElementStore(draft);
    const localization = new BuilderLocalizationStore(draft, elements, new MemoryLocalePreferences());
    const passwordEntry = formElementRegistry.find(entry => entry.type === "jb-password-input")!;

    elements.add(passwordEntry);
    localization.setFormLocalization({
      defaultLocale: "en",
      locales: { en: { direction: "ltr" }, fa: { direction: "rtl" } },
    });

    expect(elements.selected?.label?.translations).toEqual({ en: "Password input", fa: "ورودی رمز عبور" });
    expect(elements.selected?.placeholder?.translations).toEqual({ en: "Enter password input", fa: "ورودی رمز عبور را وارد کنید" });

    localization.setFormLocalization({ defaultLocale: "en", locales: { en: { direction: "ltr" } } });
    const textEntry = formElementRegistry.find(entry => entry.type === "text")!;
    elements.add(textEntry);
    localization.setFormLocalization({
      defaultLocale: "en",
      locales: { en: { direction: "ltr" }, fa: { direction: "rtl" } },
    });

    expect((elements.selected?.props.content as { translations: Record<string, string> }).translations).toEqual({ en: "Text", fa: "متن" });
  });

  it("does not translate user-authored field text when adding Farsi", () => {
    const document = createEmptyFormDocument();
    const draft = new BuilderDraftStore(document);
    const elements = new BuilderElementStore(draft);
    const localization = new BuilderLocalizationStore(draft, elements, new MemoryLocalePreferences());
    const inputEntry = formElementRegistry.find(entry => entry.type === "jb-input")!;

    elements.add(inputEntry);
    localization.updateSelectedText("label", "Account name", "en");
    localization.setFormLocalization({
      defaultLocale: "en",
      locales: { en: { direction: "ltr" }, fa: { direction: "rtl" } },
    });

    expect(elements.selected?.label?.translations).toEqual({ en: "Account name" });
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

  it("persists and restores the selected locale when a current draft gets a new id", () => {
    const preferences = new MemoryLocalePreferences();
    const firstDocument = createEmptyFormDocument();
    firstDocument.localization.locales.fa = { direction: "rtl" };
    const firstDraft = new BuilderDraftStore(firstDocument);
    const firstElements = new BuilderElementStore(firstDraft);

    const firstSession = new BuilderLocalizationStore(firstDraft, firstElements, preferences);
    firstSession.setEditingLocale("fa");

    const reloadedDraft = new BuilderDraftStore(createEmptyFormDocument());
    const reloadedElements = new BuilderElementStore(reloadedDraft);
    const nextSession = new BuilderLocalizationStore(reloadedDraft, reloadedElements, preferences);
    nextSession.restoreForDocument();

    expect(nextSession.editingLocale).toBe("fa");
    expect(reloadedDraft.document.localization.locales.fa).toEqual({ direction: "rtl" });
    expect(preferences.values.get("current")).toBe("fa");
  });

  it("falls back to the document default when a persisted locale is unavailable", () => {
    const document = createEmptyFormDocument();
    const draft = new BuilderDraftStore(document);
    const elements = new BuilderElementStore(draft);
    const preferences = new MemoryLocalePreferences();
    preferences.set("current", "not a locale");

    const localization = new BuilderLocalizationStore(draft, elements, preferences);
    localization.restoreForDocument();

    expect(localization.editingLocale).toBe("en");
    expect(preferences.values.get("current")).toBe("en");
  });
});
