import type { FormIssue } from "../../../domain/form-issue";
import rendererStyles from "../style.css?inline";
import type { RendererDependency, RendererState } from "../types";
import type { RendererShell } from "./types";

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
  shell.status.hidden = state !== "loading";
  shell.status.textContent = state === "loading" ? "Rendering form…" : "";

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
  }
  if (dependencies.length > 0) {
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
