import type { JBFormElementV1 } from "../../../domain/form-document";
import type { FormIssue } from "../../../domain/form-issue";
import { registryByType, type FormElementRegistryEntry } from "../../../registry/form-element-registry";
import type { RuntimeFormElement } from "../../../registry/form-element-adapter";

/** One rendered document element wrapper plus an optional isolated failure. */
export interface RenderedElement {
  wrapper: HTMLElement;
  issue?: FormIssue;
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

export function renderFormElement(element: JBFormElementV1, locale: string, unavailableTypes: ReadonlySet<string>, defaultLocale = "en"): RenderedElement {
  const wrapper = createWrapper(element);
  // A dependency failure is isolated to its own wrapper so the rest of a valid
  // form remains usable and the error stays in the original document position.
  if (unavailableTypes.has(element.type)) {
    const issue = rendererIssue(element, "dependency_unavailable", `${element.type} could not be loaded.`);
    appendElementError(wrapper, element, issue.message);
    return { wrapper, issue };
  }

  const adapter = registryByType.get(element.type);
  if (!adapter) {
    const issue = rendererIssue(element, "adapter_unavailable", `${element.type} does not have a registered renderer adapter.`);
    appendElementError(wrapper, element, issue.message);
    return { wrapper, issue };
  }

  try {
    renderRuntimeElement(wrapper, element, adapter, locale, defaultLocale);
    return { wrapper };
  } catch (error) {
    const issue = rendererIssue(
      element,
      "element_render_failed",
      error instanceof Error ? `${element.type} could not render: ${error.message}` : `${element.type} could not render.`,
    );
    appendElementError(wrapper, element, issue.message);
    return { wrapper, issue };
  }
}
