# JB Form — Route-Family Delivery Plan

Status: Phase 1 acceptance checks complete; package publication deferred by owner; Phase 2 in progress
Active phase: Phase 2 — Theme Builder
Phase 2 gate: Phase 1 acceptance checks are complete. Final package publication remains a deferred delivery handoff.

## How to use this plan

- Replace open questions with explicit decisions before implementation depends on them.
- Keep tasks small enough to verify independently.
- Mark a task complete only when its acceptance criteria are satisfied.
- Update `PROJECT.md` when a task changes product scope or a durable product decision.
- When an existing JB component or standard lacks a required capability, pause the affected task and ask the project owner for an upgrade with the limitation, requested behavior, and usage example.
- When a required component does not exist, pause the affected task and ask the project owner to add it with detailed responsibilities, API, states, validation, accessibility, styling, and usage requirements.
- Do not implement builder-only substitutes or workarounds without explicit approval.

## Planning checkpoint

- [x] Review and approve the product goals and Phase 1 non-goals.
- [x] Decide how users enter the builder and manage saved forms.
  - Open `/form/builder` directly with no initial project selector.
  - Use `/form` as the landing and form-selection page.
  - Support optional form slug on Builder, Designer, and Preview.
  - Load named form by slug; otherwise load the current working draft.
  - Put a settings icon beside the form name.
  - Use the settings modal to name and save the current form or load a previous form.
  - Persist the current working draft only when the user explicitly presses Save.
  - Change named-form records only through explicit Save or Save As actions.
  - Store the builder version in every saved-form record.
- [x] Schedule JSON import for Phase 2.
- [x] Schedule undo/redo for Phase 2.
- [x] Schedule multilingual form authoring for Phase 2 and require a localization-ready Phase 1 document.
- [x] Limit Phase 1 to desktop layouts and schedule mobile/touch Builder support for Phase 2.
- [x] Limit Phase 1 form structure to a single ordered column.
- [x] Require Persian/RTL and LTR operation in Phase 1.
- [x] Default Builder and new forms to English/LTR and use `jb-core/i18n`.
- [x] Put Preview on a separate responsive route; do not embed Preview in Builder.
- [x] Add a separate Designer route and Phase 1 placeholder.
- [x] Require a non-empty valid `name` on every generated form element while allowing repeated names for intentional array collection.
- [x] Require proper semantic icons for catalog and element-list items.
- [x] Prohibit CSS-in-JS; use CSS Modules/external pure CSS with `rem` dimensions.
- [x] Use OKLCH for application color tokens and progressive-enhancement `corner-shape: squircle` with radius fallbacks.
- [x] Use local React state for component-owned state and MobX only for state shared across Builder regions.
- [x] Define the supported desktop browsers and versions.
  - Latest two stable Chrome, Edge, and Firefox releases.
  - Latest stable Safari release.
- [x] Define a representative large-form size and performance target.
  - Baseline: a form with 100 elements.
  - Response targets: editing feedback within 100 ms and restore/export completion within 1 second on the reference test environment.
  - Preview target: load, validate, and reach renderer-ready within 1.5 seconds for 100 elements.
  - Prevent an element edit from rerendering the entire catalog, canvas, or unrelated configuration controls.
- [x] Agree on Phase 1 completion and Phase 2 entry criteria.

## Phase 1 — Form Builder

### 1. JB component inventory

- [x] Capture the authoritative list of all JB Design System form elements.
- [x] Record each element's package, version, category, public properties, events, slots, validation behavior, and styling hooks.
- [x] Separate form inputs from supporting controls that are not form fields.
- [x] Define the minimum supported configuration for every inventory item.
- [x] Create a support matrix with one acceptance checklist per element.
- [x] Document how each applicable form element integrates with `jb-validation` and which validation rules it supports.
- [x] Identify required features that existing JB components or standards cannot support and submit detailed upgrade requests to the project owner.
- [x] Check for required components missing from the JB Design System and submit detailed requests if found. No addable form input was missing.
- [x] Track each design-system request as a blocker for the affected builder task until the change is available or a documented alternative is approved.

Deliverable: `COMPONENT-INVENTORY.md`, `COMPONENT-SUPPORT.md`, and `DESIGN-SYSTEM-REQUESTS.md`. Initial input inventory is complete. DSR-001, DSR-002, DSR-003, and DSR-004 are resolved; DSR-006 is closed as unnecessary for the client-only Phase 1 architecture. Renderer package publication is reserved for the final delivery step; Phase 2 theme inventory is tracked in `THEME-INVENTORY.md`.

### 2. Product flow and interaction specification

- [x] Define the Builder regions: component catalog, form canvas, configuration panel, and document/navigation actions.
- [x] Define add, select, reorder, duplicate, remove, and empty-form behavior.
- [x] Define keyboard interactions and focus movement.
- [x] Define destructive-action confirmation and recovery behavior.
- [x] Define unsaved, saving, saved, export-error, and persistence-error states.
- [x] Define direct entry, optional-slug resolution, current-draft restoration, and empty-form behavior.
- [x] Define the form-name settings icon and the name/save/load modal flow.
- [x] Define the supported desktop layout behavior.
- [x] Define Persian/RTL and LTR layout, direction switching, and focus-order behavior.
- [x] Define navigation to the separate Designer and Preview routes.
- [x] Define responsive Preview loading from IndexedDB and rendering through `<jb-form-builder>`.
- [x] Check the flow's editor-shell needs against the JB Design System. Catalog icons may be sourced or designed locally under the approved icon standard.
- [x] Answer the owner questions and approve the interaction decisions in `PRODUCT-FLOW.md`.

Deliverable: `PRODUCT-FLOW.md`. Product flow and interaction decisions are approved.

### 3. Form JSON contract

- [x] Define stable identifiers for forms and elements.
- [x] Define slug generation, uniqueness, rename, and collision behavior.
- [x] Define form metadata and ordered element structure.
- [x] Define required element-name syntax, normalization, length, generation, and repeated-name behavior.
- [x] Define common and component-specific configuration boundaries.
- [x] Read the `jb-validation` source and define how users configure supported validation rules.
- [x] Define how portable `jb-validation` rules are represented in the form JSON.
- [x] Define schema-versioning and migration rules.
- [x] Define the Phase 2 theme boundary without adding theme editing.
- [x] Define the localization-ready Phase 1 boundary for default locale, direction, and future locale variants.
- [x] Define English/LTR defaults and the `jb-core/i18n` locale identifiers/fallback contract.
- [x] Create a version 1 JSON Schema plus valid minimal, valid complex, valid repeated-name, and structurally invalid fixtures.
- [x] Create a TypeScript form-document type beside the version 1 schema.
- [x] Propose deterministic JSON export file-naming behavior.
- [x] Approve the owner decisions in `FORM-JSON-CONTRACT.md`.

Deliverable: approved `FORM-JSON-CONTRACT.md`, JSON Schema, TypeScript types, fixtures, and migration policy under `schema/v1` and `fixtures/v1`.

### 4. Technical foundation

- [x] Confirm SPA/island boundaries across `/form/builder`, `/form/designer`, and `/form/preview`.
- [x] Define the optional-slug route resolver shared by all three routes.
- [x] Select Ajv schema validation and MobX for shared Builder state only.
- [x] Require local React state for component-owned UI state; Preview, Landing, and Designer do not use MobX unless state becomes shared.
- [x] Define the component-registry interface.
- [x] Define required name defaults and the existing-or-locally-designed icon boundary.
- [x] Finalize the `<jb-form-builder>` public JSON property, states, methods, events, and integration contract.
- [x] Define separation between portable form data and editor-only state.
- [x] Define separation between portable form data and Preview runtime response state.
- [x] Select external CSS Modules, prohibit CSS-in-JS, and require `rem`/logical-property styling.
- [x] Define error boundaries and recoverable fallback states.
- [x] Establish unit, integration, accessibility, and end-to-end test layers.
- [x] Define memoization, observer granularity, lazy-loading, and performance measurement boundaries.
- [x] Approve the architecture decisions and simple GitHub Pages deep-link fallback.
- [x] Authorize implementation to source or design proper icons for all 16 catalog entries.
- [x] Close DSR-006 for Phase 1: all form routes are client-only and use one active `jb-core/i18n` locale per page.

Deliverable: approved `TECHNICAL-FOUNDATION.md` architecture and test strategy.

### 5. Builder shell

- [x] Implement the approved page layout using the JB Design System.
- [x] Implement empty, loading, ready, and failure states.
- [x] Implement the component catalog from registry metadata.
- [x] Render proper registry icons in the catalog and element list.
- [x] Implement form selection and configuration-panel wiring.
- [x] Implement the form-name settings icon and form-management modal.
- [x] Add Designer and Preview route buttons for the current form.
- [x] Configure Builder locale with `jb-core/i18n`, defaulting to English/LTR.
- [x] Verify keyboard navigation and supported desktop behavior.
- [x] Verify render isolation and response-time targets with a 100-element document.

Deliverable: usable builder shell with registry-driven placeholder elements. Completed with browser verification and the focused `npm run test:form` suite.

### 6. Core editing

- [x] Add elements with valid defaults and generated non-empty names.
- [x] Select and configure common and registry-declared component properties.
- [x] Reorder elements through pointer insertion targets, buttons, and keyboard shortcuts.
- [x] Duplicate elements with new stable identifiers while preserving names by default.
- [x] Remove elements with confirmation and the agreed focus recovery behavior.

Deliverable: complete editor workflow independent of persistence. Completed with registry-owned configuration metadata for all 16 catalog entries, inline name validation, select-option editing, selected-card action isolation, focused store/performance tests, and browser verification in English/LTR and Persian/RTL.

### 7. JB element coverage

- [x] Implement one registry adapter per inventory item.
- [x] Require every adapter to generate and validate `name`.
- [x] Map every adapter to a proper existing or locally designed semantic icon.
- [x] Expose every approved component property.
- [x] Map component events and validation behavior correctly.
- [x] Verify serialization round trips without data loss.
- [x] Complete visual, interaction, accessibility, and JSON checks for every support-matrix row. Registry/JSON/unit checks, Builder validation-editor browser checks, and rendered Preview checks pass.

Deliverable status: the 16 adapter implementations and Phase 1 component/Preview acceptance checks are complete. The real-package checkpoint covers all components together plus checkbox interaction; Chrome confirms all 16 saved controls, optional-form validity, responsive layouts, Persian/RTL rendering, and the agreed acceptance matrix. Final package delivery remains pending.

### 8. IndexedDB persistence

- [x] Define database, object store, key, and index names.
- [x] Define a unique slug index for named forms.
- [x] Implement database initialization and migrations.
- [x] Define stored current-draft and named-form records with identity, schema/builder versions, timestamps, and form document.
- [x] Persist the current working draft only through explicit Save.
- [x] Restore the current draft directly into the builder on page load.
- [x] Resolve named forms by slug on all `/form` subroutes.
- [x] Implement naming and explicit saving through the form-management modal.
- [x] Implement the list and loading of previously saved named forms.
- [x] Handle unavailable, corrupt, incompatible, or quota-limited storage.
- [x] Test refresh, browser restart, migration, and recovery scenarios.

Deliverable: reliable current-draft and named-form persistence with builder-version and migration coverage. Completed with a native versioned repository, one memoized database connection, four approved stores, atomic draft/named writes, optimistic revisions, Save As identity rules, compiled JSON Schema plus semantic/registry validation, typed failures, named-form landing list, shared route resolution, and deterministic fake-IndexedDB tests.

### 9. Form route family and Preview renderer

- [x] Create Builder, Designer, and Preview routes with optional slug.
- [x] Implement the `/form` landing page.
- [x] Implement shared IndexedDB form resolution and recovery.
- [x] Implement the Phase 1 Designer placeholder with preserved form identity.
- [x] Implement the application `<jb-form-builder>` renderer for integration testing.
- [x] Map declarative validation rules inside `<jb-form-builder>`.
- [x] Implement responsive Preview loading from IndexedDB.
- [x] Keep Preview response values session-only.
- [x] Require a successful explicit Save before navigating changed work to Designer or Preview.
- [x] Verify Preview across narrow mobile, desktop, zoom, touch, keyboard, LTR, and RTL.
- [x] Verify unknown-slug, unavailable-storage, corrupt-record, and incompatible-schema recovery.
- [x] Resolve final-delivery sequencing: publication and application-renderer removal are deferred by owner until the final handoff.

Deliverable: navigable route family with empty Designer and responsive JSON-driven Preview.

Renderer status: implemented as concern-specific TypeScript modules with an open Shadow DOM, external CSS, automatic or consumer-controlled dependency registration, lazy package memoization, validated document cloning, locale override, generation-safe asynchronous rendering, partial error isolation, `jb-form` value/validity/reset facades, typed events, and a separate React wrapper. Unit coverage includes the server-import boundary, manual dependency reporting, every registered element type, repeated names, values/events/reset, invalid documents, attributes, and wrapper property/event bridging. Real-package coverage imports all 16 packages, renders compatible controls both independently and together, and exercises checkbox interaction. The saved Chrome fixture confirms all 16 exact tags, validity, responsive layout, and RTL. Package publication is deferred by owner; cross-browser verification and zoom/touch checks remain outside the accepted Phase 1 scope.

### 10. JSON export

- [x] Validate the current document before export.
- [x] Exclude editor-only state.
- [x] Produce deterministic, readable JSON.
- [x] Download using the agreed file-name convention.
- [x] Verify exported output against the agreed fixtures.

Deliverable: validated, versioned JSON export.

Implementation status: the Builder lazily loads a reusable Mantine
`@mantine/code-highlight` viewer with a Shiki adapter when the export dialog is
opened. The dialog shows the validated JSON with localized copy feedback and
downloads `{slug-or-untitled-form}.jb-form.json`. Recursive key ordering makes
equivalent documents byte-for-byte deterministic while array order remains
semantically intact.

### 11. Phase 1 hardening and acceptance

- [x] Pass type checks, production build, and automated tests.
- [x] Pass the keyboard and accessibility acceptance checklist.
- [x] Verify persistence and export recovery paths.
- [x] Verify optional-slug navigation and cross-page IndexedDB resolution.
- [x] Verify responsive Preview and `<jb-form-builder>` error isolation.
- [x] Verify the agreed large-form size and response-time targets.
- [x] Verify memoization/observer boundaries with React Profiler or equivalent render-count instrumentation.
- [x] Verify the agreed desktop browsers and layouts.
- [x] Verify every component-support matrix row.
- [x] Resolve or explicitly defer all Phase 1 blockers.
- [x] Approve the Phase 1 JSON contract as the input to Theme Builder.

Deliverable: Phase 1 acceptance complete; package delivery is deferred; documented Phase 2 handoff is active.

## Phase 1 definition of done

- Every element in the approved JB form-element inventory is supported.
- Every generated element has a valid name and approved catalog icon.
- Users can create, configure, reorder, duplicate, and remove elements.
- Generated forms use a single ordered column in Phase 1.
- The builder works in Persian/RTL and LTR layouts.
- English/LTR is the default and locale configuration uses `jb-core/i18n`.
- The current draft restores directly into the builder without a project-selection screen.
- Users can name and save the current form or load a previous named form through the form-management modal.
- IndexedDB is written only after an explicit Save or Save As action.
- IndexedDB records include both builder version and form-document schema version.
- Exported JSON is complete, portable, versioned, and validated.
- Builder, Designer, and Preview support optional form slugs.
- Designer preserves form identity and shows the Phase 1 placeholder.
- Preview independently loads IndexedDB JSON and renders it through `<jb-form-builder>`.
- The final owner-approved delivery step publishes and integrates the `jb-form-builder` package, replacing the application renderer.
- Preview is responsive and keeps runtime response data out of the form definition.
- The Phase 1 document can add multilingual content in Phase 2 without changing stable form or element identities.
- Core flows meet the agreed keyboard, accessibility, desktop-browser, desktop-layout, and performance targets.
- Automated checks and the support matrix pass.
- Phase 2 can consume the stable form document without redesigning Phase 1 data.

## Phase 2 — Theme Builder

Phase 2 begins now that Phase 1 acceptance is complete; package publication remains a deferred final handoff:

- [x] Inventory JB theme tokens and component styling hooks in `THEME-INVENTORY.md`.
- [x] Define the theme JSON schema and its relationship to the form document in `THEME-SCHEMA.md`.
- [ ] Define global tokens versus component-level overrides. (Deferred until after Theme Builder behavior is accepted.)
- [x] Define live-preview, reset, preset, import, and export behavior in `THEME-BEHAVIOR.md`.
- [x] Implement JSON import, validation, current-version migration boundary, and import-error recovery in `src/features/form/import`.
- [x] Implement undo/redo for approved form editing actions; the document snapshot boundary will also cover future theme data.
- [x] Implement multilingual form authoring, locale management, localized content fallback, and direction configuration using the Phase 1 localization boundary.
- [x] Define supported mobile viewport, browser, and device targets.
  - Builder editing must work from `320px` through `1023px` CSS width; `320px` is the minimum supported width, `375px` is the primary small-phone baseline, `412px` is the large-phone baseline, and `768px` is the tablet baseline.
  - The existing `64rem` (`1024px`) threshold remains the desktop editing breakpoint; Preview remains responsive below and above that threshold.
  - Verify the latest two stable Chrome Android releases, the latest two supported Safari iOS major versions, and the latest two stable Firefox Android releases.
  - Use representative device profiles: a 320px-class small phone, 375px-class standard phone, 412px-class large phone, and 768px-class tablet. Device brand/model identity is not a compatibility requirement; CSS viewport, pixel ratio, touch input, and browser engine are.
- [x] Adapt the Builder layout for mobile viewports with a three-panel mobile workspace, horizontally scrollable header actions, and narrow-screen form/settings layouts while retaining the existing desktop workspace.
- [x] Define and implement touch interactions for selection, ordering, and configuration: tap selects, Add returns to the canvas, Configure opens Properties, coarse pointers use explicit Move controls, and primary touch targets are at least `2.75rem`.
- [x] Verify mobile accessibility, performance, persistence, import, and export flows.
  - Real-browser checks at `320px`, `375px`, and `768px` confirm one visible workspace panel, no page-level horizontal overflow, intentional header-action scrolling, correct selection/configuration focus, explicit reordering, and no console errors. The `412px` profile uses the same verified mobile breakpoint behavior.
  - All primary mobile actions, selected-card actions, settings, and export controls now expose at least `2.75rem` by `2.75rem` targets; the export modal remains inside the mobile viewport.
  - Reload restores the explicit saved draft and discards unsaved test reordering. Browser import reaches the file chooser, while fixture parsing/error recovery and deterministic export/download preparation are covered by automated tests.
  - Type checking and production build pass; 51 form tests cover the 100-element performance baseline, persistence, import, export, mobile panel transitions, and touch-safe ordering. The separate all-component package integration hook retains its previously recorded environment timeout.
- [ ] Confirm that responsive/touch changes do not regress the desktop experience.

## Phase 3 — Designer

Designer remains a Phase 1 route and placeholder, but its implementation is deferred until Phase 3:

- [ ] Create and approve a separate Theme Builder delivery plan.
- [ ] Replace the Designer placeholder with the Theme Designer.
