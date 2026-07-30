import { makeAutoObservable, toJS } from "mobx";
import {
  createEmptyFormDocument,
  getLocalizedText,
  localizedText,
  type JBFormDocumentV1,
  type JBFormElementV1,
  type JBValidationRule,
  type JSONValue,
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
  private changeVersion = 0;
  readonly repository: FormRepository;

  constructor(document = createEmptyFormDocument(), repository: FormRepository = formRepository) {
    this.document = document;
    this.repository = repository;
    makeAutoObservable(this, { repository: false }, { autoBind: true });
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
    return structuredClone(toJS(this.document)) as JBFormDocumentV1;
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

    if (loaded.value) {
      this.document = structuredClone(loaded.value.document);
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
      this.linkedRecord = null;
      this.hasSavedDraft = false;
    }
    this.selectedElementId = null;
    this.isDirty = false;
    this.changeVersion = 0;
    this.setReady();
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
    this.linkedRecord = savedLink;
    this.hasSavedDraft = true;
    if (this.changeVersion === savingVersion) {
      this.document = structuredClone(result.value.document);
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
    }
    this.status = "ready";
    return true;
  }

  addElement(entry: FormElementRegistryEntry, insertionIndex = this.document.elements.length): string {
    const name = this.getAvailableName(entry.defaultName);
    const element = createDefaultElement(entry, name);
    const nextIndex = Math.max(0, Math.min(insertionIndex, this.document.elements.length));
    this.document.elements.splice(nextIndex, 0, element);
    this.selectedElementId = element.id;
    this.markDirty();
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
    element.validation[index] = structuredClone(nextRule);
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
    this.updateSelectedProp(key, value ? (localizedText(value, locale) as unknown as JSONValue) : undefined);
  }

  updateSelectedText(key: "label" | "placeholder", value: string, locale = "en"): void {
    this.updateSelectedElement({
      [key]: value ? localizedText(value, locale) : undefined,
    });
  }

  updateFormName(name: string, locale = "en"): void {
    this.document.metadata.name = localizedText(name || "Untitled form", locale);
    this.markDirty();
  }

  setFormLocale(locale: "en" | "fa"): void {
    this.document.localization.defaultLocale = locale;
    this.document.localization.locales[locale] = {
      direction: locale === "fa" ? "rtl" : "ltr",
    };
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

  private markDirty(): void {
    this.isDirty = true;
    this.changeVersion += 1;
    this.document.metadata.updatedAt = new Date().toISOString();
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
