import type { JBFormDocumentV1 } from "../../domain/form-document";
import type { FormIssue } from "../../domain/form-issue";
import { renderFormElement } from "./element-renderer";
import rendererStyles from "./style.css?inline";
import type { RendererDependency, RendererState, RuntimeJBForm } from "./types";

export interface RendererShell {
  root: ShadowRoot;
  status: HTMLElement;
  errors: HTMLElement;
  mount: HTMLElement;
}

export interface RuntimeFormRender {
  form: RuntimeJBForm;
  issues: FormIssue[];
}

export function createRendererShell(host: HTMLElement): RendererShell {
  const root = host.shadowRoot ?? host.attachShadow({ mode: "open" });
  const stylesheet = document.createElement("style");
  // All design values remain authored in the adjacent pure CSS file. The build
  // supplies its text to the open Shadow Root so styles need no runtime fetch
  // and cannot leak into or out of the consuming application.
  stylesheet.textContent = rendererStyles;

  const status = document.createElement("div");
  status.setAttribute("part", "loading");
  status.setAttribute("role", "status");
  status.setAttribute("aria-live", "polite");

  const errors = document.createElement("div");
  errors.setAttribute("part", "error-summary");
  errors.setAttribute("role", "alert");
  errors.setAttribute("aria-live", "assertive");

  const mount = document.createElement("div");
  mount.setAttribute("part", "form-container");

  root.replaceChildren(stylesheet, status, errors, mount);
  return { root, status, errors, mount };
}

export function showRendererState(shell: RendererShell, state: RendererState, issues: readonly FormIssue[] = [], dependencies: readonly RendererDependency[] = []): void {
  shell.status.hidden = !(state === "loading" || state === "waiting-dependencies");
  shell.status.textContent = state === "loading" ? "Rendering form…" : state === "waiting-dependencies" ? "Waiting for form component dependencies." : "";

  shell.errors.replaceChildren();
  if (issues.length > 0) {
    const heading = document.createElement("strong");
    heading.textContent = "The form could not be rendered completely.";
    const list = document.createElement("ul");
    for (const issue of issues) {
      const item = document.createElement("li");
      item.textContent = issue.message;
      list.append(item);
    }
    shell.errors.append(heading, list);
  } else if (dependencies.length > 0) {
    const heading = document.createElement("strong");
    heading.textContent = "Load these dependencies, then retry:";
    const list = document.createElement("ul");
    for (const dependency of dependencies) {
      const item = document.createElement("li");
      item.textContent = `${dependency.packageName} (${dependency.tagNames.join(", ")})`;
      list.append(item);
    }
    shell.errors.append(heading, list);
  }
  shell.errors.hidden = issues.length === 0 && dependencies.length === 0;
}

export function clearRenderedForm(shell: RendererShell): void {
  shell.mount.replaceChildren();
}

export function buildRuntimeForm(documentValue: JBFormDocumentV1, locale: string, unavailableTypes: ReadonlySet<string>): RuntimeFormRender {
  const form = document.createElement("jb-form") as RuntimeJBForm;
  form.setAttribute("part", "form");
  if (documentValue.slug) {
    form.setAttribute("name", documentValue.slug);
  }
  // Build the full child tree while detached. This avoids a layout/observer
  // cycle for every form element and lets jb-form connect with all fields ready.
  const fragment = document.createDocumentFragment();
  const issues: FormIssue[] = [];
  for (const element of documentValue.elements) {
    const rendered = renderFormElement(element, locale, unavailableTypes);
    fragment.append(rendered.wrapper);
    if (rendered.issue) {
      issues.push(rendered.issue);
    }
  }
  form.append(fragment);
  return { form, issues };
}

export function commitRuntimeForm(shell: RendererShell, runtime: RuntimeFormRender): void {
  shell.mount.replaceChildren(runtime.form);
}
