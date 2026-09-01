import type { JBFormDocumentV1 } from "../contract/form-document";
import { renderFormElement } from "./element-renderer";
import type { RuntimeJBForm } from "../types";
import type { RendererShell, RuntimeFormRender } from "./types";

export function buildRuntimeForm(documentValue: JBFormDocumentV1, locale: string, unavailableTypes: ReadonlySet<string>, options: { completionDisplay?: string } = {}): RuntimeFormRender {
  // npm can retain a nested jb-form copy when this package is built via its
  // own prefix. jb-form's async result contains private class members, so
  // TypeScript considers the two otherwise identical declarations nominally
  // different. The DOM tag is the runtime contract; bridge that boundary
  // explicitly instead of allowing the duplicate private types to leak.
  const form = document.createElement("jb-form") as unknown as RuntimeJBForm;
  form.setAttribute("part", "form");
  // ElementInternals supplies the role in supporting browsers. Keep an
  // attribute fallback so the generated form retains semantics everywhere.
  form.setAttribute("role", "form");
  form.setAttribute("aria-describedby", "jb-form-builder-error-summary");
  if (documentValue.slug) {
    form.setAttribute("name", documentValue.slug);
  }
  // Build the full child tree while detached. This avoids a layout/observer
  // cycle for every form element and lets jb-form connect with all fields ready.
  const fragment = document.createDocumentFragment();
  const issues = [];
  for (const element of documentValue.elements) {
    const rendered = renderFormElement(element, locale, unavailableTypes, documentValue.localization.defaultLocale);
    fragment.append(rendered.wrapper);
    issues.push(...rendered.issues);
  }
  form.append(fragment);
  if (options.completionDisplay) {
    form.querySelectorAll<HTMLElement>("jb-form-wizard").forEach(wizard => wizard.setAttribute("completion-display", options.completionDisplay!));
  }
  return { form, issues };
}

export function commitRuntimeForm(shell: RendererShell, runtime: RuntimeFormRender): void {
  shell.mount.replaceChildren(runtime.form);
}
