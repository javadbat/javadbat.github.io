import { makeAutoObservable } from "mobx";
import { getLocalizedText, type FormLocalization, type JSONValue } from "../../domain/form-document";
import type { BuilderDraftStore } from "./BuilderDraftStore";
import type { BuilderElementStore } from "./BuilderElementStore";
import { isLocalizedTextValue, patchLocalizedText, pruneLocalizedTranslations } from "./form-localization";

/** Owns the active editing locale and all localized document mutations. */
export class BuilderLocalizationStore {
  editingLocale: string;
  private readonly draft: BuilderDraftStore;
  private readonly elements: BuilderElementStore;

  constructor(draft: BuilderDraftStore, elements: BuilderElementStore) {
    this.draft = draft;
    this.elements = elements;
    this.editingLocale = draft.document.localization.defaultLocale;
    makeAutoObservable<this, "draft" | "elements">(this, { draft: false, elements: false }, { autoBind: true });
  }

  get formName(): string {
    return getLocalizedText(this.draft.document.metadata.name, this.draft.document.localization.defaultLocale) || "Untitled form";
  }

  resetToDocumentDefault(): void {
    this.editingLocale = this.draft.document.localization.defaultLocale;
  }

  setEditingLocale(locale: string): void {
    if (this.draft.document.localization.locales[locale]) this.editingLocale = locale;
  }

  updateSelectedLocalizedProp(key: string, value: string, locale = "en"): void {
    const current = this.elements.selected?.props[key];
    const existing = isLocalizedTextValue(current) ? { translations: { ...current.translations } } : undefined;
    this.elements.updateSelectedProp(key, patchLocalizedText(existing, value, locale) as unknown as JSONValue | undefined);
  }

  updateSelectedText(key: "label" | "placeholder", value: string, locale = "en"): void {
    const current = this.elements.selected?.[key];
    this.elements.updateSelected({ [key]: patchLocalizedText(current, value, locale) });
  }

  updateFormName(name: string, locale = "en"): void {
    this.draft.document.metadata.name = patchLocalizedText(this.draft.document.metadata.name, name || "Untitled form", locale) ?? {
      translations: { [locale]: name || "Untitled form" },
    };
    this.draft.markChanged();
  }

  setFormLocalization(localization: FormLocalization): void {
    const next = this.draft.snapshot();
    next.localization = {
      defaultLocale: localization.defaultLocale,
      locales: Object.fromEntries(Object.entries(localization.locales).map(([locale, definition]) => [locale, { direction: definition.direction }])),
    };
    pruneLocalizedTranslations(next as unknown as JSONValue, new Set(Object.keys(next.localization.locales)), next.localization.defaultLocale);
    this.draft.replaceForEdit(next);
    this.editingLocale = next.localization.locales[this.editingLocale] ? this.editingLocale : next.localization.defaultLocale;
  }
}
