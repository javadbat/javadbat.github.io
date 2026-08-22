import { getLocalizedText, isConditionElement, isContainerElement, type JBConditionElementV1, type JBFormElementV1, type JBTabElementV1 } from "../../../domain/form-document";
import type { JBConditionGroup, JBConditionValue } from "jb-condition";
import type { FormIssue } from "../../../domain/form-issue";
import { registryByType, type FormElementRegistryEntry } from "../../../registry/form-element-registry";
import type { RuntimeFormElement } from "../../../registry/form-element-adapter";

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
  const runtimeElement = document.createElement(adapter.tagName) as RuntimeFormElement;
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
