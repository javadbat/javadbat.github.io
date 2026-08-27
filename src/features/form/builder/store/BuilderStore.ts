import { makeAutoObservable } from "mobx";
import {
  createEmptyFormDocument,
  type FormLocalization,
  type JBConditionMatch,
  type JBConditionRuleV1,
  type JBFormDocumentV1,
  type JBFormElementV1,
  type JBFormLeafElementV1,
  type JBFormWizardElementV1,
  type JBTabElementV1,
  type JBValidationRule,
  type JSONValue,
} from "../../domain/form-document";
import type { FormElementRegistryEntry } from "../../registry/form-element-registry";
import type { ValidationRuleName } from "../../registry/validation-rule-registry";
import { formRepository } from "../../storage/form-repository";
import type { FormRepository, LinkedFormReference, StorageIssue } from "../../storage/storage-types";
import { BuilderDraftStore } from "./BuilderDraftStore";
import { BuilderElementStore, ELEMENT_NAME_PATTERN } from "./BuilderElementStore";
import { BuilderHistoryStore } from "./BuilderHistoryStore";
import { builderLocalePreferences, type BuilderLocalePreferences } from "./BuilderLocalePreferences";
import { BuilderLocalizationStore } from "./BuilderLocalizationStore";
import { BuilderPersistenceStore, type BuilderStatus } from "./BuilderPersistenceStore";

export { ELEMENT_NAME_PATTERN } from "./BuilderElementStore";
export type { BuilderStatus } from "./BuilderPersistenceStore";

/**
 * Compatibility facade and coordinator for the focused Builder stores.
 * Existing UI callers can migrate to child stores incrementally.
 */
export class BuilderStore {
  announcement = "";
  activeContainerTabs = new Map<string, string>();
  readonly draft: BuilderDraftStore;
  readonly elements: BuilderElementStore;
  readonly history: BuilderHistoryStore;
  readonly localization: BuilderLocalizationStore;
  readonly persistence: BuilderPersistenceStore;

  constructor(
    document = createEmptyFormDocument(),
    repository: FormRepository = formRepository,
    localePreferences: BuilderLocalePreferences = builderLocalePreferences,
  ) {
    this.draft = new BuilderDraftStore(document);
    this.elements = new BuilderElementStore(this.draft);
    this.history = this.draft.history;
    this.localization = new BuilderLocalizationStore(this.draft, this.elements, localePreferences);
    this.persistence = new BuilderPersistenceStore(this.draft, repository);
    makeAutoObservable(
      this,
      { draft: false, elements: false, history: false, localization: false, persistence: false },
      { autoBind: true },
    );
  }

  get document(): JBFormDocumentV1 {
    return this.draft.document;
  }

  get repository(): FormRepository {
    return this.persistence.repository;
  }

  get status(): BuilderStatus {
    return this.persistence.status;
  }

  get isDirty(): boolean {
    return this.draft.isDirty;
  }

  get issues(): string[] {
    return this.persistence.issues;
  }

  get linkedRecord(): LinkedFormReference | null {
    return this.persistence.linkedRecord;
  }

  get hasSavedDraft(): boolean {
    return this.persistence.hasSavedDraft;
  }

  get storageIssue(): StorageIssue | null {
    return this.persistence.storageIssue;
  }

  get editingLocale(): string {
    return this.localization.editingLocale;
  }

  get selectedElement(): JBFormElementV1 | null {
    return this.elements.selected;
  }

  get selectedElementId(): string | null {
    return this.elements.selectedElementId;
  }

  get formName(): string {
    return this.localization.formName;
  }

  get canUndo(): boolean {
    return this.history.canUndo && this.status !== "saving";
  }

  get canRedo(): boolean {
    return this.history.canRedo && this.status !== "saving";
  }

  createDocumentSnapshot(): JBFormDocumentV1 {
    return this.draft.snapshot();
  }

  selectElement(elementId: string): void {
    this.elements.select(elementId);
  }

  setReady(): void {
    this.persistence.setReady();
  }

  setLoadError(message: string): void {
    this.persistence.setLoadError(message);
  }

  async initialize(slug?: string): Promise<boolean> {
    const initialized = await this.persistence.initialize(slug);
    if (initialized) {
      this.elements.clearSelection();
      this.localization.restoreForDocument(slug ? `slug:${slug}` : "current");
    }
    return initialized;
  }

  async deleteCorruptRecord(slug?: string): Promise<boolean> {
    return this.persistence.deleteCorruptRecord(slug);
  }

  importDocument(document: JBFormDocumentV1): boolean {
    if (this.status === "saving") return false;
    this.draft.import(document);
    this.elements.clearSelection();
    this.localization.restoreForDocument();
    this.persistence.resetForImport();
    return true;
  }

  undo(): boolean {
    if (!this.canUndo || !this.draft.undo()) return false;
    this.elements.reconcileSelection();
    this.persistence.setReady();
    return true;
  }

  redo(): boolean {
    if (!this.canRedo || !this.draft.redo()) return false;
    this.elements.reconcileSelection();
    this.persistence.setReady();
    return true;
  }

  async save(options: { slug?: string; saveAs?: boolean } = {}): Promise<boolean> {
    const saved = await this.persistence.save(options);
    if (saved) this.elements.reconcileSelection();
    return saved;
  }

  addElement(entry: FormElementRegistryEntry, insertionIndex = this.document.elements.length): string {
    return this.elements.add(entry, insertionIndex);
  }

  addCatalogElement(entry: FormElementRegistryEntry): string {
    if (!entry.isContainer && this.selectedElementId) {
      const parent = this.elements.getParentTab(this.selectedElementId);
      if (parent) return this.addElementToTab(parent.containerId, parent.tabId, entry) ?? this.addElement(entry);
      const conditionalParent = this.elements.getParentCondition(this.selectedElementId);
      if (conditionalParent) return this.addElementToCondition(conditionalParent.containerId, entry) ?? this.addElement(entry);
      const wizardParent = this.elements.getParentWizard(this.selectedElementId);
      if (wizardParent) return this.addElementToWizard(wizardParent.containerId, wizardParent.stepId, entry) ?? this.addElement(entry);
      const repeatableParent = this.elements.getParentRepeatableGroup(this.selectedElementId);
      if (repeatableParent) return this.addElementToRepeatableGroup(repeatableParent.containerId, entry) ?? this.addElement(entry);
      const activeTabId = this.activeContainerTabs.get(this.selectedElementId);
      if (activeTabId) {
        if (this.selectedElement?.type === "jb-form-wizard") return this.addElementToWizard(this.selectedElementId, activeTabId, entry) ?? this.addElement(entry);
        return this.addElementToTab(this.selectedElementId, activeTabId, entry) ?? this.addElement(entry);
      }
      if (this.selectedElement?.type === "jb-condition") return this.addElementToCondition(this.selectedElement.id, entry) ?? this.addElement(entry);
    }
    return this.addElement(entry);
  }

  setActiveContainerTab(containerId: string, tabId: string): void {
    this.activeContainerTabs.set(containerId, tabId);
  }

  addElementToTab(containerId: string, tabId: string, entry: FormElementRegistryEntry, insertionIndex?: number): string | null {
    return this.elements.addToTab(containerId, tabId, entry, insertionIndex);
  }

  addElementToCondition(containerId: string, entry: FormElementRegistryEntry, insertionIndex?: number): string | null {
    return this.elements.addToCondition(containerId, entry, insertionIndex);
  }

  addElementToWizard(containerId: string, stepId: string, entry: FormElementRegistryEntry, insertionIndex?: number): string | null {
    return this.elements.addToWizard(containerId, stepId, entry, insertionIndex);
  }

  addElementToRepeatableGroup(containerId: string, entry: FormElementRegistryEntry, insertionIndex?: number): string | null {
    return this.elements.addToRepeatableGroup(containerId, entry, insertionIndex);
  }

  addTab(containerId: string): string | null {
    return this.elements.addTab(containerId);
  }

  updateTab(containerId: string, tabId: string, patch: Partial<Pick<JBTabElementV1["tabs"][number], "value" | "label" | "disabled" | "color">>): boolean {
    return this.elements.updateTab(containerId, tabId, patch);
  }

  removeTab(containerId: string, tabId: string): boolean {
    return this.elements.removeTab(containerId, tabId);
  }

  moveTab(containerId: string, tabId: string, offset: -1 | 1): number {
    return this.elements.moveTab(containerId, tabId, offset);
  }

  addWizardStep(containerId: string): string | null {
    return this.elements.addWizardStep(containerId);
  }

  updateWizardStep(containerId: string, stepId: string, patch: Partial<Pick<JBFormWizardElementV1["steps"][number], "value" | "label">>): boolean {
    return this.elements.updateWizardStep(containerId, stepId, patch);
  }

  removeWizardStep(containerId: string, stepId: string): boolean {
    return this.elements.removeWizardStep(containerId, stepId);
  }

  moveWizardStep(containerId: string, stepId: string, offset: -1 | 1): number {
    return this.elements.moveWizardStep(containerId, stepId, offset);
  }

  updateSelectedElement(patch: Partial<Pick<JBFormLeafElementV1, "name" | "label" | "placeholder" | "required" | "disabled" | "initialValue">>): void {
    this.elements.updateSelected(patch);
  }

  updateSelectedProp(key: string, value: JSONValue | undefined): void {
    this.elements.updateSelectedProp(key, value);
  }

  updateSelectedContainerValidationScope(scope: "all" | "active"): void {
    this.elements.updateSelectedContainerValidationScope(scope);
  }

  updateSelectedConditionMatch(match: JBConditionMatch): void {
    this.elements.updateSelectedConditionMatch(match);
  }

  addSelectedConditionRule(fieldName: string): string | null {
    return this.elements.addSelectedConditionRule(fieldName);
  }

  updateSelectedConditionRule(ruleId: string, patch: Partial<Omit<JBConditionRuleV1, "id">>): void {
    this.elements.updateSelectedConditionRule(ruleId, patch);
  }

  removeSelectedConditionRule(ruleId: string): void {
    this.elements.removeSelectedConditionRule(ruleId);
  }

  addSelectedValidationRule(rule: ValidationRuleName, locale = "en"): string | null {
    return this.elements.addValidationRule(rule, locale);
  }

  updateSelectedValidationRule(ruleId: string, nextRule: JBValidationRule): void {
    this.elements.updateValidationRule(ruleId, nextRule);
  }

  removeSelectedValidationRule(ruleId: string): void {
    this.elements.removeValidationRule(ruleId);
  }

  updateSelectedLocalizedProp(key: string, value: string, locale = "en"): void {
    this.localization.updateSelectedLocalizedProp(key, value, locale);
  }

  updateSelectedText(key: "label" | "placeholder", value: string, locale = "en"): void {
    this.localization.updateSelectedText(key, value, locale);
  }

  updateFormName(name: string, locale = "en"): void {
    this.localization.updateFormName(name, locale);
  }

  setEditingLocale(locale: string): void {
    this.localization.setEditingLocale(locale);
  }

  setFormLocalization(localization: FormLocalization): void {
    this.localization.setFormLocalization(localization);
  }

  getElementNameError(elementId: string): "required" | "invalid" | null {
    return this.elements.getNameError(elementId);
  }

  moveElementBy(elementId: string, offset: -1 | 1): number {
    return this.elements.moveBy(elementId, offset);
  }

  moveElementToInsertionIndex(elementId: string, insertionIndex: number): number {
    return this.elements.moveToInsertionIndex(elementId, insertionIndex);
  }

  moveElementToTabInsertionIndex(elementId: string, containerId: string, tabId: string, insertionIndex: number): number {
    return this.elements.moveToTabInsertionIndex(elementId, containerId, tabId, insertionIndex);
  }

  moveElementToConditionInsertionIndex(elementId: string, containerId: string, insertionIndex: number): number {
    return this.elements.moveToConditionInsertionIndex(elementId, containerId, insertionIndex);
  }

  moveElementToWizardInsertionIndex(elementId: string, containerId: string, stepId: string, insertionIndex: number): number {
    return this.elements.moveToWizardInsertionIndex(elementId, containerId, stepId, insertionIndex);
  }

  moveElementToRepeatableGroupInsertionIndex(elementId: string, containerId: string, insertionIndex: number): number {
    return this.elements.moveToRepeatableGroupInsertionIndex(elementId, containerId, insertionIndex);
  }

  findElement(elementId: string): JBFormElementV1 | null {
    return this.elements.find(elementId);
  }

  duplicateElement(elementId: string): string | null {
    return this.elements.duplicate(elementId);
  }

  removeElement(elementId: string): string | null {
    return this.elements.remove(elementId);
  }

  announce(message: string): void {
    this.announcement = message;
  }

  getElementPosition(elementId: string): number {
    return this.elements.getPosition(elementId);
  }
}
