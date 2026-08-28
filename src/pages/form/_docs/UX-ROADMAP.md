# JB Form UX roadmap

Status: Reconciled with the current Form Builder implementation
Reviewed: 2026-08-29
Source of truth for delivery status: `PROJECT.md` and `PLAN.md`

This document describes product direction and UX sequence. It does not override the approved product, interaction, JSON, or technical decisions in the other Form documents.

## Product position

JB Form is a local-first form authoring tool for general-purpose forms, with education and online exams as important use cases.

The current product promise is:

- create and configure a form locally;
- save current work and named forms in the browser;
- reopen, preview, import, and export forms locally;
- author English/LTR or Persian/RTL content, with additional locales supported by the document model;
- keep Preview responses local to the Preview session.

Publishing, accounts, collaboration, cloud storage, response collection, and hosting are outside the current product boundary.

## Current Form Builder state

The following capabilities are implemented in the repository and should be treated as available UX, not future roadmap items.

### Entry and form management

- `/form` is the landing page for creating or continuing the current draft, previewing, and opening named forms.
- `/form/builder` opens the current working draft; it does not show a project-selection screen.
- `/form/builder?form=:slug`, `/form/designer?form=:slug`, and `/form/preview?form=:slug` open a named form by slug.
- Named forms can be loaded and deleted from the landing page.
- The Builder form-settings modal supports naming, slugging, Save, and Save As. Save As is the current duplicate-form path; a separate landing-page Duplicate action is not required by the current flow.
- IndexedDB writes happen only after an explicit Save or Save As.

### Authoring workspace

- The Builder has a component catalog, form canvas, and Properties panel.
- The catalog is registry-driven and currently exposes 25 entries: 4 content blocks, 17 value controls, 1 action, and 3 structural/workflow containers, all with semantic icons.
- Authors can add, select, configure, reorder, duplicate, and remove elements.
- Element names are generated and validated; repeated names are intentionally allowed for array-like values.
- Undo/redo is available through the Builder actions and keyboard shortcuts.
- Import accepts pasted JSON or a JSON file and places the validated document into the draft; the author must save it to persist the result.
- Export validates the document and downloads deterministic `.jb-form.json` output.
- The workspace adapts at compact desktop/tablet widths and at mobile widths. Mobile uses one visible panel at a time with explicit Catalog, Canvas, and Properties tabs.
- Touch ordering uses explicit controls rather than relying on drag-and-drop.

### Localization and preview

- English/LTR is the default Builder and form language.
- Persian/RTL is supported, and the form-settings flow can add supported locale definitions.
- Preview is a separate route, reloads the saved document, and renders through the application-local `<jb-form-builder>` renderer.
- Preview is responsive and does not submit or persist respondent responses online.
- Designer is currently an identity-preserving placeholder. Its approved future replacement is the standalone visual Theme Designer in `DESIGNER-PLAN.md`, still sequenced after higher-priority Form Builder work.

## UX principles

- Use user-facing language in primary UI. Keep terms such as JSON, slug, renderer, and configuration out of primary actions where a clearer phrase exists.
- Keep author navigation free. Tabs remain structural/layout containers; the separate Wizard container is an explicit respondent workflow.
- Keep authoring and respondent behavior separate: the Canvas is an editor surface; runtime interaction belongs in Preview.
- Make persistence explicit and visible. Always distinguish current draft, unsaved changes, saving, saved, and save failure.
- Preserve recovery paths through local storage, validated import, deterministic export, and actionable errors.
- Prefer semantic catalog groups based on user intent rather than one category per input type.
- Keep keyboard focus predictable and provide an equivalent explicit action for pointer-only interactions.
- Treat mobile Builder as a focused single-panel workspace; Preview remains responsive across all viewport sizes.

## Catalog taxonomy direction

The intended user-need grouping remains:

- **Ask for information:** text, long text, number, phone, password, national ID, PIN, payment.
- **Choose an answer:** select, radio-style choice, checkbox, switch, rating, range, matrix/grid.
- **Schedule or identify:** date, time, date/time, address, location, email.
- **Upload or provide media:** file, image, signature, audio/video when supported.
- **Guide the respondent:** section heading, instructions, rich description, divider, image/media block, progress marker.
- **Control form behavior:** hidden value, calculated value, conditional section, repeatable group.
- **Education extensions:** points, correct answer, explanation/feedback, randomized order, question bank, time limit.

The registry remains the implementation source for what is currently addable. New catalog entries should be placed by user need, with technical categories kept out of the primary author experience.

## Remaining UX and product sequence

### Current handoff: finish Form Builder safely

- Confirm that responsive and touch Builder changes do not regress the approved desktop experience.
- Keep the current mobile contract: 320px minimum, one visible workspace panel, no page-level horizontal overflow, intentional header-action scrolling, explicit ordering, and touch targets of at least `2.75rem`.
- Keep the application-local renderer until the owner-approved final handoff; then publish and integrate the `jb-form-builder` package.

### Next: finish Form Builder workflows

- Close the implemented respondent-facing wizard with representative browser/mobile/RTL acceptance. Tabs remain separate structural containers.
- Define and implement upload destinations after the endpoint, security, progress, cancellation, retry, and recovery contracts are approved.
- Add publishing and response collection after backend, permissions, storage, retention, and privacy contracts exist.
- Revisit the complete local form lifecycle and add landing-page Duplicate if research shows Save As is insufficient.

### After Form Builder: Theme Designer

- The ThemeConfig and behavior contract is approved in planning, but implementation remains gated on Form Builder completion/deferral.
- Theme Builder and Theme Designer are one visual-theme feature, not separate phases.
- Themes are standalone reusable configs; forms keep separate local bindings.
- After the gate, select one of three Product Design visual directions before implementation.
- Then build the library, responsive editor, live preview, presets, backgrounds, autosave, history, import/export, and recovery defined by `DESIGNER-PLAN.md`.
- Keep the existing placeholder until implementation starts.

## Property presentation rules

- Starred properties stay in the default Properties panel.
- Plus properties live in a closed Advanced settings disclosure.
- Minus properties are not exposed in the authoring UI.
- Input mode uses a select control.
- Image maximum file size is authored in megabytes; renderer internals may use bytes.
- Current property decisions remain: Autocomplete+, Input mode+, Input type*, Value type-, Calendar default view+, Thousand separator*, Decimal precision*, Show Persian digits+, Show control buttons+, Tick step+, Minor tick step+, Disable balloon rotation-, Popover position+, Hide clear button+, Use checkbox*, PIN Autofocus-, Textarea Automatic height+ (default on), Time Leading zero-, Optional units+, Time Show Persian digits+, Time Close button text-, Image Maximum file size+, Button properties*, Payment Separator+.

## Planned packages

- The saved-form delete action is a local React component. The landing page owns confirmation and persistence.
- `jb-form-wizard` is implemented as the optional respondent-facing linear workflow container; final representative browser/mobile/RTL acceptance remains.

## Future upload architecture

Upload behavior is intentionally future work. Before adding upload UX:

- define an author-facing destination model without exposing adapter or implementation identifiers;
- decide whether configuration is global, per form, or per field;
- define endpoint, authentication, multipart, response, progress, cancellation, retry, and error contracts;
- never store endpoint secrets in portable form JSON or expose them to respondents;
- provide a no-endpoint local-demo mode that clearly states files are not uploaded or persisted online;
- define type/size validation, previews, failed-upload recovery, and offline behavior;
- add a package-level upload contract only after host integration is approved.

## Decision record

The previously open questions are now resolved by the current product flow:

- The landing page owns create/continue/open; direct Builder entry restores the current draft.
- Named-form duplication is provided by Builder Save As.
- Named-form deletion is available on the landing page with confirmation.
- Tabs are structural authoring containers. A future wizard owns respondent navigation and locking.

Any change to these decisions belongs in `PROJECT.md`, with interaction detail updated in `PRODUCT-FLOW.md` and delivery status updated in `PLAN.md`.
