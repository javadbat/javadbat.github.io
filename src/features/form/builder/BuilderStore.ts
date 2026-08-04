import { makeAutoObservable, runInAction, toJS } from "mobx";
import {
  createEmptyFormDocument,
  getLocalizedText,
  type FormLocalization,
  type JBFormDocumentV1,
  type JBFormElementV1,
  type JBValidationRule,
  type JSONValue,
  type LocalizedText,
} from "../domain/form-document";
import { createDefaultElement, type FormElementRegistryEntry } from "../registry/form-element-registry";
import { createValidationRule } from "../registry/validation-rule-registry";
import type { ValidationRuleName } from "../registry/validation-rule-registry";
import { formRepository } from "../storage/form-repository";
import type { FormRepository, LinkedFormReference, StorageIssue } from "../storage/storage-types";

export type BuilderStatus = "loading" | "ready" | "load-error" | "saving" | "save-error";

export const ELEMENT_NAME_PATTERN = /^[A-Za-z][A-Za-z0-9_-]{0,63}$/;

export class BuilderStore {
  document: JBFormDocumentV1;
  selectedElementId: string | null = null;
  status: BuilderStatus = "loading";
  isDirty = false;
  issues: string[] = [];
  announcement = "";
  linkedRecord: LinkedFormReference | null = null;
  hasSavedDraft = false;
  storageIssue: StorageIssue | null = null;
  editingLocale: string;
  private changeVersion = 0;
  private historyDocument: JBFormDocumentV1;
  private persistedDocument: JBFormDocumentV1 | null = null;
  private undoHistory: JBFormDocumentV1[] = [];
  private redoHistory: JBFormDocumentV1[] = [];
  readonly repository: FormRepository;

  constructor(document = createEmptyFormDocument(), repository: FormRepository = formRepository) {
    this.document = document;
    this.editingLocale = document.localization.defaultLocale;
    this.historyDocument = this.cloneDocument(document);
    this.repository = repository;
    makeAutoObservable(this, { repository: false }, { autoBind: true });
  }

  get canUndo(): boolean {
    return this.undoHistory.length > 0 && this.status !== "saving";
  }

  get canRedo(): boolean {
    return this.redoHistory.length > 0 && this.status !== "saving";
  }

  get selectedElement(): JBFormElementV1 | null {
    return this.document.elements.find(element => element.id === this.selectedElementId) ?? null;
  }

  get formName(): string {
    return getLocalizedText(this.document.metadata.name, this.document.localization.defaultLocale) || "Untitled form";
  }

  /**
   * Returns a plain detached form document for persistence, navigation, and
   * export boundaries. MobX proxies and all Builder-only store state stay on
   * this side of the boundary.
   */
  createDocumentSnapshot(): JBFormDocumentV1 {
    // MobX `toJS` recursively detaches observable objects and arrays, which is
    // sufficient for this JSON-only document boundary and avoids a second full
    // structured clone on every editing action.
    return toJS(this.document) as JBFormDocumentV1;
  }

  selectElement(elementId: string): void {
    if (this.document.elements.some(element => element.id === elementId)) {
      this.selectedElementId = elementId;
    }
  }

  setReady(): void {
    this.status = "ready";
    this.storageIssue = null;
    this.issues = [];
  }

  setLoadError(message: string): void {
    this.status = "load-error";
    this.issues = [message];
  }

  async initialize(slug?: string): Promise<boolean> {
    this.status = "loading";
    this.storageIssue = null;
    this.issues = [];
    const loaded = slug ? await this.repository.getBySlug(slug) : await this.repository.getCurrentDraft();
    if (!loaded.ok) {
      this.setStorageError(loaded.error, "load-error");
      return false;
    }
    if (slug && loaded.value === null) {
      this.setLoadError(`No saved form was found for “${slug}”.`);
      return false;
    }

    // makeAutoObservable turns this method into an action only until its first
    // await. Repository results arrive in a later microtask, so committing them
    // directly would mutate observed state outside an action and MobX would warn
    // for every Builder hydration. Keep the complete result commit atomic: React
    // observers see one coherent ready state instead of intermediate fields.
    runInAction(() => {
      if (loaded.value) {
        this.document = structuredClone(loaded.value.document);
        this.editingLocale = loaded.value.document.localization.defaultLocale;
        this.persistedDocument = this.cloneDocument(loaded.value.document);
        if ("revision" in loaded.value) {
          this.linkedRecord = {
            id: loaded.value.id,
            slug: loaded.value.slug,
            revision: loaded.value.revision,
          };
        } else if (loaded.value.linkedFormId && loaded.value.linkedSlug && loaded.value.linkedRevision) {
          this.linkedRecord = {
            id: loaded.value.linkedFormId,
            slug: loaded.value.linkedSlug,
            revision: loaded.value.linkedRevision,
          };
        } else {
          this.linkedRecord = null;
        }
        this.hasSavedDraft = true;
      } else {
        this.persistedDocument = null;
        this.editingLocale = this.document.localization.defaultLocale;
        this.linkedRecord = null;
        this.hasSavedDraft = false;
      }
      this.selectedElementId = null;
      this.isDirty = false;
      this.changeVersion = 0;
      this.resetHistory();
      this.setReady();
    });
    return true;
  }

  importDocument(document: JBFormDocumentV1): boolean {
    if (this.status === "saving") {
      return false;
    }

    this.document = this.cloneDocument(document);
    this.editingLocale = document.localization.defaultLocale;
    this.selectedElementId = null;
    this.linkedRecord = null;
    this.hasSavedDraft = false;
    this.status = "ready";
    this.storageIssue = null;
    this.issues = [];
    this.persistedDocument = null;
    this.isDirty = true;
    this.changeVersion += 1;
    this.resetHistory();
    return true;
  }

  undo(): boolean {
    if (!this.canUndo) {
      return false;
    }

    const current = this.createDocumentSnapshot();
    const previous = this.undoHistory.pop();
    if (!previous) {
      return false;
    }
    this.redoHistory.push(current);
    this.restoreHistoryDocument(previous);
    return true;
  }

  redo(): boolean {
    if (!this.canRedo) {
      return false;
    }

    const current = this.createDocumentSnapshot();
    const next = this.redoHistory.pop();
    if (!next) {
      return false;
    }
    this.undoHistory.push(current);
    this.restoreHistoryDocument(next);
    return true;
  }

  async save(options: { slug?: string; saveAs?: boolean } = {}): Promise<boolean> {
    if (this.status === "saving") {
      return false;
    }
    const savingVersion = this.changeVersion;
    const snapshot = this.createDocumentSnapshot();
    this.status = "saving";
    this.storageIssue = null;
    this.issues = [];
    const result = await this.repository.save({
      document: snapshot,
      linkedRecord: options.saveAs ? null : this.linkedRecord,
      slug: options.slug,
      saveAs: options.saveAs,
    });
    if (!result.ok) {
      this.setStorageError(result.error, "save-error");
      return false;
    }

    const savedLink = result.value.namedForm
      ? {
          id: result.value.namedForm.id,
          slug: result.value.namedForm.slug,
          revision: result.value.namedForm.revision,
        }
      : null;
    // Saving has the same async action boundary as initialization. Commit the
    // repository response as one MobX action while preserving edits made during
    // the request through the existing change-version comparison.
    runInAction(() => {
      this.linkedRecord = savedLink;
      this.hasSavedDraft = true;
      if (this.changeVersion === savingVersion) {
        this.document = structuredClone(result.value.document);
        this.persistedDocument = this.cloneDocument(result.value.document);
        this.isDirty = false;
      } else {
        this.document.id = result.value.document.id;
        this.document.metadata.createdAt = result.value.document.metadata.createdAt;
        if (result.value.document.slug) {
          this.document.slug = result.value.document.slug;
        } else {
          delete this.document.slug;
        }
        this.isDirty = true;
        this.persistedDocument = this.cloneDocument(result.value.document);
      }
      this.historyDocument = this.createDocumentSnapshot();
      this.status = "ready";
    });
    return true;
  }

  addElement(entry: FormElementRegistryEntry, insertionIndex = this.document.elements.length): string {
    const name = this.getAvailableName(entry.defaultName);
    const element = createDefaultElement(entry, name);
    const nextIndex = Math.max(0, Math.min(insertionIndex, this.document.elements.length));
    this.document.elements.splice(nextIndex, 0, element);
    this.selectedElementId = element.id;
    this.markDirty(this.createElementInsertSnapshot(element, nextIndex));
    return element.id;
  }

  updateSelectedElement(patch: Partial<Pick<JBFormElementV1, "name" | "label" | "placeholder" | "required" | "disabled" | "initialValue">>): void {
    const element = this.selectedElement;
    if (!element) {
      return;
    }

    Object.assign(element, patch);
    this.markDirty();
  }

  updateSelectedProp(key: string, value: JSONValue | undefined): void {
    const element = this.selectedElement;
    if (!element) {
      return;
    }

    if (value === undefined) {
      delete element.props[key];
    } else {
      element.props[key] = value;
    }
    this.markDirty();
  }

  addSelectedValidationRule(rule: ValidationRuleName, locale = "en"): string | null {
    const element = this.selectedElement;
    if (!element) {
      return null;
    }
    const validation = createValidationRule(rule, locale);
    element.validation.push(validation);
    this.markDirty();
    return validation.id;
  }

  updateSelectedValidationRule(ruleId: string, nextRule: JBValidationRule): void {
    const element = this.selectedElement;
    const index = element?.validation.findIndex(rule => rule.id === ruleId);
    if (!element || index === undefined || index < 0) {
      return;
    }
    // Validation editor props are backed by deep MobX observables. The proposed
    // root is newly spread and therefore plain, so convert its nested observable
    // values explicitly before cloning. structuredClone rejects Proxy instances
    // and previously made rule edits look successful without being persisted.
    element.validation[index] = structuredClone({
      ...nextRule,
      params: toJS(nextRule.params),
      message: toJS(nextRule.message),
    }) as JBValidationRule;
    this.markDirty();
  }

  removeSelectedValidationRule(ruleId: string): void {
    const element = this.selectedElement;
    const index = element?.validation.findIndex(rule => rule.id === ruleId);
    if (!element || index === undefined || index < 0) {
      return;
    }
    element.validation.splice(index, 1);
    this.markDirty();
  }

  updateSelectedLocalizedProp(key: string, value: string, locale = "en"): void {
    const current = this.selectedElement?.props[key];
    const existing = isLocalizedTextValue(current) ? { translations: { ...current.translations } } : undefined;
    this.updateSelectedProp(key, patchLocalizedText(existing, value, locale) as unknown as JSONValue | undefined);
  }

  updateSelectedText(key: "label" | "placeholder", value: string, locale = "en"): void {
    const current = this.selectedElement?.[key];
    this.updateSelectedElement({ [key]: patchLocalizedText(current, value, locale) });
  }

  updateFormName(name: string, locale = "en"): void {
    this.document.metadata.name = patchLocalizedText(this.document.metadata.name, name || "Untitled form", locale) ?? {
      translations: { [locale]: name || "Untitled form" },
    };
    this.markDirty();
  }

  setEditingLocale(locale: string): void {
    if (this.document.localization.locales[locale]) {
      this.editingLocale = locale;
    }
  }

  setFormLocalization(localization: FormLocalization): void {
    const next = this.createDocumentSnapshot();
    next.localization = structuredClone(toJS(localization));
    pruneLocalizedTranslations(next as unknown as JSONValue, new Set(Object.keys(next.localization.locales)), next.localization.defaultLocale);
    this.document = next;
    this.editingLocale = next.localization.locales[this.editingLocale] ? this.editingLocale : next.localization.defaultLocale;
    this.markDirty();
  }

  getElementNameError(elementId: string): "required" | "invalid" | null {
    const element = this.document.elements.find(candidate => candidate.id === elementId);
    if (!element || element.name.length === 0) {
      return "required";
    }
    return ELEMENT_NAME_PATTERN.test(element.name) ? null : "invalid";
  }

  moveElementBy(elementId: string, offset: -1 | 1): number {
    const currentIndex = this.document.elements.findIndex(element => element.id === elementId);
    if (currentIndex === -1) {
      return -1;
    }

    const nextIndex = Math.max(0, Math.min(currentIndex + offset, this.document.elements.length - 1));
    if (nextIndex === currentIndex) {
      return currentIndex;
    }

    const [element] = this.document.elements.splice(currentIndex, 1);
    this.document.elements.splice(nextIndex, 0, element);
    this.selectedElementId = elementId;
    this.markDirty();
    return nextIndex;
  }

  moveElementToInsertionIndex(elementId: string, insertionIndex: number): number {
    const currentIndex = this.document.elements.findIndex(element => element.id === elementId);
    if (currentIndex === -1) {
      return -1;
    }

    const boundedInsertionIndex = Math.max(0, Math.min(insertionIndex, this.document.elements.length));
    const nextIndex = boundedInsertionIndex > currentIndex ? boundedInsertionIndex - 1 : boundedInsertionIndex;

    if (nextIndex === currentIndex) {
      return currentIndex;
    }

    const [element] = this.document.elements.splice(currentIndex, 1);
    this.document.elements.splice(nextIndex, 0, element);
    this.selectedElementId = elementId;
    this.markDirty();
    return nextIndex;
  }

  duplicateElement(elementId: string): string | null {
    const sourceIndex = this.document.elements.findIndex(element => element.id === elementId);
    if (sourceIndex === -1) {
      return null;
    }

    const duplicate = structuredClone(toJS(this.document.elements[sourceIndex])) as JBFormElementV1;
    duplicate.id = crypto.randomUUID();
    this.document.elements.splice(sourceIndex + 1, 0, duplicate);
    this.selectedElementId = duplicate.id;
    this.markDirty();
    return duplicate.id;
  }

  removeElement(elementId: string): string | null {
    const currentIndex = this.document.elements.findIndex(element => element.id === elementId);
    if (currentIndex === -1) {
      return this.selectedElementId;
    }

    this.document.elements.splice(currentIndex, 1);
    const nextSelection = this.document.elements[currentIndex] ?? this.document.elements[currentIndex - 1] ?? null;
    this.selectedElementId = nextSelection?.id ?? null;
    this.markDirty();
    return this.selectedElementId;
  }

  announce(message: string): void {
    this.announcement = message;
  }

  getElementPosition(elementId: string): number {
    return this.document.elements.findIndex(element => element.id === elementId);
  }

  private markDirty(nextHistoryDocument?: JBFormDocumentV1): void {
    // historyDocument is a detached snapshot and is replaced after each edit,
    // so it can be transferred into the undo stack without another deep clone.
    // Avoiding that duplicate clone keeps large-form editing within the shell
    // performance budget while preserving one snapshot per approved action.
    this.undoHistory.push(this.historyDocument);
    this.redoHistory = [];
    this.isDirty = true;
    this.changeVersion += 1;
    this.document.metadata.updatedAt = new Date().toISOString();
    this.historyDocument = nextHistoryDocument
      ? {
          ...nextHistoryDocument,
          metadata: { ...nextHistoryDocument.metadata, updatedAt: this.document.metadata.updatedAt },
        }
      : this.createDocumentSnapshot();
  }

  private createElementInsertSnapshot(element: JBFormElementV1, insertionIndex: number): JBFormDocumentV1 {
    return {
      ...this.historyDocument,
      elements: [
        ...this.historyDocument.elements.slice(0, insertionIndex),
        toJS(element) as JBFormElementV1,
        ...this.historyDocument.elements.slice(insertionIndex),
      ],
    };
  }

  private resetHistory(): void {
    this.historyDocument = this.createDocumentSnapshot();
    this.undoHistory = [];
    this.redoHistory = [];
  }

  private restoreHistoryDocument(document: JBFormDocumentV1): void {
    this.document = this.cloneDocument(document);
    this.selectedElementId = this.document.elements.some(element => element.id === this.selectedElementId) ? this.selectedElementId : null;
    this.historyDocument = this.createDocumentSnapshot();
    const current = this.createDocumentSnapshot();
    this.isDirty = this.persistedDocument ? JSON.stringify(current) !== JSON.stringify(this.persistedDocument) : true;
    this.changeVersion += 1;
    this.status = "ready";
    this.storageIssue = null;
    this.issues = [];
  }

  private cloneDocument(document: JBFormDocumentV1): JBFormDocumentV1 {
    return structuredClone(toJS(document)) as JBFormDocumentV1;
  }

  private setStorageError(issue: StorageIssue, status: "load-error" | "save-error"): void {
    this.storageIssue = issue;
    this.status = status;
    this.issues = [issue.message];
  }

  private getAvailableName(baseName: string): string {
    const names = new Set(this.document.elements.map(element => element.name));
    if (!names.has(baseName)) {
      return baseName;
    }

    let suffix = 2;
    while (names.has(`${baseName}_${suffix}`)) {
      suffix += 1;
    }
    return `${baseName}_${suffix}`;
  }
}

function pruneLocalizedTranslations(value: JSONValue, allowedLocales: Set<string>, fallbackLocale: string): void {
  if (Array.isArray(value)) {
    value.forEach(item => pruneLocalizedTranslations(item, allowedLocales, fallbackLocale));
    return;
  }
  if (value === null || typeof value !== "object") {
    return;
  }

  if ("translations" in value && value.translations !== null && typeof value.translations === "object" && !Array.isArray(value.translations)) {
    const fallbackValue = value.translations[fallbackLocale] ?? value.translations.en ?? Object.values(value.translations)[0] ?? "";
    for (const locale of Object.keys(value.translations)) {
      if (!allowedLocales.has(locale)) {
        delete value.translations[locale];
      }
    }
    if (Object.keys(value.translations).length === 0) {
      value.translations[fallbackLocale] = fallbackValue;
    }
    return;
  }

  Object.values(value).forEach(child => pruneLocalizedTranslations(child, allowedLocales, fallbackLocale));
}

function isLocalizedTextValue(value: JSONValue | undefined): value is JSONValue & { translations: Record<string, string> } {
  return value !== undefined && value !== null && typeof value === "object" && !Array.isArray(value) && "translations" in value && value.translations !== null && typeof value.translations === "object" && !Array.isArray(value.translations) && Object.values(value.translations).every(item => typeof item === "string");
}

function patchLocalizedText(value: LocalizedText | undefined, text: string, locale: string): LocalizedText | undefined {
  const translations = { ...(value?.translations ?? {}) };
  if (text) {
    translations[locale] = text;
  } else {
    delete translations[locale];
  }
  return Object.keys(translations).length > 0 ? { translations } : undefined;
}
