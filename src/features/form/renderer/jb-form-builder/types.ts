import type { JBFormDocumentV1, JBFormElementType } from "../../domain/form-document";
import type { FormIssue } from "../../domain/form-issue";

/**
 * Keep the public contract in a DOM-light module. Framework wrappers and
 * consumers can import these types without importing React, storage, or route
 * code.
 */
export type FormValues = Record<string, unknown>;

export type RendererState = "empty" | "loading" | "waiting-dependencies" | "ready" | "invalid" | "degraded" | "error";

export interface RendererDependency {
  packageName: string;
  tagNames: readonly string[];
  elementType?: JBFormElementType;
}

export interface RuntimeJBForm extends HTMLElement {
  value: FormValues;
  getFormValues<TValues extends FormValues = FormValues>(): TValues;
  setFormValues<TValues extends FormValues = FormValues>(values: TValues, shouldUpdateInitialValue?: boolean): void;
  reset(): void;
  checkValidity(): boolean;
  reportValidity(): boolean;
  jbCheckValidity(parameters: { showError: boolean }): Promise<{ isAllValid: boolean }>;
}

export interface RendererReadyDetail {
  documentId: string;
  state: "ready";
  value: FormValues;
}

export interface RendererIssuesDetail {
  documentId?: string;
  issues: FormIssue[];
}

export interface RendererDependenciesDetail {
  dependencies: readonly RendererDependency[];
}

export interface RendererValueDetail {
  value: FormValues;
  sourceEvent: Event;
}

export interface JBFormBuilderElement extends HTMLElement {
  /**
   * Documents are assigned as objects because JSON attributes lose types and
   * have practical size/escaping limits.
   */
  formDocument: JBFormDocumentV1 | null;
  /**
   * When false, the host application owns custom-element registration and the
   * renderer performs no JB component package imports.
   */
  autoImport: boolean;
  locale: string | null;
  readonly state: RendererState;
  readonly form: RuntimeJBForm | null;
  readonly value: FormValues;
  /**
   * Property setters start asynchronous validation and package loading. This
   * promise gives framework wrappers a race-free completion boundary.
   */
  readonly updateComplete: Promise<void>;
  readonly requiredDependencies: readonly RendererDependency[];
  getFormValues(): FormValues;
  setFormValues(values: FormValues): void;
  reset(): void;
  checkValidity(): boolean;
  reportValidity(): boolean;
  checkValidityAsync(showError?: boolean): Promise<boolean>;
  retryRender(): Promise<void>;
}

export interface JBFormBuilderEventMap {
  ready: CustomEvent<RendererReadyDetail>;
  "document-invalid": CustomEvent<RendererIssuesDetail>;
  "render-error": CustomEvent<RendererIssuesDetail>;
  "dependencies-required": CustomEvent<RendererDependenciesDetail>;
  input: CustomEvent<RendererValueDetail>;
  change: CustomEvent<RendererValueDetail>;
  submit: CustomEvent<RendererValueDetail>;
  reset: CustomEvent<{ value: FormValues }>;
}

declare global {
  interface HTMLElementTagNameMap {
    "jb-form-builder": JBFormBuilderElement;
  }
}
