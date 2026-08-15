import { makeAutoObservable, toJS } from "mobx";
import type { JBFormElementV1, JBValidationRule, JSONValue } from "../../domain/form-document";
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
    return this.draft.document.elements;
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

  add(entry: FormElementRegistryEntry, insertionIndex = this.all.length): string {
    const element = createDefaultElement(entry, this.getAvailableName(entry.defaultName));
    const index = Math.max(0, Math.min(insertionIndex, this.all.length));
    this.all.splice(index, 0, element);
    this.selectedElementId = element.id;
    this.draft.markChanged(this.draft.createElementInsertSnapshot(element, index));
    return element.id;
  }

  updateSelected(patch: Partial<Pick<JBFormElementV1, "name" | "label" | "placeholder" | "required" | "disabled" | "initialValue">>): boolean {
    if (!this.selected) return false;
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

  addValidationRule(rule: ValidationRuleName, locale = "en"): string | null {
    if (!this.selected) return null;
    const validation = createValidationRule(rule, locale);
    this.selected.validation.push(validation);
    this.draft.markChanged();
    return validation.id;
  }

  updateValidationRule(ruleId: string, nextRule: JBValidationRule): boolean {
    const index = this.selected?.validation.findIndex(rule => rule.id === ruleId);
    if (!this.selected || index === undefined || index < 0) return false;
    this.selected.validation[index] = structuredClone({
      ...nextRule,
      params: toJS(nextRule.params),
      message: toJS(nextRule.message),
    }) as JBValidationRule;
    this.draft.markChanged();
    return true;
  }

  removeValidationRule(ruleId: string): boolean {
    const index = this.selected?.validation.findIndex(rule => rule.id === ruleId);
    if (!this.selected || index === undefined || index < 0) return false;
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
    const currentIndex = this.getPosition(elementId);
    if (currentIndex === -1) return -1;
    const nextIndex = Math.max(0, Math.min(currentIndex + offset, this.all.length - 1));
    if (nextIndex === currentIndex) return currentIndex;
    const [element] = this.all.splice(currentIndex, 1);
    this.all.splice(nextIndex, 0, element);
    this.selectedElementId = elementId;
    this.draft.markChanged();
    return nextIndex;
  }

  moveToInsertionIndex(elementId: string, insertionIndex: number): number {
    const currentIndex = this.getPosition(elementId);
    if (currentIndex === -1) return -1;
    const boundedInsertionIndex = Math.max(0, Math.min(insertionIndex, this.all.length));
    const nextIndex = boundedInsertionIndex > currentIndex ? boundedInsertionIndex - 1 : boundedInsertionIndex;
    if (nextIndex === currentIndex) return currentIndex;
    const [element] = this.all.splice(currentIndex, 1);
    this.all.splice(nextIndex, 0, element);
    this.selectedElementId = elementId;
    this.draft.markChanged();
    return nextIndex;
  }

  duplicate(elementId: string): string | null {
    const sourceIndex = this.getPosition(elementId);
    if (sourceIndex === -1) return null;
    const duplicate = structuredClone(toJS(this.all[sourceIndex])) as JBFormElementV1;
    duplicate.id = crypto.randomUUID();
    this.all.splice(sourceIndex + 1, 0, duplicate);
    this.selectedElementId = duplicate.id;
    this.draft.markChanged();
    return duplicate.id;
  }

  remove(elementId: string): string | null {
    const currentIndex = this.getPosition(elementId);
    if (currentIndex === -1) return this.selectedElementId;
    this.all.splice(currentIndex, 1);
    const nextSelection = this.all[currentIndex] ?? this.all[currentIndex - 1] ?? null;
    this.selectedElementId = nextSelection?.id ?? null;
    this.draft.markChanged();
    return this.selectedElementId;
  }

  getPosition(elementId: string): number {
    return this.all.findIndex(element => element.id === elementId);
  }

  private getAvailableName(baseName: string): string {
    const names = new Set(this.all.map(element => element.name));
    if (!names.has(baseName)) return baseName;
    let suffix = 2;
    while (names.has(`${baseName}_${suffix}`)) suffix += 1;
    return `${baseName}_${suffix}`;
  }
}
