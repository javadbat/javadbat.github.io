import { makeAutoObservable } from "mobx";
import { canonicalizeLocaleCode, getLocalizedText, inferLocaleDirection, isContainerElement, type FormLocalization, type JSONValue } from "../../domain/form-document";
import { addMissingElementDefaultTranslations } from "../../registry/form-element-registry";
import type { BuilderDraftStore } from "./BuilderDraftStore";
import type { BuilderElementStore } from "./BuilderElementStore";
import { builderLocalePreferences, type BuilderLocalePreferences } from "./BuilderLocalePreferences";
import { isLocalizedTextValue, patchLocalizedText, pruneLocalizedTranslations } from "./form-localization";

/** Owns the active editing locale and all localized document mutations. */
export class BuilderLocalizationStore {
  editingLocale: string;
  private readonly draft: BuilderDraftStore;
  private readonly elements: BuilderElementStore;
  private readonly preferences: BuilderLocalePreferences;
  private preferenceScope = "current";

  constructor(draft: BuilderDraftStore, elements: BuilderElementStore, preferences: BuilderLocalePreferences = builderLocalePreferences) {
    this.draft = draft;
    this.elements = elements;
    this.preferences = preferences;
    this.editingLocale = draft.document.localization.defaultLocale;
    makeAutoObservable<this, "draft" | "elements" | "preferences" | "preferenceScope">(
      this,
      { draft: false, elements: false, preferences: false, preferenceScope: false },
      { autoBind: true },
    );
  }

  get formName(): string {
    return getLocalizedText(this.draft.document.metadata.name, this.draft.document.localization.defaultLocale) || "Untitled form";
  }

  restoreForDocument(scope = this.preferenceScope): void {
    this.preferenceScope = scope;
    const storedLocale = canonicalizeLocaleCode(this.preferences.get(scope) ?? "");
    if (storedLocale && !this.draft.document.localization.locales[storedLocale]) {
      this.setFormLocalization({
        ...this.draft.document.localization,
        locales: {
          ...this.draft.document.localization.locales,
          [storedLocale]: { direction: inferLocaleDirection(storedLocale) },
        },
      });
    }
    this.editingLocale = storedLocale ?? this.draft.document.localization.defaultLocale;
    this.preferences.set(this.preferenceScope, this.editingLocale);
  }

  setEditingLocale(locale: string): void {
    if (!this.draft.document.localization.locales[locale]) return;
    const sourceLocale = this.draft.document.localization.defaultLocale;
    for (const element of this.draft.document.elements) {
      addMissingElementDefaultTranslations(element, sourceLocale, locale);
    }
    this.editingLocale = locale;
    this.preferences.set(this.preferenceScope, locale);
  }

  updateSelectedLocalizedProp(key: string, value: string, locale = "en"): void {
    const current = this.elements.selected?.props[key];
    const existing = isLocalizedTextValue(current) ? { translations: { ...current.translations } } : undefined;
    this.elements.updateSelectedProp(key, patchLocalizedText(existing, value, locale) as unknown as JSONValue | undefined);
  }

  updateSelectedText(key: "label" | "placeholder", value: string, locale = "en"): void {
    if (!this.elements.selected || isContainerElement(this.elements.selected)) return;
    const current = this.elements.selected[key];
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
    const previousLocales = new Set(Object.keys(next.localization.locales));
    const sourceLocale = next.localization.defaultLocale;
    next.localization = {
      defaultLocale: localization.defaultLocale,
      locales: Object.fromEntries(Object.entries(localization.locales).map(([locale, definition]) => [locale, { direction: definition.direction }])),
    };
    for (const locale of Object.keys(next.localization.locales)) {
      if (previousLocales.has(locale)) continue;
      for (const element of next.elements) {
        addMissingElementDefaultTranslations(element, sourceLocale, locale);
      }
    }
    pruneLocalizedTranslations(next as unknown as JSONValue, new Set(Object.keys(next.localization.locales)), next.localization.defaultLocale);
    this.draft.replaceForEdit(next);
    this.editingLocale = next.localization.locales[this.editingLocale] ? this.editingLocale : next.localization.defaultLocale;
    this.preferences.set(this.preferenceScope, this.editingLocale);
  }
}
