import type { JBFormDocumentV1 } from "./contract/form-document";
import type { FormIssue } from "./contract/form-issue";
import { JBBaseComponent } from "jb-core";
import { cloneFormDocument, prepareFormDocument } from "./document-controller";
import { getMissingDependencies, getRequiredDependencies } from "./dependency-loader";
import { dispatchRendererEvent, FormEventController } from "./event-controller";
import { checkRuntimeFormValidity, checkRuntimeFormValidityAsync, getRuntimeFormValues, resetRuntimeForm, setRuntimeFormValues } from "./form-facade";
import { clearRenderedForm, createRendererShell, showRendererState } from "./render/renderer-shell";
import { buildRuntimeForm, commitRuntimeForm } from "./render/runtime-form";
import type { RendererShell } from "./render/types";
import { configureFormLocale, resolveFormLocale } from "./locale-controller";
import { RenderStateController } from "./render-state";
import { ConditionController } from "./condition-controller";
import type { DependencyFailure, DependencyLoader, FormValues, JBFormBuilderElement, RendererDependency, RendererState, RuntimeJBForm } from "./types";

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
    return ["locale", "aria-label", "aria-labelledby", "aria-describedby"];
  }

  #shell!: RendererShell;
  #stateController!: RenderStateController;
  #document: JBFormDocumentV1 | null = null;
  #assignmentIssues: FormIssue[] = [];
  #loadDependencies: DependencyLoader | null = null;
  #locale: string | null = null;
  #form: RuntimeJBForm | null = null;
  #eventController: FormEventController | null = null;
  #conditionController: ConditionController | null = null;
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
    this.#conditionController?.disconnect();
    this.#conditionController = null;
    this.#form = null;
  }

  attributeChangedCallback(name: string, oldValue: string | null, newValue: string | null): void {
    if (oldValue === newValue) {
      return;
    }
    if (name === "locale" && this.#locale !== newValue) {
      this.#locale = newValue?.trim() || null;
      this.requestRender();
      return;
    }
    if (name === "aria-label" || name === "aria-labelledby" || name === "aria-describedby") {
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

  get loadDependencies(): DependencyLoader | null {
    return this.#loadDependencies;
  }

  set loadDependencies(value: DependencyLoader | null) {
    const nextValue = typeof value === "function" ? value : null;
    if (this.#loadDependencies === nextValue) {
      return;
    }
    this.#loadDependencies = nextValue;
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
    this.#conditionController?.sync();
  }

  reset(): void {
    resetRuntimeForm(this.#form);
    this.#conditionController?.resetPreservedContent();
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
    this.#conditionController?.disconnect();
    this.#conditionController = null;
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

      // Dependency ownership belongs to the host. It may inject the bundled
      // loader, a CDN/import-map loader, or no loader at all.
      const dependencyResult = this.#loadDependencies
        ? await this.#loadDependencies(dependencies)
        : { failures: [], missing: getMissingDependencies(dependencies) };
      if (!this.isCurrent(generation)) {
        return;
      }
      // A custom loader may return before definitions are registered. Always
      // inspect the platform registry so warnings describe actual page state.
      const missingDependencies = getMissingDependencies(dependencies);

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
      const localeIssues = await configureFormLocale(activeLocale, Boolean(this.#loadDependencies));
      if (!this.isCurrent(generation)) {
        return;
      }

      const unavailableTypes = new Set(
        [...dependencyResult.failures.map(({ dependency }) => dependency), ...missingDependencies].flatMap(dependency =>
          dependency.elementType ? [dependency.elementType] : [],
        ),
      );
      const runtime = buildRuntimeForm(formDocument, activeLocale.locale, unavailableTypes);
      if (!this.isCurrent(generation)) {
        return;
      }

      for (const attribute of ["aria-label", "aria-labelledby", "aria-describedby"] as const) {
        const value = this.getAttribute(attribute);
        if (attribute === "aria-describedby") {
          runtime.form.setAttribute(attribute, ["jb-form-builder-error-summary", value].filter(Boolean).join(" "));
        } else if (value === null) {
          runtime.form.removeAttribute(attribute);
        } else {
          runtime.form.setAttribute(attribute, value);
        }
      }

      // Commit once after every async prerequisite succeeds. The previous form
      // remains intact during loading and loses listeners immediately at swap.
      this.#eventController?.disconnect();
      commitRuntimeForm(this.#shell, runtime);
      this.#form = runtime.form;
      this.#conditionController = new ConditionController(runtime.form);
      this.#conditionController.connect();
      this.#eventController = new FormEventController(this, runtime.form, () => this.getFormValues());
      this.#eventController.connect();

      const issues = [...dependencyIssues, ...localeIssues, ...runtime.issues];
      if (missingDependencies.length > 0) {
        dispatchRendererEvent(this, "dependencies-required", {
          dependencies: missingDependencies,
        });
      }
      if (issues.length > 0 || missingDependencies.length > 0) {
        this.setState("degraded", issues, missingDependencies);
        if (issues.length > 0) {
          dispatchRendererEvent(this, "render-error", {
            documentId: formDocument.id,
            issues,
          });
        }
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
