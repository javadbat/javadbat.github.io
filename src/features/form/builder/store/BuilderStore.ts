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
import type { FormElementRegistryEntry } from "jb-form-builder/registry/form-element-registry";
import type { ValidationRuleName } from "jb-form-builder/registry/validation-rule-registry";
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
  /** Latest polite status message announced after builder actions. */
  announcement = "";
  /** Active tab or step selected within each tab-like container. */
  activeContainerTabs = new Map<string, string>();
  /** Editable document, dirty state, version, and history boundary. */
  readonly draft: BuilderDraftStore;
  /** Element selection and structural mutation boundary. */
  readonly elements: BuilderElementStore;
  /** Shared undo and redo timeline exposed to builder controls. */
  readonly history: BuilderHistoryStore;
  /** Localized document mutation and editing-locale boundary. */
  readonly localization: BuilderLocalizationStore;
  /** Repository workflow and persistence status boundary. */
  readonly persistence: BuilderPersistenceStore;

  /** Composes focused builder stores around one initial document and injectable platform services. */
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

  /** Current observable portable document shown across builder components. */
  get document(): JBFormDocumentV1 {
    return this.draft.document;
  }

  /** Repository used for load, draft save, and named-form persistence. */
  get repository(): FormRepository {
    return this.persistence.repository;
  }

  /** Persistence lifecycle state rendered by builder status surfaces. */
  get status(): BuilderStatus {
    return this.persistence.status;
  }

  /** Whether visible edits differ from the last successfully saved document. */
  get isDirty(): boolean {
    return this.draft.isDirty;
  }

  /** Current persistence diagnostics rendered by status UI. */
  get issues(): string[] {
    return this.persistence.issues;
  }

  /** Named-form identity and revision currently edited by the draft. */
  get linkedRecord(): LinkedFormReference | null {
    return this.persistence.linkedRecord;
  }

  /** Whether the current document has a persisted draft snapshot. */
  get hasSavedDraft(): boolean {
    return this.persistence.hasSavedDraft;
  }

  /** Structured storage failure available for localized recovery behavior. */
  get storageIssue(): StorageIssue | null {
    return this.persistence.storageIssue;
  }

  /** Locale whose translations are currently exposed by configuration controls. */
  get editingLocale(): string {
    return this.localization.editingLocale;
  }

  /** Selected element resolved from the current document hierarchy. */
  get selectedElement(): JBFormElementV1 | null {
    return this.elements.selected;
  }

  /** Stable identity of the selected element, retained across safe document mutations. */
  get selectedElementId(): string | null {
    return this.elements.selectedElementId;
  }

  /** Localized form title displayed in builder chrome. */
  get formName(): string {
    return this.localization.formName;
  }

  /** Whether undo is available and not blocked by an in-flight save. */
  get canUndo(): boolean {
    return this.history.canUndo && this.status !== "saving";
  }

  /** Whether redo is available and not blocked by an in-flight save. */
  get canRedo(): boolean {
    return this.history.canRedo && this.status !== "saving";
  }

  /** Returns a detached portable document for validation, export, or persistence. */
  createDocumentSnapshot(): JBFormDocumentV1 {
    return this.draft.snapshot();
  }

  /** Selects an element for canvas and configuration workflows. */
  selectElement(elementId: string): void {
    this.elements.select(elementId);
  }

  /** Clears persistence errors and returns the builder to its interactive state. */
  setReady(): void {
    this.persistence.setReady();
  }

  /** Exposes an unrecoverable initialization message through builder status UI. */
  setLoadError(message: string): void {
    this.persistence.setLoadError(message);
  }

  /** Loads route-selected form state and restores its scoped editing-locale preference. */
  async initialize(slug?: string): Promise<boolean> {
    /** Whether persistence initialization produced a usable in-memory workspace. */
    const initialized = await this.persistence.initialize(slug);
    if (initialized) {
      this.elements.clearSelection();
      this.localization.restoreForDocument(slug ? `slug:${slug}` : "current");
    }
    return initialized;
  }

  /** Deletes a corrupt source record through the persistence recovery workflow. */
  async deleteCorruptRecord(slug?: string): Promise<boolean> {
    return this.persistence.deleteCorruptRecord(slug);
  }

  /** Replaces the workspace with validated imported JSON and resets saved-form ownership. */
  importDocument(document: JBFormDocumentV1): boolean {
    if (this.status === "saving") return false;
    this.draft.import(document);
    this.elements.clearSelection();
    this.localization.restoreForDocument();
    this.persistence.resetForImport();
    return true;
  }

  /** Restores the previous document and reconciles selection and status. */
  undo(): boolean {
    if (!this.canUndo || !this.draft.undo()) return false;
    this.elements.reconcileSelection();
    this.persistence.setReady();
    return true;
  }

  /** Reapplies an undone document and reconciles selection and status. */
  redo(): boolean {
    if (!this.canRedo || !this.draft.redo()) return false;
    this.elements.reconcileSelection();
    this.persistence.setReady();
    return true;
  }

  /** Persists the current document and removes a selection that no longer resolves. */
  async save(options: { slug?: string; saveAs?: boolean } = {}): Promise<boolean> {
    /** Whether the persistence workflow committed successfully. */
    const saved = await this.persistence.save(options);
    if (saved) this.elements.reconcileSelection();
    return saved;
  }

  /** Inserts a registry element at a top-level document position. */
  addElement(entry: FormElementRegistryEntry, insertionIndex = this.document.elements.length): string {
    return this.elements.add(entry, insertionIndex);
  }

  /** Adds a catalog item to the most relevant selected container, falling back to top level. */
  addCatalogElement(entry: FormElementRegistryEntry): string {
    if (!entry.isContainer && this.selectedElementId) {
      /** Parent tab containing the selection, when present. */
      const parent = this.elements.getParentTab(this.selectedElementId);
      if (parent) return this.addElementToTab(parent.containerId, parent.tabId, entry) ?? this.addElement(entry);
      /** Parent condition containing the selection, when present. */
      const conditionalParent = this.elements.getParentCondition(this.selectedElementId);
      if (conditionalParent) return this.addElementToCondition(conditionalParent.containerId, entry) ?? this.addElement(entry);
      /** Parent wizard step containing the selection, when present. */
      const wizardParent = this.elements.getParentWizard(this.selectedElementId);
      if (wizardParent) return this.addElementToWizard(wizardParent.containerId, wizardParent.stepId, entry) ?? this.addElement(entry);
      /** Parent repeatable group containing the selection, when present. */
      const repeatableParent = this.elements.getParentRepeatableGroup(this.selectedElementId);
      if (repeatableParent) return this.addElementToRepeatableGroup(repeatableParent.containerId, entry) ?? this.addElement(entry);
      /** Active tab or wizard step when the selected element is itself a container. */
      const activeTabId = this.activeContainerTabs.get(this.selectedElementId);
      if (activeTabId) {
        if (this.selectedElement?.type === "jb-form-wizard") return this.addElementToWizard(this.selectedElementId, activeTabId, entry) ?? this.addElement(entry);
        return this.addElementToTab(this.selectedElementId, activeTabId, entry) ?? this.addElement(entry);
      }
      if (this.selectedElement?.type === "jb-condition") return this.addElementToCondition(this.selectedElement.id, entry) ?? this.addElement(entry);
    }
    return this.addElement(entry);
  }

  /** Remembers the active tab or wizard step used for subsequent catalog insertion. */
  setActiveContainerTab(containerId: string, tabId: string): void {
    this.activeContainerTabs.set(containerId, tabId);
  }

  /** Inserts an element into a specific tab. */
  addElementToTab(containerId: string, tabId: string, entry: FormElementRegistryEntry, insertionIndex?: number): string | null {
    return this.elements.addToTab(containerId, tabId, entry, insertionIndex);
  }

  /** Inserts an element into a condition container's child collection. */
  addElementToCondition(containerId: string, entry: FormElementRegistryEntry, insertionIndex?: number): string | null {
    return this.elements.addToCondition(containerId, entry, insertionIndex);
  }

  /** Inserts an element into a specific wizard step. */
  addElementToWizard(containerId: string, stepId: string, entry: FormElementRegistryEntry, insertionIndex?: number): string | null {
    return this.elements.addToWizard(containerId, stepId, entry, insertionIndex);
  }

  /** Inserts an element into a repeatable group's item template. */
  addElementToRepeatableGroup(containerId: string, entry: FormElementRegistryEntry, insertionIndex?: number): string | null {
    return this.elements.addToRepeatableGroup(containerId, entry, insertionIndex);
  }

  /** Adds a uniquely identified tab to the requested container. */
  addTab(containerId: string): string | null {
    return this.elements.addTab(containerId);
  }

  /** Applies editable value, label, availability, or color fields to one tab. */
  updateTab(containerId: string, tabId: string, patch: Partial<Pick<JBTabElementV1["tabs"][number], "value" | "label" | "disabled" | "color">>): boolean {
    return this.elements.updateTab(containerId, tabId, patch);
  }

  /** Removes a tab when doing so preserves the container's required structure. */
  removeTab(containerId: string, tabId: string): boolean {
    return this.elements.removeTab(containerId, tabId);
  }

  /** Moves a tab one position and returns its resulting index. */
  moveTab(containerId: string, tabId: string, offset: -1 | 1): number {
    return this.elements.moveTab(containerId, tabId, offset);
  }

  /** Adds a uniquely identified step to the requested wizard. */
  addWizardStep(containerId: string): string | null {
    return this.elements.addWizardStep(containerId);
  }

  /** Applies editable value or label fields to one wizard step. */
  updateWizardStep(containerId: string, stepId: string, patch: Partial<Pick<JBFormWizardElementV1["steps"][number], "value" | "label">>): boolean {
    return this.elements.updateWizardStep(containerId, stepId, patch);
  }

  /** Removes a wizard step when doing so preserves the container's required structure. */
  removeWizardStep(containerId: string, stepId: string): boolean {
    return this.elements.removeWizardStep(containerId, stepId);
  }

  /** Moves a wizard step one position and returns its resulting index. */
  moveWizardStep(containerId: string, stepId: string, offset: -1 | 1): number {
    return this.elements.moveWizardStep(containerId, stepId, offset);
  }

  /** Updates portable common fields on the selected leaf element. */
  updateSelectedElement(patch: Partial<Pick<JBFormLeafElementV1, "name" | "label" | "placeholder" | "required" | "disabled" | "initialValue">>): void {
    this.elements.updateSelected(patch);
  }

  /** Updates one registry-defined portable property on the selected element. */
  updateSelectedProp(key: string, value: JSONValue | undefined): void {
    this.elements.updateSelectedProp(key, value);
  }

  /** Chooses whether container validation covers all children or only the active branch. */
  updateSelectedContainerValidationScope(scope: "all" | "active"): void {
    this.elements.updateSelectedContainerValidationScope(scope);
  }

  /** Chooses whether every or any condition rule must match. */
  updateSelectedConditionMatch(match: JBConditionMatch): void {
    this.elements.updateSelectedConditionMatch(match);
  }

  /** Adds a condition rule targeting a named source field and returns its identity. */
  addSelectedConditionRule(fieldName: string): string | null {
    return this.elements.addSelectedConditionRule(fieldName);
  }

  /** Updates the portable comparison definition of one selected-container condition rule. */
  updateSelectedConditionRule(ruleId: string, patch: Partial<Omit<JBConditionRuleV1, "id">>): void {
    this.elements.updateSelectedConditionRule(ruleId, patch);
  }

  /** Removes one condition rule from the selected container. */
  removeSelectedConditionRule(ruleId: string): void {
    this.elements.removeSelectedConditionRule(ruleId);
  }

  /** Adds a supported validation rule to the selected element and returns its identity. */
  addSelectedValidationRule(rule: ValidationRuleName, locale = "en"): string | null {
    return this.elements.addValidationRule(rule, locale);
  }

  /** Replaces one validation rule on the selected element. */
  updateSelectedValidationRule(ruleId: string, nextRule: JBValidationRule): void {
    this.elements.updateValidationRule(ruleId, nextRule);
  }

  /** Removes one validation rule from the selected element. */
  removeSelectedValidationRule(ruleId: string): void {
    this.elements.removeValidationRule(ruleId);
  }

  /** Updates a registry-defined localized property in the requested locale. */
  updateSelectedLocalizedProp(key: string, value: string, locale = "en"): void {
    this.localization.updateSelectedLocalizedProp(key, value, locale);
  }

  /** Updates the selected element's common label or placeholder translation. */
  updateSelectedText(key: "label" | "placeholder", value: string, locale = "en"): void {
    this.localization.updateSelectedText(key, value, locale);
  }

  /** Updates the localized form title. */
  updateFormName(name: string, locale = "en"): void {
    this.localization.updateFormName(name, locale);
  }

  /** Switches which configured locale builder controls edit. */
  setEditingLocale(locale: string): void {
    this.localization.setEditingLocale(locale);
  }

  /** Replaces the form's locale definitions and reconciles translated content. */
  setFormLocalization(localization: FormLocalization): void {
    this.localization.setFormLocalization(localization);
  }

  /** Returns the selected element-name validation category used by configuration UI. */
  getElementNameError(elementId: string): "required" | "invalid" | null {
    return this.elements.getNameError(elementId);
  }

  /** Moves an element one sibling position and returns its resulting index. */
  moveElementBy(elementId: string, offset: -1 | 1): number {
    return this.elements.moveBy(elementId, offset);
  }

  /** Moves an element to a top-level insertion position. */
  moveElementToInsertionIndex(elementId: string, insertionIndex: number): number {
    return this.elements.moveToInsertionIndex(elementId, insertionIndex);
  }

  /** Moves an element into a tab insertion position. */
  moveElementToTabInsertionIndex(elementId: string, containerId: string, tabId: string, insertionIndex: number): number {
    return this.elements.moveToTabInsertionIndex(elementId, containerId, tabId, insertionIndex);
  }

  /** Moves an element into a condition container insertion position. */
  moveElementToConditionInsertionIndex(elementId: string, containerId: string, insertionIndex: number): number {
    return this.elements.moveToConditionInsertionIndex(elementId, containerId, insertionIndex);
  }

  /** Moves an element into a wizard-step insertion position. */
  moveElementToWizardInsertionIndex(elementId: string, containerId: string, stepId: string, insertionIndex: number): number {
    return this.elements.moveToWizardInsertionIndex(elementId, containerId, stepId, insertionIndex);
  }

  /** Moves an element into a repeatable-group template insertion position. */
  moveElementToRepeatableGroupInsertionIndex(elementId: string, containerId: string, insertionIndex: number): number {
    return this.elements.moveToRepeatableGroupInsertionIndex(elementId, containerId, insertionIndex);
  }

  /** Resolves an element anywhere in the portable document hierarchy. */
  findElement(elementId: string): JBFormElementV1 | null {
    return this.elements.find(elementId);
  }

  /** Deeply duplicates an element with fresh nested identities and a unique field name. */
  duplicateElement(elementId: string): string | null {
    return this.elements.duplicate(elementId);
  }

  /** Removes an element and returns the next element identity appropriate for selection. */
  removeElement(elementId: string): string | null {
    return this.elements.remove(elementId);
  }

  /** Publishes a polite builder status announcement for assistive technology. */
  announce(message: string): void {
    this.announcement = message;
  }

  /** Returns the selected element's top-level position for move-control copy. */
  getElementPosition(elementId: string): number {
    return this.elements.getPosition(elementId);
  }
}
