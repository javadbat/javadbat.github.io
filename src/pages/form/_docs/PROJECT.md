# JB Form — Route-Family Project Description

Status: Phase 1 accepted; Phase 2 in progress
Route namespace: `/form`  
Design system: [JB Design System](https://javadbat.github.io/design-system/?path=/docs/getting-started-introduction--docs)

## Product summary

JB Form is a local-first route family for building, designing, and previewing forms composed from JB Design System elements.

The route family contains:

- **Builder** — create and configure form structure.
- **Designer** — an empty Phase 1 destination that becomes the Theme Designer in Phase 3.
- **Preview** — load stored form JSON and render a responsive runtime form.

The project has two gated phases:

1. **Form Builder and Preview** — build/configure forms, persist them in IndexedDB, export JSON, and render them on the responsive Preview route.
2. **Theme Builder** — define the theme contract, theme data, token mapping, component styling hooks, and theme operations. Preview is already responsive in Phase 1.
3. **Designer** — implement the Theme Designer and its Designer workflow after the Theme Builder phase.

## Route family

| Surface | Current draft | Named form |
| --- | --- | --- |
| Builder | `/form/builder` | `/form/builder/:slug` |
| Designer | `/form/designer` | `/form/designer/:slug` |
| Preview | `/form/preview` | `/form/preview/:slug` |

The slug is optional. A slug route loads that named form from IndexedDB by default; a no-slug route loads the current working draft.

`/form` is a landing page for creating a form, continuing the current draft, and opening named forms in Builder, Designer, or Preview.

## Product goals

- Support every approved JB Design System form element.
- Make form structure and configuration understandable without code.
- Require a valid `name` attribute on every generated form element.
- Preserve current work and named forms locally in IndexedDB.
- Export complete, portable, versioned JSON.
- Render stored JSON through `<jb-form-builder>` on a separate responsive Preview route.
- Keep portable form data separate from editor state and Preview response values.
- Use `jb-core/i18n` for locale configuration and translation.
- Default new forms and Builder UI to English/LTR.
- Support Persian/RTL in Phase 1.
- Keep the Phase 1 document localization-ready for Phase 2 multilingual authoring.
- Provide a Designer navigation path tied to the current form even while Designer is intentionally empty.
- Use proper JB icons for catalog and element-list identification.

## Non-goals for Phase 1

- Theme editing inside Designer.
- Embedded Preview inside Builder.
- JSON import.
- Undo/redo history.
- Editing multiple locale variants.
- Mobile/touch Builder editing.
- Cloud storage, accounts, sharing, or collaboration.
- Publishing or hosting generated forms.
- Generating application source code.
- Submitting Preview responses to a backend.
- Supporting generated-form elements outside the JB Design System.

## Intended journey

1. Open Builder with or without a slug.
2. Resolve the named form or current draft from IndexedDB.
3. Continue editing or create an English/LTR form.
4. Browse the icon-supported catalog.
5. Add elements with generated names.
6. Configure, reorder, duplicate, or remove elements.
7. Explicitly save the current draft or linked named form.
8. Open Designer for the same form and see the Phase 3 placeholder.
9. Open Preview for the same form.
10. Preview reloads JSON from IndexedDB and passes it to `<jb-form-builder>`.
11. Interact with the responsive rendered form.
12. Return to Builder or export JSON.

## Functional requirements

### Form document

- A form has stable identity, metadata, optional slug association, default locale, and direction.
- English (`en`) and LTR are defaults.
- A form contains an ordered single-column element collection.
- Every element has a stable ID, JB component type, non-empty `name`, common fields, and component-specific configuration.
- Duplicate produces a new element ID and preserves the name by default.
- Missing or invalid names block Preview and export.
- Duplicate names are valid and do not block Save. `jb-form` collects controls sharing a name as an array, enabling repeated values such as phone-number lists.
- Fields are optional by default; `required` is enabled only when configured.
- Localizable metadata and element content can add locale variants in Phase 2 without replacing form or element identity.
- Validation rules are portable declarative data based on `jb-validation`.
- The document has an explicit schema version.
- Theme data has a reserved Phase 2 boundary.

### Component registry

Each supported element defines:

- component identifier and tag;
- display name and category;
- semantic JB icon;
- valid default configuration including `name`;
- editable properties;
- configuration validation;
- runtime render behavior;
- JSON serialization/deserialization.

If the JB icon set lacks an appropriate icon, design a repository-owned catalog SVG using the shared icon standard and register it centrally.

### Editing

- Add, select, configure, reorder, duplicate, and remove elements.
- Canvas renders elements as non-interactive editor objects.
- Runtime form interaction occurs only on Preview.
- Warn and recover safely from invalid stored data.
- Builder remains desktop-first in Phase 1.

### Designer

- Builder contains a Designer button for the current form.
- Designer is a separate route and independently resolves JSON/form identity from IndexedDB.
- Phase 1 Designer is an intentional empty placeholder.
- Designer does not mutate JSON until its Phase 3 implementation.

### Preview

- Builder contains a Preview button; it navigates to a separate route.
- Preview independently loads current-draft or slug-selected JSON from IndexedDB.
- Preview validates/migrates the record before rendering.
- Preview passes portable JSON to `<jb-form-builder>`.
- `<jb-form-builder>` renders the ordered JB form controls, values, locale, direction, and declarative validation.
- Preview response values are runtime-only and are never written into the form definition.
- Preview is responsive from narrow mobile through wide desktop viewports.
- Phase 2 Builder editing targets `320px`–`1023px` CSS widths, with 320px, 375px, 412px, and 768px representative touch baselines; the desktop editing breakpoint remains `1024px`.
- Form submission validates locally and does not call a backend.
- The first implementation of `<jb-form-builder>` is application-local for testing.
- The renderer is application-local during implementation and verification; publishing and integrating the JB Design System package is the final delivery step.

### Local persistence

- IndexedDB stores the current draft and named forms.
- IndexedDB writes occur only when the user explicitly presses Save or Save As.
- Named forms change only through explicit Save or Save As.
- Every record includes ID, name, slug where applicable, document schema version, builder version, timestamps, and form JSON.
- Builder requires a successful explicit Save before navigating changed work to Designer or Preview.
- Changed linked named forms require explicit Save before Designer or Preview navigation and then use the slug route.
- A destination route must not render stale JSON after a failed Save.
- Slug resolution, indexes, migration, retention, and recovery are defined before implementation.

### Export

- Export validates the current document.
- Export includes all portable configuration and excludes editor/Preview state.
- Output is deterministic, readable, and versioned.
- Invalid/missing element names block export.
- Export stays available as recovery when IndexedDB fails.
- JSON import remains Phase 2.

## Locale and direction

- `jb-core/i18n` is the required locale module for Builder/Designer/Preview chrome and configuration.
- Default Builder locale is English and default Builder direction is LTR.
- Default form locale is English and default form direction is LTR.
- Builder locale is editor-only state.
- Form locale/direction are portable document state.
- Persian/RTL is supported in Phase 1.
- Locale schema remains ready for multilingual values in Phase 2.

## Styling requirements

- Use CSS Modules for React application layout and component styling.
- Use external pure CSS where Shadow DOM or design-system integration requires it.
- Do not use CSS-in-JS or runtime-generated styling.
- Define application color tokens in OKLCH.
- Use `corner-shape: squircle` on app-owned rounded surfaces while retaining `border-radius` fallback geometry.
- Style JB controls through their documented `::part` selectors when component-owned geometry needs the app's corner shape; do not introduce a shared corner-shape variable or patch private Shadow DOM.
- Use `rem` for authored sizes, spacing, typography, and breakpoints.
- Use CSS logical properties for LTR/RTL.
- Consume JB theme tokens and component styling hooks.
- Prefer existing JB icons; otherwise use consistent repository-owned SVG catalog icons. Do not use emoji, Unicode symbols, third-party icon packages, or CSS drawings.

## State-management constraint

- Use local React state (`useState` or `useReducer`) when state is owned by one component or one tightly contained subtree.
- Use MobX only when the same state is shared across independent Builder regions or cross-cutting actions.
- Keep ephemeral UI state local rather than adding it to MobX.
- Portable form state, route/storage state, editor-only state, and Preview response state remain separate.

## JB Design System dependency policy

- JB Design System is the source of truth for components, behavior, i18n, and UI standards; its icon assets are preferred when suitable.
- If a required JB feature is missing, stop the affected work and ask the owner for an upgrade with the limitation, requested API/behavior, and usage example.
- If a required component does not exist, ask the owner to add it with responsibilities, API, states, accessibility, styling, and usage details. Missing catalog icons may be designed locally.
- Do not create a local component substitute, fork, or hidden workaround without explicit approval. Repository-owned catalog SVGs are explicitly approved.

## Quality requirements

- Keyboard and predictable focus behavior cover core Builder flows.
- Builder supports the latest two stable Chrome, Edge, and Firefox releases and latest stable Safari.
- Builder editing supports desktop widths from the approved minimum.
- Preview is responsive and touch-usable in Phase 1.
- Each client-only route configures its active English/LTR or Persian/RTL locale through `jb-core/i18n`; simultaneous scoped locales on one page are not required in Phase 1.
- Invalid configuration is explained near its control and in a summary.
- Save, route-loading, renderer, and export failures are visible and recoverable.
- Performance baseline: 100 elements, editing feedback within 100 ms, restore/export within 1 second on the reference environment.
- Preview loads, validates, and reaches renderer-ready within 1.5 seconds for 100 elements on the reference environment.
- React and MobX subscriptions are scoped so an element edit does not rerender the entire catalog, canvas, or unrelated configuration controls.
- Routes build as part of the existing Astro application.

## Architecture boundaries

- **Form document:** portable serializable JSON.
- **Component registry:** defaults, names, icons, configuration metadata, validation, rendering, serialization.
- **Builder state:** selection, panels, invalid intermediate values, draft/named status.
- **Route resolver:** optional slug and IndexedDB record resolution.
- **Persistence adapter:** IndexedDB initialization, indexes, migrations, and recovery.
- **Export adapter:** validation and JSON download.
- **`<jb-form-builder>`:** JSON-to-runtime-form renderer; no route or IndexedDB responsibility.
- **Renderer delivery:** the application renderer remains in use through Phase 2; the published package replaces it at the owner-approved final delivery step.
- **Preview state:** runtime response values and validation display state.
- **i18n adapter:** `jb-core/i18n` configuration for UI and form runtime.
- **Theme contract:** reserved Phase 2 boundary.

## Phase boundary

Phase 1 completes when Builder supports the approved inventory, drafts and named forms persist reliably, Designer placeholder navigation preserves form identity, responsive Preview independently renders stored JSON through `<jb-form-builder>`, export is validated, and acceptance tests pass.

Phase 2 implements the Theme Builder contract and theme operations without changing existing form/element identity or route meaning. Phase 3 implements Designer.

## Confirmed decisions

- Route namespace is `/form`.
- `/form` has a landing page.
- Builder, Designer, and Preview are separate subroutes with optional slug.
- Slug routes load the named form; no-slug routes load the current draft.
- Designer is empty in Phase 1.
- Preview is not embedded in Builder.
- Preview loads JSON from IndexedDB and renders through `<jb-form-builder>`.
- Preview is responsive in Phase 1.
- Every generated form element has a non-empty valid name; repeated names are supported intentionally.
- English/LTR is the default.
- Locale work uses `jb-core/i18n`.
- CSS Modules and external pure CSS are used; CSS-in-JS is prohibited.
- Authored styling uses `rem`.
- Catalog and element lists use proper icons.
- Local component state uses React; shared Builder state uses MobX.
- A local `<jb-form-builder>` is used during implementation; the final delivery publishes and integrates the JB Design System package.
- Changed linked forms must be explicitly saved before Designer or Preview navigation.
- The interaction defaults in `PRODUCT-FLOW.md` are approved.
- Current drafts and named forms persist only through explicit Save or Save As.
- Phase 3 includes Designer implementation. Other scheduled workflow enhancements remain independently sequenced after their contracts are approved.

## Open decisions

No blocking product or architecture decisions remain. DSR-001 through DSR-004 are resolved, DSR-006 is closed for the client-only Phase 1 route model, and renderer publication is deferred by owner until the final delivery step.

## Documentation rule

Durable product decisions belong here. Form serialization decisions belong in `FORM-JSON-CONTRACT.md`; technical decisions belong in `TECHNICAL-FOUNDATION.md`; interaction detail belongs in `PRODUCT-FLOW.md`; Phase 2 theme surfaces belong in `THEME-INVENTORY.md` and `THEME-BEHAVIOR.md`; execution status belongs in `PLAN.md`.
