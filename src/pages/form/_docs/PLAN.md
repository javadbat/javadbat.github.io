# JB Form — Route-Family Delivery Plan

Status: Approved plan; ready for implementation
Active phase: Phase 1 — Form Builder  
Phase 2 gate: Do not start until Phase 1 is accepted.  
Phase 3 gate: Do not start until Phase 2 is accepted.

## How to use this plan

- Replace open questions with explicit decisions before implementation depends on them.
- Keep tasks small enough to verify independently.
- Mark a task complete only when its acceptance criteria are satisfied.
- Update `PROJECT.md` when a task changes product scope or a durable product decision.
- When an existing JB component or standard lacks a required capability, pause the affected task and ask the project owner for an upgrade with the limitation, requested behavior, and usage example.
- When a required component does not exist, pause the affected task and ask the project owner to add it with detailed responsibilities, API, states, validation, accessibility, styling, and usage requirements.
- Do not implement builder-only substitutes or workarounds without explicit approval.

## Planning checkpoint

- [ ] Review and approve the product goals and Phase 1 non-goals.
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
- [x] Limit Phase 1 to desktop layouts and schedule mobile/touch support for Phase 3.
- [x] Limit Phase 1 form structure to a single ordered column.
- [x] Require Persian/RTL and LTR operation in Phase 1.
- [x] Default Builder and new forms to English/LTR and use `jb-core/i18n`.
- [x] Put Preview on a separate responsive route; do not embed Preview in Builder.
- [x] Add a separate Designer route and Phase 1 placeholder.
- [x] Require a non-empty valid `name` on every generated form element while allowing repeated names for intentional array collection.
- [x] Require proper semantic icons for catalog and element-list items.
- [x] Prohibit CSS-in-JS; use Tailwind or external pure CSS with `rem` dimensions.
- [x] Use MobX if a state-management library becomes necessary.
- [x] Define the supported desktop browsers and versions.
  - Latest two stable Chrome, Edge, and Firefox releases.
  - Latest stable Safari release.
- [x] Define a representative large-form size and performance target.
  - Baseline: a form with 100 elements.
  - Response targets: editing feedback within 100 ms and restore/export completion within 1 second on the reference test environment.
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
- [x] Check for required components missing from the JB Design System and submit detailed requests if found. No missing component was found in the initial inventory.
- [x] Track each design-system request as a blocker for the affected builder task until the change is available or a documented alternative is approved.

Deliverable: `COMPONENT-INVENTORY.md`, `COMPONENT-SUPPORT.md`, and `DESIGN-SYSTEM-REQUESTS.md`. Initial input inventory is complete. DSR-002 and DSR-003 are resolved. DSR-001, DSR-004, and DSR-005 remain open; DSR-006 is closed as unnecessary for the client-only Phase 1 architecture. A replaceable local `<jb-form-builder>` test implementation is explicitly approved.

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
- [x] Define proposed slug generation, uniqueness, rename, and collision behavior.
- [x] Define form metadata and ordered element structure.
- [x] Define proposed required element-name syntax, normalization, length, generation, and repeated-name behavior.
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
- [x] Select route-local MobX state management and Ajv schema validation.
- [x] Document why Builder complexity requires MobX while Preview remains route-local.
- [x] Define the component-registry interface.
- [x] Define required name defaults and the existing-or-locally-designed icon boundary.
- [x] Finalize the DSR-005 `<jb-form-builder>` public JSON property, states, methods, events, and publication contract.
- [x] Define separation between portable form data and editor-only state.
- [x] Define separation between portable form data and Preview runtime response state.
- [x] Select external CSS Modules, prohibit CSS-in-JS, and require `rem`/logical-property styling.
- [x] Define error boundaries and recoverable fallback states.
- [x] Establish unit, integration, accessibility, and end-to-end test layers.
- [x] Approve the architecture decisions and simple GitHub Pages deep-link fallback.
- [x] Authorize implementation to source or design proper icons for all 16 catalog entries.
- [x] Close DSR-006 for Phase 1: all form routes are client-only and use one active `jb-core/i18n` locale per page.

Deliverable: approved `TECHNICAL-FOUNDATION.md` architecture and test strategy.

### 5. Builder shell

- [ ] Implement the approved page layout using the JB Design System.
- [ ] Implement empty, loading, ready, and failure states.
- [ ] Implement the component catalog from registry metadata.
- [ ] Render proper registry icons in the catalog and element list.
- [ ] Implement form selection and configuration-panel wiring.
- [ ] Implement the form-name settings icon and form-management modal.
- [ ] Add Designer and Preview route buttons for the current form.
- [ ] Configure Builder locale with `jb-core/i18n`, defaulting to English/LTR.
- [ ] Verify keyboard navigation and supported desktop behavior.

Deliverable: usable builder shell with registry-driven placeholder elements.

### 6. Core editing

- [ ] Add elements with valid defaults and generated non-empty names.
- [ ] Select and configure elements.
- [ ] Reorder elements.
- [ ] Duplicate elements with new stable identifiers while preserving names by default.
- [ ] Remove elements with the agreed recovery behavior.
- [ ] Require an explicit successful Save before navigating changed work to Designer or Preview.

Deliverable: complete editor workflow independent of persistence.

### 7. JB element coverage

- [ ] Implement one registry adapter per inventory item.
- [ ] Require every adapter to generate and validate `name`.
- [ ] Map every adapter to a proper existing or locally designed semantic icon.
- [ ] Expose every approved component property.
- [ ] Map component events and validation behavior correctly.
- [ ] Verify serialization round trips without data loss.
- [ ] Complete visual, interaction, accessibility, and JSON checks for every support-matrix row.

Deliverable: all agreed JB form elements marked supported.

### 8. IndexedDB persistence

- [ ] Define database, object store, key, and index names.
- [ ] Add a unique slug index for named forms if slug uniqueness is approved.
- [ ] Implement database initialization and migrations.
- [ ] Define a stored-form record containing form ID, form name, document schema version, builder version, timestamps, and form document.
- [ ] Persist the current working draft only through explicit Save.
- [ ] Restore the current draft directly into the builder on page load.
- [ ] Resolve named forms by slug on all `/form` subroutes.
- [ ] Implement naming and explicit saving through the form-management modal.
- [ ] Implement the list and loading of previously saved named forms.
- [ ] Handle unavailable, corrupt, incompatible, or quota-limited storage.
- [ ] Test refresh, browser restart, migration, and recovery scenarios.

Deliverable: reliable current-draft and named-form persistence with builder-version and migration coverage.

### 9. Form route family and Preview renderer

- [ ] Create Builder, Designer, and Preview routes with optional slug.
- [ ] Implement the `/form` landing page.
- [ ] Implement shared IndexedDB form resolution and recovery.
- [ ] Implement the Phase 1 Designer placeholder with preserved form identity.
- [ ] Implement a replaceable application-local `<jb-form-builder>` for tests using the DSR-005 contract.
- [ ] Map declarative validation rules inside `<jb-form-builder>`.
- [ ] Implement responsive Preview loading from IndexedDB.
- [ ] Keep Preview response values session-only.
- [ ] Verify Preview across narrow mobile, desktop, zoom, touch, keyboard, LTR, and RTL.
- [ ] Verify unknown-slug, unavailable-storage, corrupt-record, and incompatible-schema recovery.
- [ ] Integrate the published `jb-form-builder` package and remove the local test implementation before Phase 1 acceptance.

Deliverable: navigable route family with empty Designer and responsive JSON-driven Preview.

### 10. JSON export

- [ ] Validate the current document before export.
- [ ] Exclude editor-only state.
- [ ] Produce deterministic, readable JSON.
- [ ] Download using the agreed file-name convention.
- [ ] Verify exported output against the agreed fixtures.

Deliverable: validated, versioned JSON export.

### 11. Phase 1 hardening and acceptance

- [ ] Pass type checks, production build, and automated tests.
- [ ] Pass the keyboard and accessibility acceptance checklist.
- [ ] Verify persistence and export recovery paths.
- [ ] Verify optional-slug navigation and cross-page IndexedDB resolution.
- [ ] Verify responsive Preview and `<jb-form-builder>` error isolation.
- [ ] Verify the agreed large-form size and response-time targets.
- [ ] Verify the agreed desktop browsers and layouts.
- [ ] Verify every component-support matrix row.
- [ ] Resolve or explicitly defer all Phase 1 blockers.
- [ ] Approve the Phase 1 JSON contract as the input to Theme Builder.

Deliverable: accepted Phase 1 release and documented Phase 2 handoff.

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
- The local test renderer has been replaced by the published `jb-form-builder` package.
- Preview is responsive and keeps runtime response data out of the form definition.
- The Phase 1 document can add multilingual content in Phase 2 without changing stable form or element identities.
- Core flows meet the agreed keyboard, accessibility, desktop-browser, desktop-layout, and performance targets.
- Automated checks and the support matrix pass.
- Phase 2 can consume the stable form document without redesigning Phase 1 data.

## Phase 2 — Theme Builder

Phase 2 begins only after Phase 1 acceptance:

- [ ] Inventory JB theme tokens and component styling hooks.
- [ ] Define the theme JSON schema and its relationship to the form document.
- [ ] Define global tokens versus component-level overrides.
- [ ] Define live-preview, reset, preset, import, and export behavior.
- [ ] Replace the Designer placeholder with the Theme Designer.
- [ ] Implement JSON import, validation, migration, and import-error recovery.
- [ ] Implement undo/redo for approved form and theme editing actions.
- [ ] Implement multilingual form authoring, locale management, localized content fallback, and direction configuration using the Phase 1 localization boundary.
- [ ] Create and approve a separate Theme Builder delivery plan.

## Phase 3 — Responsive and touch support

Phase 3 begins only after Phase 2 acceptance:

- [ ] Define supported mobile viewport, browser, and device targets.
- [ ] Adapt the builder layout for mobile viewports.
- [ ] Define and implement touch interactions for selection, ordering, and configuration.
- [ ] Verify mobile accessibility, performance, persistence, import, and export flows.
- [ ] Confirm that Phase 3 changes do not regress the desktop experience.
