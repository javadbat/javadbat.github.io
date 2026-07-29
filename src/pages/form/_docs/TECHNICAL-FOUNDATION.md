# JB Form — Technical Foundation

Status: Proposed architecture; owner review required  
Phase: 1 — Form Builder and Preview  
Inputs: `PROJECT.md`, `PRODUCT-FLOW.md`, approved `FORM-JSON-CONTRACT.md`, component inventory, and DSR-005

## Outcome

JB Form will use Astro for static route shells and one client-only React application island per route. Domain, validation, registry, routing, and IndexedDB modules remain framework-independent. Builder uses a route-local MobX store because selection, configuration, validation, explicit persistence, and navigation state are shared across several panels. Preview owns only load/render/runtime-response state.

No form document is written to IndexedDB while the user edits. Save and Save As are the only persistence commands.

## Repository facts

- The site uses Astro `7`, React `19`, and static GitHub Pages deployment.
- `@astrojs/react` is already configured.
- Existing interactive UI is implemented as React islands.
- Tailwind, MobX, IndexedDB helpers, JSON Schema validators, and test frameworks are not currently installed.
- Existing application styling uses external CSS/CSS Modules.
- The application now uses `jb-core@0.30.0`, matching the component-inventory baseline.
- `jb-core/i18n` accesses browser globals during construction and exports a global singleton.

Dependencies are added only when implementation reaches their owning step.

## Architecture decisions

| ID | Decision |
| --- | --- |
| ADR-001 | Use Astro static shells with client-only React islands for `/form` routes. |
| ADR-002 | Keep route parsing and navigation in a framework-independent route module. |
| ADR-003 | Use a route-local MobX Builder store; do not use a process-global application store. |
| ADR-004 | Use a small native IndexedDB repository rather than adding an IndexedDB wrapper. |
| ADR-005 | Use Ajv 2020 plus format validation for the published JSON Schema, followed by semantic and registry validation. |
| ADR-006 | Use a versioned component-adapter registry as the only mapping between portable elements and JB packages. |
| ADR-007 | Keep `<jb-form-builder>` route- and storage-agnostic; consume it through a thin application adapter. |
| ADR-008 | Use `jb-core/i18n`; independent editor/form locales require the scoped-context upgrade in DSR-006. |
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

Recommended Phase 1 handling:

- generate normal static shells for the no-slug routes;
- add a form-aware `404.html` shell;
- when the 404 path matches the strict form-route parser, mount the correct route island without changing the URL;
- render the normal not-found page for every other path.

This makes direct slug navigation usable on GitHub Pages, but the initial HTTP response remains `404`. A `200` response for arbitrary slug deep links requires hosting with a rewrite to the form shell.

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
  activeModal: "form-management" | "remove-confirmation" | null;
}
```

MobX is justified because catalog, canvas, configuration panel, toolbar, validation summary, management modal, and route guards all observe overlapping state and async actions. `makeAutoObservable` is used on the route-local store; domain documents and repository records stay plain.

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

Response values are session-only. Preview never writes them into the portable document or IndexedDB.

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
- Exact icon keys must come from the approved JB icon source. Missing icons trigger a detailed owner/design-system request; no emoji, third-party icon, handwritten SVG, or CSS substitute is allowed.

## Renderer boundary

Preview imports one adapter module, not the local or published renderer directly:

```ts
interface FormRendererElement extends HTMLElement {
  formDocument: JBFormDocument | null;
  readonly form: HTMLFormElement | null;
  readonly value: Record<string, unknown>;
  reset(): void;
  getFormValues(): Record<string, unknown>;
  checkValidity(): boolean;
  reportValidity(): boolean;
}
```

The adapter:

- loads the published `jb-form-builder` package in production;
- may load the isolated local test implementation during development/integration;
- assigns the validated document as a JavaScript property;
- forwards typed renderer events;
- contains no route or IndexedDB logic.

DSR-005 defines the final events, states, parts, accessibility behavior, and package acceptance. Publication remains a Phase 1 release blocker.

## Locale and direction

Phase 1 defaults to English/LTR and supports Persian/RTL. Locale bootstrapping sets `lang`, `dir`, and `i18n.setLocale(...)` before rendering localized JB controls.

The approved data model separates:

- editor locale: application preference, not portable;
- form default locale/direction: portable document configuration.

`jb-core@0.30.0` cannot currently scope these contexts to different subtrees. DSR-006 requests:

- scoped web-component and React i18n providers;
- global singleton fallback;
- SSR-safe imports;
- disposal/listener cleanup;
- independent English/LTR and Persian/RTL subtrees.

Until DSR-006 is implemented, independent editor/form locales in the same Builder page are blocked. The application will not create a private competing i18n system or silently force the two approved concepts to be the same.

## Styling

- Use CSS Modules for React route UI and external component CSS where shadow-DOM styling is required.
- Do not use inline style objects for authored design values or any CSS-in-JS library.
- Use JB design tokens and exposed parts before adding feature tokens.
- Use `rem` for authored size, spacing, and typography values.
- Use logical properties (`margin-inline`, `padding-block`, `inset-inline`, etc.).
- Use `dir` selectors only where logical properties cannot express behavior.
- Preview is fluid from narrow mobile to desktop and must not horizontally scroll.
- Builder editing begins at the approved `64rem` viewport; smaller viewports show the desktop-editing notice and retain Preview navigation.
- Tailwind is not introduced because the repository already uses external CSS/CSS Modules and no Tailwind dependency exists.

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
- MobX Builder actions without UI.

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
- local renderer runs the same contract expected from published DSR-005.

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

Proposed implementation dependencies:

- runtime: `mobx`, `mobx-react-lite`, `ajv`, `ajv-formats`;
- tests: `vitest`, `fake-indexeddb`, React Testing Library, Playwright, and axe integration.

The implementation step adds scripts for unit tests, type checking, linting, build, and end-to-end tests to CI.

## Entry criteria for Builder shell

Builder shell implementation may begin when:

- this architecture is approved;
- the GitHub Pages slug fallback behavior is accepted or hosting rewrite support is chosen;
- exact approved JB icon keys are available for the 16 catalog entries;
- DSR-006 has an agreed upgrade path (it may be implemented in parallel, but independent locale acceptance remains blocked);
- DSR-001 and DSR-004 remain tracked for their affected integrations;
- DSR-005 local test exception remains isolated and replaceable.

## Owner checkpoint

1. Approve route-local MobX, native IndexedDB, Ajv, and external CSS Modules.
2. Accept the GitHub Pages form-aware `404.html` fallback, including its HTTP 404 status, or move the form routes to hosting with rewrite support.
3. Provide/approve the exact JB icon package and icon keys for all 16 catalog entries; if the package is missing, add it to the design system.
4. Upgrade `jb-core/i18n` and JB component standards per DSR-006 so editor and form locales can be scoped independently.
