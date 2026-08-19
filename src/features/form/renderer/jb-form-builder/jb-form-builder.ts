import type { JBFormDocumentV1 } from "../../domain/form-document";
import type { FormIssue } from "../../domain/form-issue";
import { parseBooleanAttribute } from "jb-core";
import { cloneFormDocument, prepareFormDocument } from "./document-controller";
import { getMissingDependencies, getRequiredDependencies, loadDependencies, type DependencyFailure } from "./dependency-loader";
import { dispatchRendererEvent, FormEventController } from "./event-controller";
import { checkRuntimeFormValidity, checkRuntimeFormValidityAsync, getRuntimeFormValues, resetRuntimeForm, setRuntimeFormValues } from "./form-facade";
import { buildRuntimeForm, clearRenderedForm, commitRuntimeForm, createRendererShell, showRendererState, type RendererShell } from "./form-renderer";
import { configureFormLocale, resolveFormLocale } from "./locale-controller";
import { RenderStateController } from "./render-state";
import type { FormValues, JBFormBuilderElement, RendererDependency, RendererState, RuntimeJBForm } from "./types";
import {JBBaseComponent} from 'jb-core'
/**
 * Current product routes instantiate the component only in a browser. The
 * guarded base prevents module evaluation from immediately reading an absent
 * HTMLElement, keeping a future SSR-safe package entry achievable without
 * rewriting the component's concern modules.
 */

function dependencyIssue(failure: DependencyFailure): FormIssue {
  return {
    source: "renderer",
    code: "dependency_load_failed",
    path: "/elements",
    messageKey: "form.renderer.dependencyLoadFailed",
    message: `${failure.dependency.packageName} could not be loaded: ${failure.error.message}`,
    details: {
      packageName: failure.dependency.packageName,
      tagNames: [...failure.dependency.tagNames],
      elementType: failure.dependency.elementType,
    },
  };
}

function unexpectedIssue(error: unknown): FormIssue {
  return {
    source: "renderer",
    code: "unexpected_render_error",
    path: "/",
    messageKey: "form.renderer.unexpectedRenderError",
    message: error instanceof Error ? `The form could not be rendered: ${error.message}` : "The form could not be rendered.",
  };
}

export class JBFormBuilderWebComponent extends JBBaseComponent implements JBFormBuilderElement {
  static get observedAttributes(): string[] {
    return ["auto-import", "locale"];
  }

  #shell!: RendererShell;
  #stateController!: RenderStateController;
  #document: JBFormDocumentV1 | null = null;
  #assignmentIssues: FormIssue[] = [];
  #autoImport = true;
  #locale: string | null = null;
  #form: RuntimeJBForm | null = null;
  #eventController: FormEventController | null = null;
  #requiredDependencies: readonly RendererDependency[] = [];
  #renderGeneration = 0;
  #updateComplete: Promise<void> = Promise.resolve();

  constructor() {
    super();
    this.initWebComponent();
  }

  private initWebComponent(): void {
    // Keep construction focused on wiring the component-owned shell and state,
    // as in the other JB web components. Rendering, loading, locale work,
    // event forwarding, and form methods remain in their concern modules.
    this.#shell = createRendererShell(this);
    this.#stateController = new RenderStateController(this);
  }

  connectedCallback(): void {
    // Chromium forbids a custom-element constructor from adding attributes to
    // the host. State reflection therefore begins only after connection.
    this.requestRender();
  }

  disconnectedCallback(): void {
    // Incrementing the generation invalidates package/validation promises that
    // may resolve after a framework has already unmounted this instance.
    this.#renderGeneration += 1;
    this.#eventController?.disconnect();
    this.#eventController = null;
    this.#form = null;
  }

  attributeChangedCallback(name: string, oldValue: string | null, newValue: string | null): void {
    if (oldValue === newValue) {
      return;
    }
    if (name === "auto-import") {
      const nextValue = parseBooleanAttribute(newValue, true);
      if (this.#autoImport !== nextValue) {
        this.#autoImport = nextValue;
        this.requestRender();
      }
      return;
    }
    if (name === "locale" && this.#locale !== newValue) {
      this.#locale = newValue?.trim() || null;
      this.requestRender();
    }
  }

  get formDocument(): JBFormDocumentV1 | null {
    if (!this.#document) {
      return null;
    }
    return cloneFormDocument(this.#document).document ?? null;
  }

  set formDocument(value: JBFormDocumentV1 | null) {
    if (value === null) {
      this.#document = null;
      this.#assignmentIssues = [];
      this.requestRender();
      return;
    }
    // Clone synchronously, before the async render starts, so mutation by the
    // caller cannot race validation or dependency discovery.
    const cloned = cloneFormDocument(value);
    this.#document = cloned.document ?? null;
    this.#assignmentIssues = cloned.issues;
    this.requestRender();
  }

  get autoImport(): boolean {
    return this.#autoImport;
  }

  set autoImport(value: boolean) {
    const nextValue = Boolean(value);
    if (this.#autoImport === nextValue) {
      return;
    }
    this.#autoImport = nextValue;
    // This is an enumerated true/false attribute rather than a standard boolean
    // attribute because automatic loading intentionally defaults to true.
    this.setAttribute("auto-import", String(nextValue));
    this.requestRender();
  }

  get locale(): string | null {
    return this.#locale;
  }

  set locale(value: string | null) {
    const nextValue = value?.trim() || null;
    if (this.#locale === nextValue) {
      return;
    }
    this.#locale = nextValue;
    if (nextValue) {
      this.setAttribute("locale", nextValue);
    } else {
      this.removeAttribute("locale");
    }
    this.requestRender();
  }

  get state(): RendererState {
    return this.#stateController.value;
  }

  get form(): RuntimeJBForm | null {
    return this.#form;
  }

  get value(): FormValues {
    return this.getFormValues();
  }

  get updateComplete(): Promise<void> {
    return this.#updateComplete;
  }

  get requiredDependencies(): readonly RendererDependency[] {
    return this.#requiredDependencies;
  }

  getFormValues(): FormValues {
    return getRuntimeFormValues(this.#form);
  }

  setFormValues(values: FormValues): void {
    setRuntimeFormValues(this.#form, values);
  }

  reset(): void {
    resetRuntimeForm(this.#form);
    dispatchRendererEvent(this, "reset", {
      value: this.getFormValues(),
    });
  }

  checkValidity(): boolean {
    return checkRuntimeFormValidity(this.#form, false);
  }

  reportValidity(): boolean {
    return checkRuntimeFormValidity(this.#form, true);
  }

  checkValidityAsync(showError = false): Promise<boolean> {
    return checkRuntimeFormValidityAsync(this.#form, showError);
  }

  retryRender(): Promise<void> {
    this.requestRender();
    return this.#updateComplete;
  }

  private requestRender(): void {
    if (!this.isConnected) {
      return;
    }
    // Every request receives a monotonic token. Only the newest asynchronous
    // validation/import pipeline is allowed to commit DOM.
    const generation = ++this.#renderGeneration;
    this.#updateComplete = this.render(generation);
  }

  private isCurrent(generation: number): boolean {
    return generation === this.#renderGeneration && this.isConnected;
  }

  private setState(state: RendererState, issues: readonly FormIssue[] = [], dependencies: readonly RendererDependency[] = []): void {
    this.#stateController.set(state);
    showRendererState(this.#shell, state, issues, dependencies);
  }

  private clearForm(): void {
    this.#eventController?.disconnect();
    this.#eventController = null;
    this.#form = null;
    clearRenderedForm(this.#shell);
  }

  private async render(generation: number): Promise<void> {
    try {
      this.setState("loading");
      if (this.#assignmentIssues.length > 0) {
        this.clearForm();
        this.setState("invalid", this.#assignmentIssues);
        dispatchRendererEvent(this, "document-invalid", {
          issues: this.#assignmentIssues,
        });
        return;
      }
      if (!this.#document) {
        this.clearForm();
        this.#requiredDependencies = [];
        this.setState("empty");
        return;
      }

      const prepared = await prepareFormDocument(this.#document);
      if (!this.isCurrent(generation)) {
        return;
      }
      if (!prepared.document) {
        this.clearForm();
        this.setState("invalid", prepared.issues);
        dispatchRendererEvent(this, "document-invalid", {
          issues: prepared.issues,
        });
        return;
      }

      const formDocument = prepared.document;
      const dependencies = getRequiredDependencies(formDocument);
      // Expose immutable snapshots rather than the loader's working objects.
      // JavaScript consumers therefore cannot mutate future retry behavior
      // through the public requiredDependencies getter.
      this.#requiredDependencies = Object.freeze(
        dependencies.map(dependency =>
          Object.freeze({
            ...dependency,
            tagNames: Object.freeze([...dependency.tagNames]),
          }),
        ),
      );

      if (!this.#autoImport) {
        // Manual mode fails fast with a deterministic package/tag list. It
        // never invokes the dynamic import loaders on the user's behalf.
        const missing = getMissingDependencies(dependencies);
        if (missing.length > 0) {
          this.clearForm();
          this.setState("waiting-dependencies", [], missing);
          dispatchRendererEvent(this, "dependencies-required", {
            dependencies: missing,
          });
          return;
        }
      }

      // Independent package imports start together inside loadDependencies.
      // Manual mode supplies an empty result and proceeds only after registration.
      const dependencyResult = this.#autoImport ? await loadDependencies(dependencies) : { failures: [], missing: [] };
      if (!this.isCurrent(generation)) {
        return;
      }

      const dependencyIssues = dependencyResult.failures.map(dependencyIssue);
      const formUnavailable = dependencyResult.failures.some(({ dependency }) => dependency.packageName === "jb-form");
      if (formUnavailable) {
        this.clearForm();
        this.setState("error", dependencyIssues);
        dispatchRendererEvent(this, "render-error", {
          documentId: formDocument.id,
          issues: dependencyIssues,
        });
        return;
      }

      const activeLocale = resolveFormLocale(formDocument, this.#locale);
      this.lang = activeLocale.locale;
      this.dir = activeLocale.direction;
      const localeIssues = await configureFormLocale(activeLocale, this.#autoImport);
      if (!this.isCurrent(generation)) {
        return;
      }

      const unavailableTypes = new Set(dependencyResult.failures.flatMap(({ dependency }) => (dependency.elementType ? [dependency.elementType] : [])));
      const runtime = buildRuntimeForm(formDocument, activeLocale.locale, unavailableTypes);
      if (!this.isCurrent(generation)) {
        return;
      }

      // Commit once after every async prerequisite succeeds. The previous form
      // remains intact during loading and loses listeners immediately at swap.
      this.#eventController?.disconnect();
      commitRuntimeForm(this.#shell, runtime);
      this.#form = runtime.form;
      this.#eventController = new FormEventController(this, runtime.form, () => this.getFormValues());
      this.#eventController.connect();

      const issues = [...dependencyIssues, ...localeIssues, ...runtime.issues];
      if (issues.length > 0) {
        this.setState("degraded", issues);
        dispatchRendererEvent(this, "render-error", {
          documentId: formDocument.id,
          issues,
        });
      } else {
        this.setState("ready");
        dispatchRendererEvent(this, "ready", {
          documentId: formDocument.id,
          state: "ready",
          value: this.getFormValues(),
        });
      }
    } catch (error) {
      if (!this.isCurrent(generation)) {
        return;
      }
      const issue = unexpectedIssue(error);
      this.clearForm();
      this.setState("error", [issue]);
      dispatchRendererEvent(this, "render-error", {
        documentId: this.#document?.id,
        issues: [issue],
      });
    }
  }
}
