import { makeAutoObservable, toJS } from "mobx";
import {
  isConditionElement,
  isContainerElement,
  isTabElement,
  isWizardElement,
  isRepeatableGroupElement,
  walkFormElements,
  type JBConditionElementV1,
  type JBConditionMatch,
  type JBConditionRuleV1,
  type JBFormElementV1,
  type JBFormLeafElementV1,
  type JBFormWizardElementV1,
  type JBRepeatableGroupElementV1,
  type JBTabElementV1,
  type JBValidationRule,
  type JSONValue,
} from "../../domain/form-document";
import { addMissingElementDefaultTranslations, createDefaultElement, type FormElementRegistryEntry } from "jb-form-builder/registry/form-element-registry";
import { createValidationRule, type ValidationRuleName } from "jb-form-builder/registry/validation-rule-registry";
import type { BuilderDraftStore } from "./BuilderDraftStore";

/** Portable field-name rule shared by configuration validation and mutation guards. */
export const ELEMENT_NAME_PATTERN = /^[A-Za-z][A-Za-z0-9_-]{0,63}$/;

/** Owns element selection, collection mutations, and selected-element validation rules. */
export class BuilderElementStore {
  /** Identity targeted by canvas and configuration UI. */
  selectedElementId: string | null = null;
  /** Draft boundary that records completed element mutations. */
  private readonly draft: BuilderDraftStore;

  /** Connects element operations to one editable document. */
  constructor(draft: BuilderDraftStore) {
    this.draft = draft;
    makeAutoObservable<this, "draft">(this, { draft: false }, { autoBind: true });
  }

  /** Flattened document hierarchy used for identity lookup and name uniqueness. */
  get all(): JBFormElementV1[] {
    return this.draft.document.elements.some(isContainerElement) ? walkFormElements(this.draft.document.elements) : this.draft.document.elements;
  }

  /** Selected element resolved from the current document hierarchy. */
  get selected(): JBFormElementV1 | null {
    return this.all.find(element => element.id === this.selectedElementId) ?? null;
  }

  /** Selects an existing element and reports whether its identity resolved. */
  select(elementId: string): boolean {
    if (!this.all.some(element => element.id === elementId)) return false;
    this.selectedElementId = elementId;
    return true;
  }

  /** Clears the current builder selection. */
  clearSelection(): void {
    this.selectedElementId = null;
  }

  /** Removes selection when replacement or history makes its identity stale. */
  reconcileSelection(): void {
    if (!this.all.some(element => element.id === this.selectedElementId)) this.selectedElementId = null;
  }

  /** Creates and inserts a registry element at the document root. */
  add(entry: FormElementRegistryEntry, insertionIndex = this.draft.document.elements.length): string {
    const element = this.createElement(entry);
    const index = Math.max(0, Math.min(insertionIndex, this.draft.document.elements.length));
    this.draft.document.elements.splice(index, 0, element);
    this.selectedElementId = element.id;
    this.draft.markChanged(this.draft.createElementInsertSnapshot(element, index));
    return element.id;
  }

  /** Creates and inserts a leaf element into one tab. */
  addToTab(containerId: string, tabId: string, entry: FormElementRegistryEntry, insertionIndex?: number): string | null {
    if (entry.isContainer) return null;
    const tab = this.getTab(containerId, tabId);
    if (!tab) return null;
    const element = this.createElement(entry);
    if (isContainerElement(element)) return null;
    const index = Math.max(0, Math.min(insertionIndex ?? tab.children.length, tab.children.length));
    tab.children.splice(index, 0, element);
    this.selectedElementId = element.id;
    this.draft.markChanged();
    return element.id;
  }

  /** Creates and inserts a leaf element into one condition container. */
  addToCondition(containerId: string, entry: FormElementRegistryEntry, insertionIndex?: number): string | null {
    if (entry.isContainer) return null;
    const container = this.getConditionContainer(containerId);
    if (!container) return null;
    const element = this.createElement(entry);
    if (isContainerElement(element)) return null;
    const index = Math.max(0, Math.min(insertionIndex ?? container.children.length, container.children.length));
    container.children.splice(index, 0, element);
    this.selectedElementId = element.id;
    this.draft.markChanged();
    return element.id;
  }

  /** Creates and inserts a leaf element into one wizard step. */
  addToWizard(containerId: string, stepId: string, entry: FormElementRegistryEntry, insertionIndex?: number): string | null {
    if (entry.isContainer) return null;
    const step = this.getWizardStep(containerId, stepId);
    if (!step) return null;
    const element = this.createElement(entry);
    if (isContainerElement(element)) return null;
    const index = Math.max(0, Math.min(insertionIndex ?? step.children.length, step.children.length));
    step.children.splice(index, 0, element);
    this.selectedElementId = element.id;
    this.draft.markChanged();
    return element.id;
  }

  /** Creates and inserts a leaf element into a repeatable-group template. */
  addToRepeatableGroup(containerId: string, entry: FormElementRegistryEntry, insertionIndex?: number): string | null {
    if (entry.isContainer) return null;
    const container = this.getRepeatableGroupContainer(containerId);
    if (!container) return null;
    const element = this.createElement(entry);
    if (isContainerElement(element)) return null;
    const index = Math.max(0, Math.min(insertionIndex ?? container.children.length, container.children.length));
    container.children.splice(index, 0, element);
    this.selectedElementId = element.id;
    this.draft.markChanged();
    return element.id;
  }

  /** Creates a registry default with a document-wide unique name and all configured locales. */
  private createElement(entry: FormElementRegistryEntry): JBFormElementV1 {
    const defaultLocale = this.draft.document.localization.defaultLocale;
    const element = createDefaultElement(entry, this.getAvailableName(entry.defaultName), defaultLocale);
    for (const locale of Object.keys(this.draft.document.localization.locales)) {
      if (locale !== defaultLocale) addMissingElementDefaultTranslations(element, defaultLocale, locale);
    }
    return element;
  }

  /** Adds a uniquely identified tab with a localized default label. */
  addTab(containerId: string): string | null {
    const container = this.getTabContainer(containerId);
    if (!container) return null;
    const values = new Set(container.tabs.map(tab => tab.value));
    let suffix = container.tabs.length + 1;
    while (values.has(`tab_${suffix}`)) suffix += 1;
    const id = crypto.randomUUID();
    const locale = this.draft.document.localization.defaultLocale;
    const label = locale.toLowerCase().split("-")[0] === "fa" ? `تب ${suffix}` : `Tab ${suffix}`;
    container.tabs.push({ id, value: `tab_${suffix}`, label: { translations: { [locale]: label } }, disabled: false, children: [] });
    this.draft.markChanged();
    return id;
  }

  /** Updates editable portable fields of one tab. */
  updateTab(containerId: string, tabId: string, patch: Partial<Pick<JBTabElementV1["tabs"][number], "value" | "label" | "disabled" | "color">>): boolean {
    const container = this.getTabContainer(containerId);
    const tab = container?.tabs.find(candidate => candidate.id === tabId);
    if (!container || !tab) return false;
    const oldValue = tab.value;
    Object.assign(tab, patch);
    if (patch.value && container.props.defaultValue === oldValue) container.props.defaultValue = patch.value;
    this.draft.markChanged();
    return true;
  }

  /** Removes a tab while preserving the container's required valid structure. */
  removeTab(containerId: string, tabId: string): boolean {
    const container = this.getTabContainer(containerId);
    if (!container || container.tabs.length <= 1) return false;
    const index = container.tabs.findIndex(tab => tab.id === tabId);
    if (index < 0) return false;
    const [removed] = container.tabs.splice(index, 1);
    if (removed.children.some(child => child.id === this.selectedElementId)) this.selectedElementId = container.id;
    if (container.props.defaultValue === removed.value) container.props.defaultValue = container.tabs.find(tab => !tab.disabled)?.value ?? container.tabs[0].value;
    this.draft.markChanged();
    return true;
  }

  /** Reorders a tab by one position and returns its resulting index. */
  moveTab(containerId: string, tabId: string, offset: -1 | 1): number {
    const container = this.getTabContainer(containerId);
    if (!container) return -1;
    const index = container.tabs.findIndex(tab => tab.id === tabId);
    if (index < 0) return -1;
    const next = Math.max(0, Math.min(index + offset, container.tabs.length - 1));
    if (next === index) return index;
    const [tab] = container.tabs.splice(index, 1);
    container.tabs.splice(next, 0, tab);
    this.draft.markChanged();
    return next;
  }

  /** Adds a uniquely identified wizard step with a localized default label. */
  addWizardStep(containerId: string): string | null {
    const container = this.getWizardContainer(containerId);
    if (!container) return null;
    const values = new Set(container.steps.map(step => step.value));
    let suffix = container.steps.length + 1;
    while (values.has(`step_${suffix}`)) suffix += 1;
    const id = crypto.randomUUID();
    const locale = this.draft.document.localization.defaultLocale;
    const label = locale.toLowerCase().split("-")[0] === "fa" ? `مرحله ${suffix}` : `Step ${suffix}`;
    container.steps.push({ id, value: `step_${suffix}`, label: { translations: { [locale]: label } }, children: [] });
    for (const targetLocale of Object.keys(this.draft.document.localization.locales)) {
      if (targetLocale !== locale) addMissingElementDefaultTranslations(container, locale, targetLocale);
    }
    this.draft.markChanged();
    return id;
  }

  /** Updates editable portable fields of one wizard step. */
  updateWizardStep(containerId: string, stepId: string, patch: Partial<Pick<JBFormWizardElementV1["steps"][number], "value" | "label">>): boolean {
    const step = this.getWizardStep(containerId, stepId);
    if (!step) return false;
    Object.assign(step, patch);
    this.draft.markChanged();
    return true;
  }

  /** Removes a wizard step while preserving the container's required valid structure. */
  removeWizardStep(containerId: string, stepId: string): boolean {
    const container = this.getWizardContainer(containerId);
    if (!container || container.steps.length <= 1) return false;
    const index = container.steps.findIndex(step => step.id === stepId);
    if (index < 0) return false;
    const [removed] = container.steps.splice(index, 1);
    if (removed.children.some(child => child.id === this.selectedElementId)) this.selectedElementId = container.id;
    this.draft.markChanged();
    return true;
  }

  /** Reorders a wizard step by one position and returns its resulting index. */
  moveWizardStep(containerId: string, stepId: string, offset: -1 | 1): number {
    const container = this.getWizardContainer(containerId);
    if (!container) return -1;
    const index = container.steps.findIndex(step => step.id === stepId);
    if (index < 0) return -1;
    const next = Math.max(0, Math.min(index + offset, container.steps.length - 1));
    if (next === index) return index;
    const [step] = container.steps.splice(index, 1);
    container.steps.splice(next, 0, step);
    this.draft.markChanged();
    return next;
  }

  /** Updates supported common fields on the selected leaf as one history change. */
  updateSelected(patch: Partial<Pick<JBFormLeafElementV1, "name" | "label" | "placeholder" | "required" | "disabled" | "initialValue">>): boolean {
    if (!this.selected) return false;
    const previousName = this.selected.name;
    const shouldUpdateReferences = patch.name !== undefined && this.all.filter(element => element.name === previousName).length === 1;
    if (isContainerElement(this.selected)) {
      if (patch.name !== undefined) this.selected.name = patch.name;
      this.draft.markChanged();
      return true;
    }
    Object.assign(this.selected, patch);
    if (shouldUpdateReferences && patch.name !== undefined) this.replaceConditionFieldName(previousName, patch.name);
    this.draft.markChanged();
    return true;
  }

  /** Updates or removes one registry-defined portable property on the selected element. */
  updateSelectedProp(key: string, value: JSONValue | undefined): boolean {
    if (!this.selected) return false;
    if (value === undefined) delete this.selected.props[key];
    else this.selected.props[key] = value;
    this.draft.markChanged();
    return true;
  }

  /** Changes whether selected-container validation covers all or active children. */
  updateSelectedContainerValidationScope(scope: "all" | "active"): boolean {
    if (!this.selected || !isTabElement(this.selected)) return false;
    this.selected.validationScope = scope;
    this.draft.markChanged();
    return true;
  }

  /** Adds a supported validation rule to the selected leaf and returns its identity. */
  addValidationRule(rule: ValidationRuleName, locale = "en"): string | null {
    if (!this.selected || isContainerElement(this.selected)) return null;
    const validation = createValidationRule(rule, locale);
    this.selected.validation.push(validation);
    this.draft.markChanged();
    return validation.id;
  }

  /** Replaces a validation rule while preserving its list position. */
  updateValidationRule(ruleId: string, nextRule: JBValidationRule): boolean {
    if (!this.selected || isContainerElement(this.selected)) return false;
    const index = this.selected.validation.findIndex(rule => rule.id === ruleId);
    if (index < 0) return false;
    this.selected.validation[index] = structuredClone({
      ...nextRule,
      params: toJS(nextRule.params),
      message: toJS(nextRule.message),
    }) as JBValidationRule;
    this.draft.markChanged();
    return true;
  }

  /** Removes a validation rule from the selected leaf. */
  removeValidationRule(ruleId: string): boolean {
    if (!this.selected || isContainerElement(this.selected)) return false;
    const index = this.selected.validation.findIndex(rule => rule.id === ruleId);
    if (index < 0) return false;
    this.selected.validation.splice(index, 1);
    this.draft.markChanged();
    return true;
  }

  /** Categorizes a field name as missing, invalid, or acceptable. */
  getNameError(elementId: string): "required" | "invalid" | null {
    const element = this.all.find(candidate => candidate.id === elementId);
    if (!element || element.name.length === 0) return "required";
    return ELEMENT_NAME_PATTERN.test(element.name) ? null : "invalid";
  }

  /** Moves an element one sibling position and returns its resulting index. */
  moveBy(elementId: string, offset: -1 | 1): number {
    const location = this.findLocation(elementId);
    if (!location) return -1;
    const { collection } = location;
    const currentIndex = location.index;
    if (currentIndex === -1) return -1;
    const nextIndex = Math.max(0, Math.min(currentIndex + offset, collection.length - 1));
    if (nextIndex === currentIndex) return currentIndex;
    const [element] = collection.splice(currentIndex, 1);
    collection.splice(nextIndex, 0, element);
    this.selectedElementId = elementId;
    this.draft.markChanged();
    return nextIndex;
  }

  /** Moves any element to a top-level insertion position. */
  moveToInsertionIndex(elementId: string, insertionIndex: number): number {
    const location = this.findLocation(elementId);
    if (!location) return -1;
    const collection = this.draft.document.elements;
    const currentIndex = location.index;
    const element = location.collection[currentIndex];
    if (!element || isContainerElement(element) && location.containerId !== null) return -1;
    const boundedInsertionIndex = Math.max(0, Math.min(insertionIndex, collection.length));
    const sameCollection = location.collection === collection;
    const nextIndex = sameCollection && boundedInsertionIndex > currentIndex ? boundedInsertionIndex - 1 : boundedInsertionIndex;
    if (sameCollection && nextIndex === currentIndex) return currentIndex;
    location.collection.splice(currentIndex, 1);
    collection.splice(nextIndex, 0, element);
    this.selectedElementId = elementId;
    this.draft.markChanged();
    return nextIndex;
  }

  /** Moves a leaf element into a specific tab insertion position. */
  moveToTabInsertionIndex(elementId: string, containerId: string, tabId: string, insertionIndex: number): number {
    const location = this.findLocation(elementId);
    const tab = this.getTab(containerId, tabId);
    if (!location || !tab) return -1;
    const element = location.collection[location.index];
    if (!element || isContainerElement(element)) return -1;
    const boundedIndex = Math.max(0, Math.min(insertionIndex, tab.children.length));
    const sameCollection = location.collection === tab.children;
    const nextIndex = sameCollection && boundedIndex > location.index ? boundedIndex - 1 : boundedIndex;
    if (sameCollection && nextIndex === location.index) return location.index;
    location.collection.splice(location.index, 1);
    tab.children.splice(nextIndex, 0, element);
    this.selectedElementId = elementId;
    this.draft.markChanged();
    return nextIndex;
  }

  /** Moves a leaf element into a condition container insertion position. */
  moveToConditionInsertionIndex(elementId: string, containerId: string, insertionIndex: number): number {
    const location = this.findLocation(elementId);
    const container = this.getConditionContainer(containerId);
    if (!location || !container) return -1;
    const element = location.collection[location.index];
    if (!element || isContainerElement(element)) return -1;
    const boundedIndex = Math.max(0, Math.min(insertionIndex, container.children.length));
    const sameCollection = location.collection === container.children;
    const nextIndex = sameCollection && boundedIndex > location.index ? boundedIndex - 1 : boundedIndex;
    if (sameCollection && nextIndex === location.index) return location.index;
    location.collection.splice(location.index, 1);
    container.children.splice(nextIndex, 0, element);
    this.selectedElementId = elementId;
    this.draft.markChanged();
    return nextIndex;
  }

  /** Moves a leaf element into a wizard-step insertion position. */
  moveToWizardInsertionIndex(elementId: string, containerId: string, stepId: string, insertionIndex: number): number {
    const location = this.findLocation(elementId);
    const step = this.getWizardStep(containerId, stepId);
    if (!location || !step) return -1;
    const element = location.collection[location.index];
    if (!element || isContainerElement(element)) return -1;
    const boundedIndex = Math.max(0, Math.min(insertionIndex, step.children.length));
    const sameCollection = location.collection === step.children;
    const nextIndex = sameCollection && boundedIndex > location.index ? boundedIndex - 1 : boundedIndex;
    if (sameCollection && nextIndex === location.index) return location.index;
    location.collection.splice(location.index, 1);
    step.children.splice(nextIndex, 0, element);
    this.selectedElementId = elementId;
    this.draft.markChanged();
    return nextIndex;
  }

  /** Moves a leaf element into a repeatable-group template insertion position. */
  moveToRepeatableGroupInsertionIndex(elementId: string, containerId: string, insertionIndex: number): number {
    const location = this.findLocation(elementId);
    const container = this.getRepeatableGroupContainer(containerId);
    if (!location || !container) return -1;
    const element = location.collection[location.index];
    if (!element || isContainerElement(element)) return -1;
    const boundedIndex = Math.max(0, Math.min(insertionIndex, container.children.length));
    const sameCollection = location.collection === container.children;
    const nextIndex = sameCollection && boundedIndex > location.index ? boundedIndex - 1 : boundedIndex;
    if (sameCollection && nextIndex === location.index) return location.index;
    location.collection.splice(location.index, 1);
    container.children.splice(nextIndex, 0, element);
    this.selectedElementId = elementId;
    this.draft.markChanged();
    return nextIndex;
  }

  /** Updates whether every or any rule controls the selected condition container. */
  updateSelectedConditionMatch(match: JBConditionMatch): boolean {
    if (!this.selected || !isConditionElement(this.selected)) return false;
    this.selected.conditions.match = match;
    this.draft.markChanged();
    return true;
  }

  /** Adds a condition rule targeting a named form field. */
  addSelectedConditionRule(fieldName: string): string | null {
    if (!this.selected || !isConditionElement(this.selected)) return null;
    const id = crypto.randomUUID();
    this.selected.conditions.rules.push({ id, fieldName, operator: "equals", value: "" });
    this.draft.markChanged();
    return id;
  }

  /** Updates the comparison definition of one selected-container condition rule. */
  updateSelectedConditionRule(ruleId: string, patch: Partial<Omit<JBConditionRuleV1, "id">>): boolean {
    if (!this.selected || !isConditionElement(this.selected)) return false;
    const rule = this.selected.conditions.rules.find(candidate => candidate.id === ruleId);
    if (!rule) return false;
    if (patch.fieldName !== undefined) rule.fieldName = patch.fieldName;
    if (patch.operator !== undefined) rule.operator = patch.operator;
    if ("value" in patch) {
      if (patch.value === undefined) delete rule.value;
      else rule.value = patch.value;
    }
    this.draft.markChanged();
    return true;
  }

  /** Removes one rule from the selected condition container. */
  removeSelectedConditionRule(ruleId: string): boolean {
    if (!this.selected || !isConditionElement(this.selected)) return false;
    const index = this.selected.conditions.rules.findIndex(rule => rule.id === ruleId);
    if (index < 0) return false;
    this.selected.conditions.rules.splice(index, 1);
    this.draft.markChanged();
    return true;
  }

  /** Resolves an element anywhere in the document hierarchy. */
  find(elementId: string): JBFormElementV1 | null {
    return this.all.find(element => element.id === elementId) ?? null;
  }

  /** Resolves the tab membership of a nested element. */
  getParentTab(elementId: string): { containerId: string; tabId: string } | null {
    const location = this.findLocation(elementId);
    return location?.containerId && location.tabId && isTabElement(this.find(location.containerId)!) ? { containerId: location.containerId, tabId: location.tabId } : null;
  }

  /** Resolves the wizard-step membership of a nested element. */
  getParentWizard(elementId: string): { containerId: string; stepId: string } | null {
    const location = this.findLocation(elementId);
    return location?.containerId && location.tabId && isWizardElement(this.find(location.containerId)!) ? { containerId: location.containerId, stepId: location.tabId } : null;
  }

  /** Resolves the condition-container membership of a nested element. */
  getParentCondition(elementId: string): { containerId: string } | null {
    const location = this.findLocation(elementId);
    return location?.containerId && location.tabId === null && isConditionElement(this.find(location.containerId)!) ? { containerId: location.containerId } : null;
  }

  /** Resolves the repeatable-group membership of a nested element. */
  getParentRepeatableGroup(elementId: string): { containerId: string } | null {
    const location = this.findLocation(elementId);
    return location?.containerId && location.tabId === null && isRepeatableGroupElement(this.find(location.containerId)!) ? { containerId: location.containerId } : null;
  }

  /** Deeply duplicates an element with fresh identities and a unique field name. */
  duplicate(elementId: string): string | null {
    const location = this.findLocation(elementId);
    if (!location) return null;
    const duplicate = structuredClone(toJS(location.collection[location.index])) as JBFormElementV1;
    this.regenerateIds(duplicate);
    location.collection.splice(location.index + 1, 0, duplicate as never);
    this.selectedElementId = duplicate.id;
    this.draft.markChanged();
    return duplicate.id;
  }

  /** Removes an element and returns the best next identity for canvas selection. */
  remove(elementId: string): string | null {
    const location = this.findLocation(elementId);
    if (!location) return this.selectedElementId;
    location.collection.splice(location.index, 1);
    const nextSelection = location.collection[location.index] ?? location.collection[location.index - 1] ?? (location.containerId ? this.find(location.containerId) : null);
    this.selectedElementId = nextSelection?.id ?? null;
    this.draft.markChanged();
    return this.selectedElementId;
  }

  /** Returns an element's top-level position for move-control status copy. */
  getPosition(elementId: string): number {
    return this.findLocation(elementId)?.index ?? -1;
  }

  /** Produces a document-wide unique portable field name from a registry default. */
  private getAvailableName(baseName: string): string {
    const names = new Set(this.all.map(element => element.name));
    if (!names.has(baseName)) return baseName;
    let suffix = 2;
    while (names.has(`${baseName}_${suffix}`)) suffix += 1;
    return `${baseName}_${suffix}`;
  }

  /** Resolves a tab container by identity. */
  private getTabContainer(containerId: string): JBTabElementV1 | null {
    const element = this.draft.document.elements.find(candidate => candidate.id === containerId);
    return element && isTabElement(element) ? element : null;
  }

  /** Resolves one tab within a tab container. */
  private getTab(containerId: string, tabId: string): JBTabElementV1["tabs"][number] | null {
    return this.getTabContainer(containerId)?.tabs.find(tab => tab.id === tabId) ?? null;
  }

  /** Resolves a condition container by identity. */
  private getConditionContainer(containerId: string): JBConditionElementV1 | null {
    const element = this.draft.document.elements.find(candidate => candidate.id === containerId);
    return element && isConditionElement(element) ? element : null;
  }

  /** Resolves a wizard container by identity. */
  private getWizardContainer(containerId: string): JBFormWizardElementV1 | null {
    const element = this.draft.document.elements.find(candidate => candidate.id === containerId);
    return element && isWizardElement(element) ? element : null;
  }

  /** Resolves one step within a wizard container. */
  private getWizardStep(containerId: string, stepId: string): JBFormWizardElementV1["steps"][number] | null {
    return this.getWizardContainer(containerId)?.steps.find(step => step.id === stepId) ?? null;
  }

  /** Resolves a repeatable-group container by identity. */
  private getRepeatableGroupContainer(containerId: string): JBRepeatableGroupElementV1 | null {
    const element = this.draft.document.elements.find(candidate => candidate.id === containerId);
    return element && isRepeatableGroupElement(element) ? element : null;
  }

  /** Locates an element's owning collection and structural context for move and delete operations. */
  private findLocation(elementId: string): { collection: JBFormElementV1[] | JBFormLeafElementV1[]; index: number; containerId: string | null; tabId: string | null } | null {
    const topIndex = this.draft.document.elements.findIndex(element => element.id === elementId);
    if (topIndex >= 0) return { collection: this.draft.document.elements, index: topIndex, containerId: null, tabId: null };
    for (const element of this.draft.document.elements) {
      if (isConditionElement(element)) {
        const index = element.children.findIndex(child => child.id === elementId);
        if (index >= 0) return { collection: element.children, index, containerId: element.id, tabId: null };
      }
      if (isTabElement(element)) {
        for (const tab of element.tabs) {
          const index = tab.children.findIndex(child => child.id === elementId);
          if (index >= 0) return { collection: tab.children, index, containerId: element.id, tabId: tab.id };
        }
      }
      if (isWizardElement(element)) {
        for (const step of element.steps) {
          const index = step.children.findIndex(child => child.id === elementId);
          if (index >= 0) return { collection: step.children, index, containerId: element.id, tabId: step.id };
        }
      }
      if (isRepeatableGroupElement(element)) {
        const index = element.children.findIndex(child => child.id === elementId);
        if (index >= 0) return { collection: element.children, index, containerId: element.id, tabId: null };
      }
    }
    return null;
  }

  /** Assigns fresh identities throughout a duplicated element subtree. */
  private regenerateIds(element: JBFormElementV1): void {
    element.id = crypto.randomUUID();
    if (isConditionElement(element)) {
      element.conditions.rules.forEach(rule => { rule.id = crypto.randomUUID(); });
      element.children.forEach(child => { child.id = crypto.randomUUID(); });
      return;
    }
    if (isWizardElement(element)) {
      element.steps.forEach(step => {
        step.id = crypto.randomUUID();
        step.children.forEach(child => { child.id = crypto.randomUUID(); });
      });
      return;
    }
    if (isRepeatableGroupElement(element)) {
      element.children.forEach(child => { child.id = crypto.randomUUID(); });
      return;
    }
    if (!isTabElement(element)) return;
    element.tabs.forEach(tab => {
      tab.id = crypto.randomUUID();
      tab.children.forEach(child => { child.id = crypto.randomUUID(); });
    });
  }

  /** Retargets condition rules after a source field is renamed. */
  private replaceConditionFieldName(previousName: string, nextName: string): void {
    this.draft.document.elements.filter(isConditionElement).forEach(container => {
      container.conditions.rules.forEach(rule => {
        if (rule.fieldName === previousName) rule.fieldName = nextName;
      });
    });
  }
}
