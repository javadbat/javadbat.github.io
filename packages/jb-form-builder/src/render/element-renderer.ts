import { getLocalizedText, isConditionElement, isContainerElement, isRepeatableGroupElement, isWizardElement, type JBConditionElementV1, type JBFormElementV1, type JBFormWizardElementV1, type JBRepeatableGroupElementV1, type JBTabElementV1, type LocalizedText } from "../contract/form-document";
import type { JBConditionGroup, JBConditionValue } from "jb-condition";
import type { FormIssue } from "../contract/form-issue";
import { registryByType, type FormElementRegistryEntry } from "../registry/form-element-registry";
import type { RuntimeFormElement } from "../registry/form-element-adapter";

/** One rendered document element wrapper plus an optional isolated failure. */
export interface RenderedElement {
  wrapper: HTMLElement;
  issues: FormIssue[];
}

function rendererIssue(element: JBFormElementV1, code: string, message: string): FormIssue {
  return {
    source: "renderer",
    code,
    path: `/elements/${element.id}`,
    messageKey: `form.renderer.${code}`,
    message,
    elementId: element.id,
    details: {
      name: element.name,
      type: element.type,
    },
  };
}

function createWrapper(element: JBFormElementV1): HTMLDivElement {
  const wrapper = document.createElement("div");
  wrapper.setAttribute("part", "element");
  wrapper.dataset.elementId = element.id;
  wrapper.dataset.elementType = element.type;
  return wrapper;
}

function appendElementError(wrapper: HTMLElement, element: JBFormElementV1, message: string): void {
  const error = document.createElement("p");
  error.setAttribute("part", "element-error");
  error.setAttribute("role", "alert");
  error.textContent = `${element.name}: ${message}`;
  wrapper.append(error);
}

function renderRuntimeElement(wrapper: HTMLElement, element: JBFormElementV1, adapter: FormElementRegistryEntry, locale: string, defaultLocale: string): void {
  // Element content is created through DOM APIs and textContent only. Portable
  // JSON is never interpreted as HTML, script, or an executable callback.
  const runtimeTagName = element.type === "section-heading" && (element.props.level === "h3" || element.props.level === "h4")
    ? element.props.level
    : adapter.tagName;
  const runtimeElement = document.createElement(runtimeTagName) as RuntimeFormElement;
  runtimeElement.id = element.id;
  runtimeElement.dataset.formElementId = element.id;
  adapter.applyToRuntime(runtimeElement, element, locale, defaultLocale);
  wrapper.append(runtimeElement);
}

function setTabPanelEnabled(panel: HTMLElement, enabled: boolean): void {
  panel.querySelectorAll<HTMLElement>("[data-form-element-id]").forEach(control => {
    const documentDisabled = control.dataset.documentDisabled === "true";
    const nextDisabled = documentDisabled || !enabled;
    (control as HTMLElement & { disabled?: boolean }).disabled = nextDisabled;
    control.toggleAttribute("disabled", nextDisabled);
  });
}

function applyActiveValidationScope(tabRoot: HTMLElement, selectedValue: string | null): void {
  tabRoot.querySelectorAll<HTMLElement>("jb-tab-content").forEach(panel => {
    setTabPanelEnabled(panel, panel.getAttribute("value") === selectedValue);
  });
}

function renderTabElement(wrapper: HTMLElement, element: JBTabElementV1, locale: string, unavailableTypes: ReadonlySet<string>, defaultLocale: string): FormIssue[] {
  const issues: FormIssue[] = [];
  const tabRoot = document.createElement("jb-tab") as HTMLElement & { value?: string | null; defaultValue?: string | null; nullable?: boolean };
  tabRoot.id = element.id;
  tabRoot.dataset.formElementId = element.id;
  const defaultValue = typeof element.props.defaultValue === "string" ? element.props.defaultValue : null;
  tabRoot.defaultValue = defaultValue;
  tabRoot.nullable = element.props.nullable === true;
  if (defaultValue !== null) tabRoot.setAttribute("default-value", defaultValue);
  tabRoot.toggleAttribute("nullable", element.props.nullable === true);

  const list = document.createElement("jb-tab-list") as HTMLElement & { orientation?: string; size?: string };
  const orientation = element.props.orientation === "vertical" ? "vertical" : "horizontal";
  const size = typeof element.props.size === "string" ? element.props.size : "md";
  list.orientation = orientation;
  list.size = size;
  list.setAttribute("orientation", orientation);
  list.setAttribute("size", size);
  tabRoot.dataset.orientation = orientation;
  const ariaLabel = element.props.ariaLabel;
  list.setAttribute("aria-label", typeof ariaLabel === "object" && ariaLabel !== null ? getLocalizedText(ariaLabel as never, locale, defaultLocale) : "Form sections");

  for (const tab of element.tabs) {
    const trigger = document.createElement("jb-tab-trigger") as HTMLElement & { disabled?: boolean; value?: string };
    trigger.value = tab.value;
    trigger.setAttribute("value", tab.value);
    trigger.disabled = tab.disabled;
    trigger.toggleAttribute("disabled", tab.disabled);
    if (tab.color) trigger.setAttribute("color", tab.color);
    trigger.textContent = getLocalizedText(tab.label, locale, defaultLocale);
    list.append(trigger);
  }
  tabRoot.append(list);

  const panelStage = document.createElement("div");
  panelStage.setAttribute("part", "tab-panels");

  for (const tab of element.tabs) {
    const panel = document.createElement("jb-tab-content");
    panel.setAttribute("value", tab.value);
    panel.dataset.tabId = tab.id;
    for (const child of tab.children) {
      const rendered = renderFormElement(child, locale, unavailableTypes, defaultLocale);
      panel.append(rendered.wrapper);
      issues.push(...rendered.issues);
    }
    panelStage.append(panel);
  }
  tabRoot.append(panelStage);
  if (element.validationScope === "active") {
    const updateScope = () => applyActiveValidationScope(tabRoot, tabRoot.value ?? defaultValue);
    tabRoot.addEventListener("change", updateScope);
    queueMicrotask(updateScope);
  } else {
    tabRoot.querySelectorAll<HTMLElement>("[data-form-element-id]").forEach(control => {
      control.dataset.documentDisabled = String((control as HTMLElement & { disabled?: boolean }).disabled === true);
    });
  }
  wrapper.append(tabRoot);
  return issues;
}

function renderConditionElement(wrapper: HTMLElement, element: JBConditionElementV1, locale: string, unavailableTypes: ReadonlySet<string>, defaultLocale: string): FormIssue[] {
  const issues: FormIssue[] = [];
  const condition = document.createElement("jb-condition") as HTMLElement & {
    conditions: JBConditionGroup;
    value: JBConditionValue;
  };
  condition.id = element.id;
  condition.dataset.formElementId = element.id;
  condition.conditions = structuredClone(element.conditions) as JBConditionGroup;
  condition.value = {};
  for (const child of element.children) {
    const rendered = renderFormElement(child, locale, unavailableTypes, defaultLocale);
    condition.append(rendered.wrapper);
    issues.push(...rendered.issues);
  }
  wrapper.append(condition);
  return issues;
}

function localizedProperty(element: JBFormWizardElementV1, key: string, locale: string, defaultLocale: string, fallback: string): string {
  const value = element.props[key];
  return typeof value === "object" && value !== null && !Array.isArray(value) && "translations" in value
    ? getLocalizedText(value as unknown as LocalizedText, locale, defaultLocale)
    : fallback;
}

function renderWizardElement(wrapper: HTMLElement, element: JBFormWizardElementV1, locale: string, unavailableTypes: ReadonlySet<string>, defaultLocale: string): FormIssue[] {
  const issues: FormIssue[] = [];
  const wizard = document.createElement("jb-form-wizard");
  wizard.id = element.id;
  wizard.dataset.formElementId = element.id;
  wizard.setAttribute("validation-mode", element.props.validationMode === "none" ? "none" : "current");
  wizard.setAttribute("previous-label", localizedProperty(element, "previousLabel", locale, defaultLocale, "Previous"));
  wizard.setAttribute("next-label", localizedProperty(element, "nextLabel", locale, defaultLocale, "Next"));
  wizard.setAttribute("complete-label", localizedProperty(element, "completeLabel", locale, defaultLocale, "Complete"));
  for (const step of element.steps) {
    const stepRoot = document.createElement("section");
    stepRoot.dataset.wizardStep = "";
    stepRoot.dataset.stepId = step.id;
    stepRoot.dataset.stepValue = step.value;
    stepRoot.dataset.stepLabel = getLocalizedText(step.label, locale, defaultLocale);
    for (const child of step.children) {
      const rendered = renderFormElement(child, locale, unavailableTypes, defaultLocale);
      stepRoot.append(rendered.wrapper);
      issues.push(...rendered.issues);
    }
    wizard.append(stepRoot);
  }
  wrapper.append(wizard);
  return issues;
}

function repeatableNumber(element: JBRepeatableGroupElementV1, key: string, fallback: number): number {
  const value = element.props[key];
  return typeof value === "number" && Number.isInteger(value) && value >= 0 ? value : fallback;
}

function cloneLeafForRepeat(element: JBFormElementV1): JBFormElementV1 {
  const clone = structuredClone(element);
  clone.id = crypto.randomUUID();
  return clone;
}

function renderRepeatableGroup(wrapper: HTMLElement, element: JBRepeatableGroupElementV1, locale: string, unavailableTypes: ReadonlySet<string>, defaultLocale: string): FormIssue[] {
  const issues: FormIssue[] = [];
  const minItems = repeatableNumber(element, "minItems", 1);
  const maxItems = Math.max(minItems, repeatableNumber(element, "maxItems", 10));
  const initialCount = Math.min(maxItems, Math.max(minItems, repeatableNumber(element, "repeatCount", minItems)));
  const group = document.createElement("jb-repeatable-group");
  group.setAttribute("part", "repeatable-group");
  group.dataset.formElementId = element.id;
  group.dataset.repeatableGroup = element.name;
  const instances = document.createElement("div");
  instances.setAttribute("part", "repeatable-items");
  const addButton = document.createElement("button");
  addButton.type = "button";
  addButton.textContent = "Add item";
  const removeButton = document.createElement("button");
  removeButton.type = "button";
  removeButton.textContent = "Remove item";
  const updateButtons = () => {
    removeButton.disabled = instances.children.length <= minItems;
    addButton.disabled = instances.children.length >= maxItems;
  };
  const addInstance = () => {
    if (instances.children.length >= maxItems) return;
    const subForm = document.createElement("jb-form");
    subForm.setAttribute("name", element.name);
    subForm.setAttribute("role", "group");
    for (const child of element.children) {
      const rendered = renderFormElement(cloneLeafForRepeat(child), locale, unavailableTypes, defaultLocale);
      subForm.append(rendered.wrapper);
      issues.push(...rendered.issues);
    }
    instances.append(subForm);
    updateButtons();
  };
  for (let index = 0; index < initialCount; index += 1) addInstance();
  const controls = document.createElement("div");
  addButton.addEventListener("click", addInstance);
  removeButton.addEventListener("click", () => {
    if (instances.children.length > minItems) instances.lastElementChild?.remove();
    updateButtons();
  });
  controls.append(addButton, removeButton);
  if (element.props.allowAdd === true) group.append(instances, controls);
  else group.append(instances);
  wrapper.append(group);
  updateButtons();
  return issues;
}

export function renderFormElement(element: JBFormElementV1, locale: string, unavailableTypes: ReadonlySet<string>, defaultLocale = "en"): RenderedElement {
  const wrapper = createWrapper(element);
  // A dependency failure is isolated to its own wrapper so the rest of a valid
  // form remains usable and the error stays in the original document position.
  if (unavailableTypes.has(element.type)) {
    const issue = rendererIssue(element, "dependency_unavailable", `${element.type} could not be loaded.`);
    appendElementError(wrapper, element, issue.message);
    return { wrapper, issues: [issue] };
  }

  const adapter = registryByType.get(element.type);
  if (!adapter) {
    const issue = rendererIssue(element, "adapter_unavailable", `${element.type} does not have a registered renderer adapter.`);
    appendElementError(wrapper, element, issue.message);
    return { wrapper, issues: [issue] };
  }

  try {
    if (isContainerElement(element)) {
      return {
        wrapper,
        issues: isConditionElement(element)
          ? renderConditionElement(wrapper, element, locale, unavailableTypes, defaultLocale)
          : isRepeatableGroupElement(element)
            ? renderRepeatableGroup(wrapper, element, locale, unavailableTypes, defaultLocale)
          : isWizardElement(element)
            ? renderWizardElement(wrapper, element, locale, unavailableTypes, defaultLocale)
            : renderTabElement(wrapper, element, locale, unavailableTypes, defaultLocale),
      };
    }
    renderRuntimeElement(wrapper, element, adapter, locale, defaultLocale);
    const runtime = wrapper.querySelector<HTMLElement>("[data-form-element-id]");
    if (runtime) runtime.dataset.documentDisabled = String(element.disabled === true);
    return { wrapper, issues: [] };
  } catch (error) {
    const issue = rendererIssue(
      element,
      "element_render_failed",
      error instanceof Error ? `${element.type} could not render: ${error.message}` : `${element.type} could not render.`,
    );
    appendElementError(wrapper, element, issue.message);
    return { wrapper, issues: [issue] };
  }
}
