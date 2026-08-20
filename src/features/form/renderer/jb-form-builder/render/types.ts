import type { FormIssue } from "../../../domain/form-issue";
import type { RuntimeJBForm } from "../types";

/** DOM references owned by the renderer and reused across render cycles. */
export interface RendererShell {
  root: ShadowRoot;
  status: HTMLElement;
  errors: HTMLElement;
  mount: HTMLElement;
}

/** A detached runtime form and any non-fatal issues found while building it. */
export interface RuntimeFormRender {
  form: RuntimeJBForm;
  issues: FormIssue[];
}
