# JB Form — Technical Foundation

Status: Approved for Phase 1
Phase: 1 — Form Builder and Preview  
Inputs: `PROJECT.md`, `PRODUCT-FLOW.md`, approved `FORM-JSON-CONTRACT.md`, and the component inventory

## Outcome

JB Form will use Astro for static route shells and one client-only React application island per route. Domain, validation, registry, routing, and IndexedDB modules remain framework-independent. Builder uses a route-local MobX store only for state shared across the catalog, canvas, configuration panel, toolbar, or route guards. Component-owned UI state stays in local React state. Preview, Landing, and Designer use local React state unless a future feature introduces genuinely shared state.

No form document is written to IndexedDB while the user edits. Save and Save As are the only persistence commands.

## Repository facts

- The site uses Astro `7`, React `19`, and static GitHub Pages deployment.
- `@astrojs/react` is already configured.
- Existing interactive UI is implemented as React islands.
- MobX, Ajv, Vitest, Testing Library, Happy DOM, and fake-indexeddb are installed. Persistence continues to use native IndexedDB rather than a runtime wrapper.
- Existing application styling uses external CSS/CSS Modules.
- The application now uses `jb-core@0.30.0`, matching the component-inventory baseline.
- `jb-core/i18n` accesses browser globals during construction and exports a global singleton.

Dependencies are added only when implementation reaches their owning step.

## Architecture decisions

| ID | Decision |
| --- | --- |
| ADR-001 | Use Astro static shells with client-only React islands for `/form` routes. |
| ADR-002 | Keep route parsing and navigation in a framework-independent route module. |
| ADR-003 | Use local React state for component-owned state and a route-local MobX store only for shared Builder state; never use a process-global application store. |
| ADR-004 | Use a small native IndexedDB repository rather than adding an IndexedDB wrapper. |
| ADR-005 | Use Ajv 2020 plus format validation for the published JSON Schema, followed by semantic and registry validation. |
| ADR-006 | Use a versioned component-adapter registry as the only mapping between portable elements and JB packages. |
| ADR-007 | Keep `<jb-form-builder>` route- and storage-agnostic; consume it through a thin application adapter. |
| ADR-008 | Use the client-side `jb-core/i18n` singleton with one active locale per route page in Phase 1. |
| ADR-009 | Use external pure CSS/CSS Modules, JB tokens, `rem`, and logical properties; no CSS-in-JS. |
| ADR-010 | Use typed result/error objects at infrastructure boundaries and route-level recoverable states. |

## Target module structure

```text
src/
  pages/
    form/
      index.astro
      builder/index.astro
      designer/index.astro
      preview/index.astro
    404.astro
  features/
    form/
      domain/
        form-document.ts
        form-issues.ts
      application/
        form-route.ts
        form-resolver.ts
        form-save-service.ts
      registry/
        form-element-registry.ts
        adapters/
      validation/
        structural-validator.ts
        semantic-validator.ts
      persistence/
        indexeddb-repository.ts
        records.ts
        migrations/
      i18n/
        form-dictionary.ts
        locale-adapter.ts
      builder/
        BuilderApp.tsx
        BuilderStore.ts
        builder.css
      landing/
        FormLandingApp.tsx
      designer/
        DesignerPlaceholderApp.tsx
      preview/
        PreviewApp.tsx
        preview.css
      renderer/
        jb-form-builder-adapter.ts
        local-test-renderer/
```

The approved schema/type source remains under `_docs/schema/v1` until implementation starts. Step 4 or 5 will move/copy runtime-owned types and schema into `src/features/form/domain` without changing the published contract.

## Route and island boundary

### Static shells

| Route | Island | Rendering |
| --- | --- | --- |
| `/form` | `FormLandingApp` | `client:only="react"` |
| `/form/builder` | `BuilderApp` | `client:only="react"` |
| `/form/designer` | `DesignerPlaceholderApp` | `client:only="react"` |
| `/form/preview` | `PreviewApp` | `client:only="react"` |

Client-only rendering is required because route resolution depends on IndexedDB and `jb-core/i18n` currently touches browser globals during module initialization.

Each route owns its loading, unavailable-storage, incompatible-document, unknown-slug, and ready states. Route islands share application modules but never share in-memory state. Preview must prove this separation by reloading the document from IndexedDB.

Route-level loading/error presentation that is owned only by one route root uses local React state or `useReducer`; it is not automatically promoted to MobX.

### Optional-slug parsing

The shared parser accepts only:

```text
/form
/form/builder
/form/builder/:slug
/form/designer
/form/designer/:slug
/form/preview
/form/preview/:slug
```

Rules:

- ignore one trailing slash;
- decode a slug exactly once;
- validate it against the approved slug expression and length;
- reject extra path segments;
- never read a slug from a query string or hash;
- never fall back from an unknown/invalid slug to the current draft;
- route generation always uses one shared `buildFormUrl(mode, slug?)` function.

The resolver returns:

```ts
type FormRoute =
  | { mode: "landing"; slug: null }
  | { mode: "builder" | "designer" | "preview"; slug: string | null };
```

Navigation to Designer and Preview performs a full document navigation after a successful explicit Save. This guarantees that the destination loads IndexedDB instead of receiving Builder memory.

### GitHub Pages deep-link constraint

Named-form slugs exist only in a user's IndexedDB and cannot be enumerated by Astro at build time. GitHub Pages has no rewrite rule for arbitrary `/form/{mode}/:slug` paths.

Approved simple Phase 1 handling:

- generate normal static shells for the no-slug routes;
- add a form-aware `404.html` shell;
- when the 404 path matches the strict form-route parser, mount the correct route island without changing the URL;
- render the normal not-found page for every other path.

This makes direct slug navigation usable on GitHub Pages, but the initial HTTP response remains `404`. This limitation is accepted for Phase 1 and may be enhanced later. A `200` response for arbitrary slug deep links requires hosting with a rewrite to the form shell.

## State boundaries

### Portable form state

The approved `JBFormDocumentV1` is the only state used by export and `<jb-form-builder>`. It never contains:

- selected element/panel;
- modal state;
- dirty/save status;
- route loading state;
- IndexedDB record metadata;
- Preview response values;
- MobX objects/proxies.

MobX stores a plain document snapshot and produces plain cloned JSON at validation, persistence, renderer, and export boundaries.

### Builder state

One `BuilderStore` instance is created for each Builder island:

```ts
interface BuilderState {
  document: JBFormDocumentV1;
  selectedElementId: string | null;
  linkedRecord: { id: string; slug: string; revision: number } | null;
  status: "loading" | "ready" | "saving" | "save-error";
  isDirty: boolean;
  issues: FormIssue[];
}
```

MobX is justified for the document, selection, linked-record, Save status, and issue state because catalog, canvas, configuration panel, toolbar, validation summary, and route guards observe overlapping values and actions. `makeAutoObservable` is used on the route-local store; domain documents and repository records stay plain.

Local React state owns values that do not cross those boundaries, including:

- whether one disclosure/popover/modal is open;
- temporary input presentation before a valid commit;
- hover and focus presentation;
- an isolated async indicator used by one component;
- Preview response and renderer state;
- Landing and Designer placeholder UI state.

Do not mirror local React state into MobX or duplicate MobX state in React state.

### Preview state

Preview state is not shared with Builder:

```ts
interface PreviewState {
  loadStatus: "loading" | "ready" | "not-found" | "invalid" | "storage-error";
  document: JBFormDocumentV1 | null;
  responseValues: Record<string, unknown>;
  rendererStatus: "empty" | "rendering" | "ready" | "invalid" | "error";
}
```

`PreviewState` is implemented with local React state or `useReducer`, not MobX. Response values are session-only. Preview never writes them into the portable document or IndexedDB.

## Explicit-save model

- Editing mutates only the route-local in-memory Builder store.
- Any edit sets `isDirty`.
- No debounce, idle callback, unload handler, or reactive observer writes IndexedDB.
- Save validates the document before opening a write transaction.
- Saving an unnamed document creates/updates the current-draft record. If the user provides a name/slug, the same transaction also creates a named record.
- Saving a linked named document updates that named record and the current-draft snapshot in one transaction.
- Builder Save As generates a new form ID and slug, preserves copied element IDs, creates a named record, and updates the current-draft snapshot.
- Export/download preserves all document IDs and does not write IndexedDB.
- Designer and Preview navigation is blocked while the current document is dirty. The user must Save successfully or cancel navigation.
- New/load destructive actions keep the approved Save, Continue without saving, or Cancel decision. Continue without saving discards in-memory changes and performs no write.
- Browser unload uses a standard unsaved-changes prompt when `isDirty`; it does not attempt a background save.

## IndexedDB design

Database:

```text
name: jb-form-builder
version: 1
```

### Stores

| Store | Key | Indexes | Purpose |
| --- | --- | --- | --- |
| `forms` | `id` | unique `slug`, non-unique `updatedAt` | Explicitly saved named forms |
| `drafts` | `key` | none | Singleton `current` explicitly saved working snapshot |
| `recovery` | auto-increment | non-unique `sourceId`, `createdAt` | Pre-migration/corrupt-record recovery copies |
| `meta` | `key` | none | Database/builder migration metadata |

### Record envelopes

```ts
interface StoredFormRecordV1 {
  recordVersion: 1;
  builderVersion: string;
  id: string;
  slug: string;
  revision: number;
  createdAt: string;
  updatedAt: string;
  document: JBFormDocumentV1;
}

interface CurrentDraftRecordV1 {
  key: "current";
  recordVersion: 1;
  builderVersion: string;
  linkedFormId: string | null;
  linkedSlug: string | null;
  linkedRevision: number | null;
  updatedAt: string;
  document: JBFormDocumentV1;
}
```

Invariants:

- projections (`id`, `slug`, schema version) match the contained document;
- only one current-draft record exists;
- `forms.slug` enforces collision safety;
- record and document migrations are separate, sequential functions;
- source records are copied to `recovery` before a destructive migration;
- unsupported newer versions remain untouched and open read-only/recovery UI;
- writes use one transaction and report `AbortError`, quota, validation, and slug collision separately;
- `revision` increments on named Save and detects stale multi-tab updates.

The repository exposes typed commands rather than leaking `IDBRequest`:

```ts
interface FormRepository {
  open(): Promise<Result<void, StorageIssue>>;
  getCurrentDraft(): Promise<Result<CurrentDraftRecordV1 | null, StorageIssue>>;
  getBySlug(slug: string): Promise<Result<StoredFormRecordV1 | null, StorageIssue>>;
  listNamedForms(): Promise<Result<StoredFormRecordV1[], StorageIssue>>;
  save(command: SaveFormCommand): Promise<Result<SavedFormResult, StorageIssue>>;
}
```

IndexedDB implementation status:

- `FormDatabase` owns the memoized native connection, version-change closure, and sequential database migration entry point;
- migration v1 creates `forms`, `drafts`, `recovery`, and `meta` with the approved keys and indexes;
- `IndexedDbFormRepository` exposes typed draft, slug lookup, list, and save commands without leaking `IDBRequest`;
- named form and current draft writes share one read-write transaction;
- unique slug checks and optimistic `revision` checks distinguish collisions from stale multi-tab saves;
- Save As creates a new form ID while preserving element IDs;
- JSON Schema/Ajv is dynamically imported only when an existing record or Save needs validation, keeping it out of the empty Builder startup path;
- record envelopes, projection consistency, semantic rules, registry adapters, corrupt data, newer record versions, quota, abort, and unavailable storage return typed failures;
- Builder writes only from explicit Save/Save As, restores current or slug-selected records, and retains edits made while a transaction is in flight;
- Landing, Designer, and Preview resolve storage independently, and the form-aware `404.html` shell preserves arbitrary strict slug URLs on GitHub Pages.

## Validation pipeline

Every load, Save, Preview render, and export runs:

1. JSON parsing where input is text.
2. JSON Schema 2020-12 validation with Ajv.
3. Format validation for UUID and date-time.
4. Semantic validation:
   - unique form and element IDs;
   - non-empty valid element names;
   - repeated names allowed;
   - declared default/translation locales;
   - slug/document/storage consistency;
   - regex compilation and flag validation.
5. Component-registry validation.
6. Renderer preflight where applicable.

Ajv is preferred to a handwritten schema validator because the approved contract is recursive and versioned. The schema is compiled once per application bundle, not per edit.

All layers return stable issues:

```ts
interface FormIssue {
  source: "schema" | "semantic" | "registry" | "storage" | "renderer";
  code: string;
  path: string;
  messageKey: string;
  message: string;
  elementId?: string;
  details?: Record<string, unknown>;
}
```

User messages are resolved through i18n. Logs and tests assert stable `code`/`path`, not localized text.

## Component registry

The registry is the only place that knows a JB component package, tag/wrapper, icon, defaults, editable properties, or runtime mapping.

```ts
interface FormElementAdapter<TProps extends Record<string, JSONValue>> {
  type: JBFormElementType;
  adapterVersion: 1;
  category: FormElementCategory;
  displayNameKey: FormDictionaryKey;
  icon: JBIconKey;
  nameBase: string;
  commonFields: Readonly<{
    required: boolean;
    disabled: boolean;
    initialValue: boolean;
    label: boolean;
    placeholder: boolean;
  }>;
  propertyDefinitions: readonly PropertyDefinition[];
  validationRules: readonly JBValidationRule["rule"][];
  createDefault(context: CreateElementContext): JBFormElementV1;
  validate(element: JBFormElementV1): FormIssue[];
  loadComponent(): Promise<void>;
  applyToRuntime(element: JBFormElementV1, target: HTMLElement): void;
}
```

Registry rules:

- Add generates a valid non-empty name from `nameBase`.
- Duplicate creates a new element ID and preserves the source name.
- Repeated names remain valid.
- Common fields stay outside `props`; adapters reject unsupported common fields.
- Unknown props and unsupported validation rules are rejected.
- Package imports are lazy by element type so unused catalog packages do not enter the initial route chunk.
- Catalog and canvas consume the same `displayNameKey` and `icon`.
- Prefer suitable existing JB icon assets.
- If no suitable asset exists, design a repository-owned SVG with a `24 × 24` view box, `currentColor`, and consistent stroke/fill geometry.
- Keep every icon mapping in the registry. Do not use emoji, Unicode text symbols, third-party icon packages, or CSS-drawn icons.

Registry implementation status:

- all 16 entries now declare common-field support, initial-value kind, JSON-safe default props, and editable property metadata;
- property definitions drive shared configuration controls, including localized props and declarative select options;
- add and duplicate deep-clone JSON-safe defaults/configuration so elements never share mutable prop objects;
- all 16 adapters declare package, tag, adapter/form schema versions, value type, events, supported validation rules, and one literal dynamic package loader;
- adapters reject unsupported common fields, unknown props, invalid option structures, incompatible validation, and invalid portable values with stable registry issues;
- serialization/deserialization use lossless structured clones and runtime application resolves localized properties and declarative `jb-option` children;
- user validation remains function-free JSON (`minLength`, `maxLength`, `pattern`, `minValue`, `maxValue`, and `allowedValues`) and is compiled into trusted `jb-validation` entries only at runtime;
- optional empty fields pass custom rules; the component's built-in `required` behavior exclusively owns missing-value errors;
- component-iterated adapter tests and the production build pass; per-component rendered Preview checks remain in Step 9.

## Renderer boundary

Preview imports one adapter module, not the local or published renderer directly:

```ts
interface FormRendererElement extends HTMLElement {
  formDocument: JBFormDocument | null;
  loadDependencies: DependencyLoader | null;
  locale: string | null;
  readonly state:
    | "empty"
    | "loading"
    | "ready"
    | "invalid"
    | "degraded"
    | "error";
  readonly form: RuntimeJBForm | null;
  readonly value: Record<string, unknown>;
  readonly updateComplete: Promise<void>;
  readonly requiredDependencies: readonly RendererDependency[];
  reset(): void;
  getFormValues(): Record<string, unknown>;
  setFormValues(value: Record<string, unknown>): void;
  checkValidity(): boolean;
  reportValidity(): boolean;
  checkValidityAsync(showError?: boolean): Promise<boolean>;
  retryRender(): Promise<void>;
}
```

The adapter:

- currently loads the application renderer during development/integration;
- will load the published `jb-form-builder` package in the final delivery step;
- assigns the validated document as a JavaScript property;
- forwards typed renderer events;
- contains no route or IndexedDB logic.

The renderer is implemented as the local `packages/jb-form-builder` package. The main custom-element class coordinates dedicated document, dependency, locale, element-rendering, form-rendering, event, facade, state, type, and styling modules. It has no IndexedDB or route dependency.

Dependency loading is host-controlled. Preview explicitly supplies the bundled
lazy loader, which imports `jb-form` plus only the unique component packages
used by the assigned document and memoizes loads across instances. Without a
loader, the renderer performs no package loading or global i18n configuration;
it builds a degraded form, reports undefined tags through
`requiredDependencies` and `dependencies-required`, and lets the consumer
register them before calling `retryRender()`.

The React wrapper is a separate entry. It assigns the document as an object property, forwards the underlying element ref, installs one stable listener set with current callback refs, and adds no renderer state mirror.

Current Phase 1 usage is client-only. Browser-specific work remains behind registration, render, dependency, and locale modules; the default definition is guarded and a Node-environment import test passes. This preparation does not make the current JB packages SSR-compatible: direct Node imports of representative installed packages still throw on `HTMLElement` or `document`. Exact required design-system changes and acceptance tests are documented beside the component in `JB-DESIGN-SYSTEM-CHANGES.md`.

## Locale and direction

Phase 1 defaults to English/LTR and supports Persian/RTL. Locale bootstrapping sets `lang`, `dir`, and `i18n.setLocale(...)` before rendering localized JB controls.

The approved data model separates:

- editor locale: application preference, not portable;
- form default locale/direction: portable document configuration.

All Phase 1 form applications are client-only. Each route configures one active `jb-core/i18n` locale after the browser document exists:

- Builder uses its active editor locale.
- Preview uses the loaded form's default locale and direction.
- Designer uses the active application locale for its placeholder.

Simultaneous independently scoped locales inside one route are not required in Phase 1. The JSON structure remains multilingual-ready for Phase 2. DSR-006 is closed and may be reconsidered only if multilingual authoring later requires simultaneous JB component subtrees with different locales.

## Styling

- Use CSS Modules for React route UI and external component CSS where shadow-DOM styling is required.
- Do not use inline style objects for authored design values or any CSS-in-JS library.
- Use JB design tokens and exposed parts before adding feature tokens.
- Define application-owned color tokens with OKLCH values.
- Apply `corner-shape: squircle` to app-owned rounded surfaces and keep `border-radius` as the progressive-enhancement fallback.
- Use documented `::part` selectors for JB control corner geometry; do not introduce a shared corner-shape variable or pierce private Shadow DOM.
- Use `rem` for authored size, spacing, and typography values.
- Use logical properties (`margin-inline`, `padding-block`, `inset-inline`, etc.).
- Use `dir` selectors only where logical properties cannot express behavior.
- Preview is fluid from narrow mobile to desktop and must not horizontally scroll.
- Builder editing is supported from `320px` through `1023px` CSS width. The mobile baseline is `375px`, the large-phone baseline is `412px`, the tablet baseline is `768px`, and `64rem` (`1024px`) remains the desktop breakpoint. Viewports below `320px` are outside the support target.
- Mobile verification covers the latest two stable Chrome Android releases, the latest two supported Safari iOS major versions, and the latest two stable Firefox Android releases. Representative profiles are 320px-, 375px-, 412px-, and 768px-class touch viewports; browser engine, CSS viewport, pixel ratio, and touch capability matter more than device branding.
- Coarse pointers use explicit `2.75rem` Move up/down actions for ordering; native HTML drag-and-drop and its handle are fine-pointer enhancements only.
- Mobile Add returns to the canvas and Configure switches to Properties before focusing its first control. These panel changes are editor-only state and never enter the form document or undo history.

## Performance and memoization

Reference workload: a valid 100-element form on the agreed reference browser/device.

Budgets:

- an add, select, configuration commit, reorder, duplicate, or remove action provides visible feedback within `100 ms`;
- current-draft restore and deterministic export complete within `1 second`;
- Preview loads IndexedDB, validates the document, and reaches renderer-ready within `1.5 seconds`;
- normal element editing does not rerender the entire catalog, every canvas card, or unrelated configuration controls.

Implementation rules:

- Use stable element UUIDs as React keys; never use array indexes.
- Wrap canvas cards and registry catalog rows at the smallest useful subscription boundary.
- Use `observer` for components that read shared MobX observables; do not make the whole Builder island one broad observer.
- Keep component-owned state local so a hover, disclosure, or temporary field value cannot invalidate shared observers.
- Use `React.memo`, `useMemo`, and `useCallback` only where stable inputs and profiling show avoided work; do not blanket-memoize trivial components.
- Prefer MobX `computed` values for shared derived data and avoid storing duplicate derived arrays/maps.
- Compile the Ajv schema once per bundle and cache registry metadata.
- Run targeted element/field validation during editing; run the full validation pipeline only for load, Save, Preview, and export.
- Lazy-load JB component packages by adapter/type.
- Do not virtualize the 100-element canvas by default because it can complicate keyboard order and accessibility; introduce windowing only if profiling proves it necessary and acceptance tests cover focus/order.
- Do not clone/serialize the entire portable document on every keystroke. Produce plain snapshots only at validation, Save, renderer, and export boundaries.
- Clean up event listeners, MobX reactions, observers, and renderer subscriptions on unmount.

Measurement:

- add `performance.mark`/`performance.measure` around restore, Save validation, export, and Preview readiness;
- use React Profiler or render-count instrumentation in development tests;
- add a generated 100-element fixture and enforce the budgets in the Phase 1 hardening suite;
- record the reference environment with test results so later comparisons remain meaningful.

## Errors and recovery

| Failure | Route behavior |
| --- | --- |
| IndexedDB unavailable | Builder may edit in memory and export; Save and separate-page Preview are unavailable with explanation |
| Unknown slug | Show not-found; never substitute the current draft |
| Corrupt record | Preserve/copy record, show recovery/export options, do not rewrite silently |
| Unsupported schema/adapter | Read-only recovery/export when possible |
| Quota/write failure | Keep in-memory work, remain dirty, offer Retry and Export |
| Slug collision | Keep modal values and request another slug |
| Stale revision | Stop overwrite; offer Reload or Save As |
| Registry validation | Link issue to element/configuration field |
| Renderer failure | Show document/element error detail and Back/Retry actions |

React route error boundaries catch unexpected UI exceptions. Domain and infrastructure failures use typed results and expected recovery UI; they are not thrown into React error boundaries.

## Test strategy

### Unit

- route parsing/building and invalid path rejection;
- slug/name normalization;
- form-document semantic validation;
- regex compilation;
- registry defaults and prop/rule validation;
- Save/Save As ID behavior;
- migrations and deterministic export;
- shared MobX Builder actions without UI;
- local-state components do not create or mutate the shared store;
- memoized/observed rows do not rerender when unrelated elements change.

### Persistence integration

- use `fake-indexeddb`;
- database creation, indexes, transactions, revision conflicts, and migration recovery;
- prove edits do not write until Save;
- prove named Save and current-draft update are atomic;
- refresh/browser-restart restoration from the last explicit Save.

### Component integration

- React Testing Library for shell state and keyboard interactions;
- real-browser tests for JB web components, form association, focus, and shadow-DOM behavior;
- every registry adapter runs the shared support-matrix contract;
- local renderer runs the same integration contract that will be published in the final delivery step.

### Accessibility

- automated axe checks for landing, Builder states, modal flows, Designer placeholder, and Preview;
- keyboard-only add/select/reorder/remove/save/navigation journeys;
- focus restoration after modal/remove operations;
- English/LTR and Persian/RTL DOM/visual order;
- native and `jb-validation` error announcement.

### End to end

- Playwright against the built static site;
- no-slug and slug route resolution;
- explicit Save before Preview/Designer;
- repeated phone names producing array values;
- IndexedDB persistence across reload and separate Preview navigation;
- direct GitHub Pages-style 404 fallback routing;
- JSON export/schema fixture verification;
- narrow and desktop responsive Preview.

Implementation dependencies:

- runtime: `mobx`, `mobx-react-lite`, `ajv`, `ajv-formats`;
- tests: `vitest`, `fake-indexeddb`, React Testing Library, Playwright, and axe integration.

The implementation step adds scripts for unit tests, type checking, linting, build, and end-to-end tests to CI.

## Entry criteria for Builder shell

Builder shell implementation may begin when:

- this approved architecture is reflected in implementation;
- the simple form-aware GitHub Pages fallback is kept isolated for later enhancement;
- all 16 catalog entries receive a suitable existing or locally designed icon;
- DSR-001 through DSR-004 are resolved and remain covered by integration tests;

## Owner approval

Approved:

- local React state, shared route-local MobX state, native IndexedDB, Ajv, and external CSS Modules;
- the simple form-aware GitHub Pages `404.html` fallback for Phase 1;
- sourcing or locally designing proper catalog icons during implementation;
- client-only `jb-core/i18n` with one active locale per route page;
- deferring any enhanced deep-link hosting or scoped-locale work until it is actually needed.
