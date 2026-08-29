# JB Form — Operational Plan

Status: Theme Designer implementation active; backend-dependent Form Builder steps remain deferred
Reviewed: 2026-08-30
Owner: Form Builder product owner

This is the execution checklist. Work is handled in order, one active step at a time. Completed implementation detail belongs in the supporting documents; it is not repeated here as open work.

## Operating rules

- Keep one step `IN PROGRESS` at a time.
- Before starting a step, update its acceptance criteria and affected reference documents.
- A step is complete only after code, tests, and the relevant browser/UX checks pass.
- If a missing JB capability blocks the step, record it in `DESIGN-SYSTEM-REQUESTS.md` and pause only that step.
- Durable product decisions belong in `PROJECT.md`; interaction decisions belong in `PRODUCT-FLOW.md`; JSON decisions belong in `FORM-JSON-CONTRACT.md`.

## Baseline — complete

Phase 1 Form Builder and Preview acceptance is complete.

- 25 catalog entries are registry-backed: 4 portable content blocks, 17 value controls, 1 action, and 3 structural/workflow containers.
- Add, select, configure, reorder, duplicate, remove, Save, Save As, import, export, undo, and redo are implemented.
- Current drafts and named forms persist through explicit IndexedDB Save/Save As.
- Landing, Builder, Designer placeholder, and Preview routes resolve current drafts and named forms.
- English/LTR and Persian/RTL flows are implemented.
- Responsive Preview and the application-local `<jb-form-builder>` renderer are verified.
- No active Form Builder design-system blocker remains.

Reference: `COMPONENT-INVENTORY.md`, `COMPONENT-SUPPORT.md`, `PRODUCT-FLOW.md`, `FORM-JSON-CONTRACT.md`, and `TECHNICAL-FOUNDATION.md`.

## Step 1 — close the Phase 2 Builder handoff

Status: COMPLETE

Acceptance:

- [x] Verify that the mobile/touch workspace does not regress the approved desktop Builder experience.
- [x] Re-run type check, focused form tests, production build, and the agreed desktop smoke flow.
- [x] Keep the documented mobile contract: 320px minimum, one visible panel, no page-level horizontal overflow, explicit ordering, and `2.75rem` primary targets.

Acceptance evidence (2026-08-27):

- TypeScript check, 192 focused form tests across 31 files, and production build pass.
- Browser checks pass at 1440px, 1199px, 768px, 412px, 375px, and 320px with no page-level overflow, error overlay, or new console error.
- Wide desktop shows all three workspace regions; compact desktop shows Canvas plus one side panel; mobile shows exactly one workspace panel.
- Mobile Add returns to Canvas, Configure opens Properties, and explicit ordering controls remain available.
- Import, export, undo, redo, unsaved Preview/Designer guards, and the Preview/Designer routes pass the smoke flow.
- Mobile workspace tabs, More, Save, and mobile Preview controls expose `2.75rem` (44px) targets.

## Step 2 — final renderer package handoff

Status: DEFERRED BY OWNER

- Publish the approved `jb-form-builder` package.
- Replace the application-local renderer with the published package.
- Re-run the real-package integration, Preview, error-isolation, and support-matrix checks.

This is a delivery handoff, not a current component request.

## Step 3 — respondent workflow and wizard

Status: IMPLEMENTED; FINAL BROWSER ACCEPTANCE PENDING

- Approved contract: ordered, one-level steps; current-step validation before forward movement; Previous, Next, and Complete navigation; cancelable pre-change plus change/completion events; hidden-step controls excluded from active interaction.
- Implemented framework-independent `packages/jb-form-wizard` and registered it as the optional `jb-form-wizard` dependency.
- Added the portable schema/type, semantic validation, registry/configuration, dependency discovery, runtime rendering, Builder canvas, step editor/reordering, and leaf-only drag/drop support.
- Unit and real-package integration checks verify linear navigation, current-step validity, duplicate-step rejection, dependency isolation, and that ordinary free-navigation forms do not load wizard behavior.
- Run the final representative browser/mobile/RTL acceptance before closing this step.

## Step 4 — upload destinations and backend upload behavior

Status: NOT STARTED

- Approve the endpoint, authentication, progress, cancellation, retry, recovery, and privacy contracts.
- Keep endpoint secrets outside portable form JSON.
- Preserve a clearly labeled local-demo mode when no upload destination exists.

## Step 5 — publishing and response collection

Status: NOT STARTED; REQUIRES BACKEND PRODUCT CONTRACT

- Define publishing, hosting, account, permissions, and form-version behavior.
- Define response submission, storage, retention, privacy, export, and failure recovery.
- Add collaboration only after ownership and conflict-resolution behavior is approved.

## Step 6 — form lifecycle refinements

Status: NOT STARTED

- Research whether Builder Save As is discoverable enough for duplication.
- Add landing-page Duplicate only if the research supports it.
- Recheck New, Continue, Open, Save As, and Delete as one coherent lifecycle.

## Step 7 — platform hardening when required

Status: DEFERRED UNTIL REQUIRED

- Add SSR-safe package imports and scoped i18n only when server rendering or simultaneous locale trees become product requirements.

## Design work

Theme contract planning is complete. The owner advanced Theme Designer implementation while backend-dependent Builder Steps 4–7 remain deferred.

## Step 8 — Theme Designer contract

Status: COMPLETE (PLANNING ONLY)

Approved and documented:

- standalone sparse ThemeConfig and local-record identity;
- every shared `jb-core/theme` token;
- component values preserved/rendered but not edited in v1;
- no `::part`, raw CSS, or per-element styling in v1;
- routes, bindings, presets, backgrounds, mobile authoring, autosave, history, import/export, preview, validation, and migration behavior.

Contract sources are `DESIGNER-PLAN.md`, `THEME-SCHEMA.md`, `THEME-BEHAVIOR.md`, and `THEME-INVENTORY.md`.

## Step 9 — select the Theme Designer visual direction

Status: COMPLETE

The selected direction aligns Designer with the existing Builder's floating header, boxed panels, compact spacing, and squircle treatment. Browser comparison evidence is recorded in `design-qa.md`.

## Step 10 — implement Theme Designer

Status: IN PROGRESS

- The responsive editor, eight presets, friendly controls, sample/saved-form preview, local autosave, session history, and portable export UI are implemented.
- ThemeConfig v1 now has shared validation/canonicalization and an optional renderer/React property; global tokens, typography, spacing, component tokens, and default control size reach renderer scope.
- Independent IndexedDB theme records, stable slugs, optimistic autosave revisions, default selection, form bindings, query resolution, and local-theme library selection are implemented.
- Strict paste/file ThemeConfig import, pre-mutation validation, name/slug conflict disclosure, create-copy behavior, and Base64 size confirmation/rejection are implemented.
- Duplicate creates an independent identity/config snapshot. Delete requires a replacement choice and atomically updates the local default plus every form binding before removing the theme; failed replacement validation rolls everything back.
- Renderer-scoped color, bundled pattern, and image backgrounds are implemented from portable ThemeConfig. Image fallback color remains visible when the source fails; Designer preflights persistent sources, reports unavailable/mixed-content images, and offers Retry/Edit recovery while invalid intermediate input keeps the last valid preview/config.
- Supported-values-only import and automated Chromium/Firefox/WebKit desktop/320/375/412/768px keyboard/RTL acceptance are complete. The remaining release check is the physical mobile-device matrix from `DESIGNER-PLAN.md`.

## Done means

The active phase is complete when its implementation, automated tests, browser checks, recovery paths, and reference documents agree. Do not mark a phase complete solely because its UI exists.
