import { makeAutoObservable, toJS } from "mobx";
import { isContainerElement, walkFormElements, type JBFormElementV1, type JBFormLeafElementV1, type JBTabElementV1, type JBValidationRule, type JSONValue } from "../../domain/form-document";
import { createDefaultElement, type FormElementRegistryEntry } from "../../registry/form-element-registry";
import { createValidationRule, type ValidationRuleName } from "../../registry/validation-rule-registry";
import type { BuilderDraftStore } from "./BuilderDraftStore";

export const ELEMENT_NAME_PATTERN = /^[A-Za-z][A-Za-z0-9_-]{0,63}$/;

/** Owns element selection, collection mutations, and selected-element validation rules. */
export class BuilderElementStore {
  selectedElementId: string | null = null;
  private readonly draft: BuilderDraftStore;

  constructor(draft: BuilderDraftStore) {
    this.draft = draft;
    makeAutoObservable<this, "draft">(this, { draft: false }, { autoBind: true });
  }

  get all(): JBFormElementV1[] {
    return this.draft.document.elements.some(isContainerElement) ? walkFormElements(this.draft.document.elements) : this.draft.document.elements;
  }

  get selected(): JBFormElementV1 | null {
    return this.all.find(element => element.id === this.selectedElementId) ?? null;
  }

  select(elementId: string): boolean {
    if (!this.all.some(element => element.id === elementId)) return false;
    this.selectedElementId = elementId;
    return true;
  }

  clearSelection(): void {
    this.selectedElementId = null;
  }

  reconcileSelection(): void {
    if (!this.all.some(element => element.id === this.selectedElementId)) this.selectedElementId = null;
  }

  add(entry: FormElementRegistryEntry, insertionIndex = this.draft.document.elements.length): string {
    const element = createDefaultElement(entry, this.getAvailableName(entry.defaultName));
    const index = Math.max(0, Math.min(insertionIndex, this.draft.document.elements.length));
    this.draft.document.elements.splice(index, 0, element);
    this.selectedElementId = element.id;
    this.draft.markChanged(this.draft.createElementInsertSnapshot(element, index));
    return element.id;
  }

  addToTab(containerId: string, tabId: string, entry: FormElementRegistryEntry, insertionIndex?: number): string | null {
    if (entry.isContainer) return null;
    const tab = this.getTab(containerId, tabId);
    if (!tab) return null;
    const element = createDefaultElement(entry, this.getAvailableName(entry.defaultName));
    if (isContainerElement(element)) return null;
    const index = Math.max(0, Math.min(insertionIndex ?? tab.children.length, tab.children.length));
    tab.children.splice(index, 0, element);
    this.selectedElementId = element.id;
    this.draft.markChanged();
    return element.id;
  }

  addTab(containerId: string): string | null {
    const container = this.getContainer(containerId);
    if (!container) return null;
    const values = new Set(container.tabs.map(tab => tab.value));
    let suffix = container.tabs.length + 1;
    while (values.has(`tab_${suffix}`)) suffix += 1;
    const id = crypto.randomUUID();
    container.tabs.push({ id, value: `tab_${suffix}`, label: { translations: { en: `Tab ${suffix}` } }, disabled: false, children: [] });
    this.draft.markChanged();
    return id;
  }

  updateTab(containerId: string, tabId: string, patch: Partial<Pick<JBTabElementV1["tabs"][number], "value" | "label" | "disabled" | "color">>): boolean {
    const container = this.getContainer(containerId);
    const tab = container?.tabs.find(candidate => candidate.id === tabId);
    if (!container || !tab) return false;
    const oldValue = tab.value;
    Object.assign(tab, patch);
    if (patch.value && container.props.defaultValue === oldValue) container.props.defaultValue = patch.value;
    this.draft.markChanged();
    return true;
  }

  removeTab(containerId: string, tabId: string): boolean {
    const container = this.getContainer(containerId);
    if (!container || container.tabs.length <= 1) return false;
    const index = container.tabs.findIndex(tab => tab.id === tabId);
    if (index < 0) return false;
    const [removed] = container.tabs.splice(index, 1);
    if (removed.children.some(child => child.id === this.selectedElementId)) this.selectedElementId = container.id;
    if (container.props.defaultValue === removed.value) container.props.defaultValue = container.tabs.find(tab => !tab.disabled)?.value ?? container.tabs[0].value;
    this.draft.markChanged();
    return true;
  }

  moveTab(containerId: string, tabId: string, offset: -1 | 1): number {
    const container = this.getContainer(containerId);
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

  updateSelected(patch: Partial<Pick<JBFormLeafElementV1, "name" | "label" | "placeholder" | "required" | "disabled" | "initialValue">>): boolean {
    if (!this.selected) return false;
    if (isContainerElement(this.selected)) {
      if (patch.name !== undefined) this.selected.name = patch.name;
      this.draft.markChanged();
      return true;
    }
    Object.assign(this.selected, patch);
    this.draft.markChanged();
    return true;
  }

  updateSelectedProp(key: string, value: JSONValue | undefined): boolean {
    if (!this.selected) return false;
    if (value === undefined) delete this.selected.props[key];
    else this.selected.props[key] = value;
    this.draft.markChanged();
    return true;
  }

  updateSelectedContainerValidationScope(scope: "all" | "active"): boolean {
    if (!this.selected || !isContainerElement(this.selected)) return false;
    this.selected.validationScope = scope;
    this.draft.markChanged();
    return true;
  }

  addValidationRule(rule: ValidationRuleName, locale = "en"): string | null {
    if (!this.selected || isContainerElement(this.selected)) return null;
    const validation = createValidationRule(rule, locale);
    this.selected.validation.push(validation);
    this.draft.markChanged();
    return validation.id;
  }

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

  removeValidationRule(ruleId: string): boolean {
    if (!this.selected || isContainerElement(this.selected)) return false;
    const index = this.selected.validation.findIndex(rule => rule.id === ruleId);
    if (index < 0) return false;
    this.selected.validation.splice(index, 1);
    this.draft.markChanged();
    return true;
  }

  getNameError(elementId: string): "required" | "invalid" | null {
    const element = this.all.find(candidate => candidate.id === elementId);
    if (!element || element.name.length === 0) return "required";
    return ELEMENT_NAME_PATTERN.test(element.name) ? null : "invalid";
  }

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

  find(elementId: string): JBFormElementV1 | null {
    return this.all.find(element => element.id === elementId) ?? null;
  }

  getParentTab(elementId: string): { containerId: string; tabId: string } | null {
    const location = this.findLocation(elementId);
    return location?.containerId && location.tabId ? { containerId: location.containerId, tabId: location.tabId } : null;
  }

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

  remove(elementId: string): string | null {
    const location = this.findLocation(elementId);
    if (!location) return this.selectedElementId;
    location.collection.splice(location.index, 1);
    const nextSelection = location.collection[location.index] ?? location.collection[location.index - 1] ?? (location.containerId ? this.getContainer(location.containerId) : null);
    this.selectedElementId = nextSelection?.id ?? null;
    this.draft.markChanged();
    return this.selectedElementId;
  }

  getPosition(elementId: string): number {
    return this.findLocation(elementId)?.index ?? -1;
  }

  private getAvailableName(baseName: string): string {
    const names = new Set(this.all.map(element => element.name));
    if (!names.has(baseName)) return baseName;
    let suffix = 2;
    while (names.has(`${baseName}_${suffix}`)) suffix += 1;
    return `${baseName}_${suffix}`;
  }

  private getContainer(containerId: string): JBTabElementV1 | null {
    const element = this.draft.document.elements.find(candidate => candidate.id === containerId);
    return element && isContainerElement(element) ? element : null;
  }

  private getTab(containerId: string, tabId: string): JBTabElementV1["tabs"][number] | null {
    return this.getContainer(containerId)?.tabs.find(tab => tab.id === tabId) ?? null;
  }

  private findLocation(elementId: string): { collection: JBFormElementV1[] | JBFormLeafElementV1[]; index: number; containerId: string | null; tabId: string | null } | null {
    const topIndex = this.draft.document.elements.findIndex(element => element.id === elementId);
    if (topIndex >= 0) return { collection: this.draft.document.elements, index: topIndex, containerId: null, tabId: null };
    for (const element of this.draft.document.elements) {
      if (!isContainerElement(element)) continue;
      for (const tab of element.tabs) {
        const index = tab.children.findIndex(child => child.id === elementId);
        if (index >= 0) return { collection: tab.children, index, containerId: element.id, tabId: tab.id };
      }
    }
    return null;
  }

  private regenerateIds(element: JBFormElementV1): void {
    element.id = crypto.randomUUID();
    if (!isContainerElement(element)) return;
    element.tabs.forEach(tab => {
      tab.id = crypto.randomUUID();
      tab.children.forEach(child => { child.id = crypto.randomUUID(); });
    });
  }
}
