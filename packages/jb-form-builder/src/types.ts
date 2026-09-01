import type { JBFormDocumentV1, JBFormElementType } from "./contract/form-document";
import type { FormIssue } from "./contract/form-issue";
import type { CheckValidityAsyncResult } from "jb-form";
import type { ThemeConfigV1 } from "./contract/theme-config";

/**
 * Keep the public contract in a DOM-light module. Framework wrappers and
 * consumers can import these types without importing React, storage, or route
 * code.
 */
export type FormValues = Record<string, unknown>;

export type RendererState = "empty" | "loading" | "ready" | "invalid" | "degraded" | "error";

export interface RendererDependency {
  packageName: string;
  tagNames: readonly string[];
  elementType?: JBFormElementType;
}

export interface DependencyFailure {
  dependency: RendererDependency;
  error: Error;
}

export interface DependencyLoadResult {
  failures: DependencyFailure[];
  missing: RendererDependency[];
}

export type DependencyLoader = (dependencies: readonly RendererDependency[]) => DependencyLoadResult | Promise<DependencyLoadResult>;

export interface RuntimeJBForm extends HTMLElement {
  value: FormValues;
  getFormValues<TValues extends FormValues = FormValues>(): TValues;
  setFormValues<TValues extends FormValues = FormValues>(values: TValues, shouldUpdateInitialValue?: boolean): void;
  reset(): void;
  checkValidity(): boolean;
  reportValidity(): boolean;
  jbCheckValidity(parameters: { showError: boolean }): Promise<CheckValidityAsyncResult>;
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

export interface RendererActionDetail extends RendererValueDetail {
  action: "next" | "previous" | "custom";
  buttonId: string;
  buttonName: string;
}

export interface FileUploadDetail {
  elementDom: HTMLElement;
  elementName: string;
  endpoint: string;
  fieldName: string;
}

export interface JBFormBuilderElement extends HTMLElement {
  /**
   * Documents are assigned as objects because JSON attributes lose types and
   * have practical size/escaping limits.
   */
  formDocument: JBFormDocumentV1 | null;
  /** Optional standalone visual configuration. Invalid assignments are rejected synchronously. */
  themeConfig: ThemeConfigV1 | null;
  /**
   * Optional dependency-loading policy supplied by the host application. When
   * omitted, the renderer performs no package imports and reports missing tags.
   */
  loadDependencies: DependencyLoader | null;
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
  action: CustomEvent<RendererActionDetail>;
  "file-upload": CustomEvent<FileUploadDetail>;
  reset: CustomEvent<{ value: FormValues }>;
  submit: CustomEvent<RendererValueDetail>;
}

declare global {
  interface HTMLElementTagNameMap {
    "jb-form-builder": JBFormBuilderElement;
  }
}
