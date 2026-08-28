import { makeAutoObservable } from "mobx";
import { canonicalizeLocaleCode, getLocalizedText, inferLocaleDirection, isContainerElement, type FormLocalization, type JSONValue } from "../../domain/form-document";
import { addMissingElementDefaultTranslations } from "jb-form-builder/registry/form-element-registry";
import type { BuilderDraftStore } from "./BuilderDraftStore";
import type { BuilderElementStore } from "./BuilderElementStore";
import { builderLocalePreferences, type BuilderLocalePreferences } from "./BuilderLocalePreferences";
import { isLocalizedTextValue, patchLocalizedText, pruneLocalizedTranslations } from "./form-localization";

/** Owns the active editing locale and all localized document mutations. */
export class BuilderLocalizationStore {
  /** Locale whose values are currently shown in builder editing controls. */
  editingLocale: string;
  /** Draft mutated by localization operations. */
  private readonly draft: BuilderDraftStore;
  /** Element operations used to update the current selection. */
  private readonly elements: BuilderElementStore;
  /** Preference boundary that remembers editing locale outside exported JSON. */
  private readonly preferences: BuilderLocalePreferences;
  /** Named-form or current-draft identity under which the preference is stored. */
  private preferenceScope = "current";

  /** Coordinates document localization, selected-element edits, and user editing preference. */
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

  /** Localized form name used by builder chrome, with a usable untitled fallback. */
  get formName(): string {
    return getLocalizedText(this.draft.document.metadata.name, this.draft.document.localization.defaultLocale) || "Untitled form";
  }

  /** Restores the scoped editing locale and adds it to older documents when necessary. */
  restoreForDocument(scope = this.preferenceScope): void {
    this.preferenceScope = scope;
    /** Canonical saved editing locale for this document scope. */
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

  /** Switches editing to a configured locale after seeding missing element translations. */
  setEditingLocale(locale: string): void {
    if (!this.draft.document.localization.locales[locale]) return;
    /** Default locale from which missing editable translations are initialized. */
    const sourceLocale = this.draft.document.localization.defaultLocale;
    for (const element of this.draft.document.elements) {
      addMissingElementDefaultTranslations(element, sourceLocale, locale);
    }
    this.editingLocale = locale;
    this.preferences.set(this.preferenceScope, locale);
  }

  /** Updates one localized registry-defined property on the selected element. */
  updateSelectedLocalizedProp(key: string, value: string, locale = "en"): void {
    /** Current portable property value before localization narrowing. */
    const current = this.elements.selected?.props[key];
    /** Detached localized value retained when the property already carries translations. */
    const existing = isLocalizedTextValue(current) ? { translations: { ...current.translations } } : undefined;
    this.elements.updateSelectedProp(key, patchLocalizedText(existing, value, locale) as unknown as JSONValue | undefined);
  }

  /** Updates a selected leaf element's common label or placeholder in one locale. */
  updateSelectedText(key: "label" | "placeholder", value: string, locale = "en"): void {
    if (!this.elements.selected || isContainerElement(this.elements.selected)) return;
    /** Existing common localized field being patched. */
    const current = this.elements.selected[key];
    this.elements.updateSelected({ [key]: patchLocalizedText(current, value, locale) });
  }

  /** Updates the form's localized display name and records one undoable document change. */
  updateFormName(name: string, locale = "en"): void {
    this.draft.document.metadata.name = patchLocalizedText(this.draft.document.metadata.name, name || "Untitled form", locale) ?? {
      translations: { [locale]: name || "Untitled form" },
    };
    this.draft.markChanged();
  }

  /** Applies locale configuration, seeds added locales, and prunes removed-locale content. */
  setFormLocalization(localization: FormLocalization): void {
    /** Detached document transformed as one atomic history edit. */
    const next = this.draft.snapshot();
    /** Existing locales used to distinguish additions from retained definitions. */
    const previousLocales = new Set(Object.keys(next.localization.locales));
    /** Previous default locale used to seed newly added translations. */
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
