# JB Form Theme Designer Behavior

Status: IndexedDB records, autosave revisions, query/default/binding resolution, strict and supported-values-only import, duplicate, atomic delete replacement, portable backgrounds, image fallback/retry, preview/history/export, and Chromium/Firefox/WebKit responsive/keyboard/RTL acceptance implemented
Reviewed: 2026-08-30

This document owns Designer interaction, persistence, and recovery. `THEME-SCHEMA.md` owns portable data; `DESIGNER-PLAN.md` owns full scope and sequence.

## State model

Keep persisted ThemeConfig, editor draft/intermediate input, preview runtime, and local relationships separate. Themes never live inside FormConfig. Preview responses, validation state, viewport, preview-form selection, and component selection never enter ThemeConfig.

## Library and loading

`/form/designer` opens the library. Create asks Blank/Preset, required name, and optional description. Editing a preset clones it before the first edit. Duplicate creates new UUID/slug.

`theme=:slug` resolves a local theme; `form=:slug` selects preview only. Missing theme offers Library/Create/Import. Missing preview form uses the fixture. The saved-form selector changes preview without changing bindings.

## Live preview and components

Committed valid changes reach preview under 100ms. Invalid intermediate input stays local; preview retains last valid value. Preview uses the runtime renderer, is interactive, and keeps responses session-only. Desktop offers Desktop/Tablet/Mobile viewports, with Tablet fixed at 768px; mobile-sized Designer screens use their real width and hide the device-size selector. Reset preview clears runtime state only.

Preview uses the saved form's default locale/direction independently of the Designer chrome, which supports English/LTR and Persian/RTL.

Components starts with family-level preview isolation, then lets the author choose one supported renderer component. Its searchable property list comes from the manifest-backed ThemeConfig allowlist. The complete public-token list is grouped by visual purpose and can be filtered to default, hover, focus, active, or disabled states; state filtering composes with search and the overrides-only filter. The preview-state selector temporarily derives and scopes matching component shadow rules behind a Designer-only attribute, making hover, focus, active, and disabled visuals persistent without changing ThemeConfig or exported CSS. Live accessibility diagnostics rasterize the rendered CSS colors, evaluate text contrast against WCAG AA/AAA thresholds using computed text size and weight, and compare forced focus visuals with the default state to detect a visible focus change. An explicit component audit checks every rendered instance across all preview states, keeps the worst contrast result per state, reports missing focus changes, and links each issue to a likely responsible public token. The previous preview state is restored after the audit. Diagnostics are preview-only and never enter ThemeConfig. Selecting a property exposes its sparse CSS value override and a runtime-derived effective value with its source: component override, global theme, or JB default. Default fallback expressions are read from the rendered component and resolved against inherited global variables when the browser exposes them; otherwise the Designer states that the value resolves internally. Recognized color properties provide a visual color picker; recognized single-length properties provide a numeric value and unit selector; opacity is bounded from 0 to 1; and enumerated properties such as border style, font weight, alignment, direction, display, overflow, and cursor offer common values. The CSS field remains available for variables, `calc()`, and advanced or uncommon syntax. Enter, leaving the CSS field, or completing a typed-control interaction commits a valid value as one history/autosave change, while invalid intermediate CSS stays local and the preview retains the last valid value. Clearing it restores inheritance from the global theme or JB default. Authors can filter to overridden properties and reset all overrides for the selected component after confirmation. Component edits participate in normal preview, history, autosave, import, and export behavior. No arbitrary CSS, selectors, parts, cross-component tokens, propagation, or theme-wide component reset is accepted.

Contrast audit failures also offer a nearest-color AA suggestion. Authors can preview the suggestion on the isolated component without changing ThemeConfig, then explicitly apply it through the normal undoable autosave flow. Completed audits can be copied or downloaded as portable Markdown reports containing the audited theme and component, covered states, measured failures, responsible public tokens, and suggested fixes.

The full-form audit temporarily renders the complete current preview, scans every supported component instance across all interaction states, aggregates failures by component, and restores the author's previous component isolation and preview state. Each aggregate issue links back to the relevant component, state, and likely public token for focused review. The complete aggregate—including passing components, instance counts, failures, tokens, and suggested AA fixes—can be copied or downloaded as a portable Markdown report.

## Presets

Eight presets are immutable templates. Creation materializes a detached snapshot. Applying another preset is one undoable replacement after confirmation. Export contains the snapshot, not a preset dependency.

## Autosave and history

- Autosave 500ms after the latest committed valid edit.
- Write only canonical valid ThemeConfig.
- Show Saving, Saved, or Save failed.
- New edits during saving require a later revision; old completion cannot clear newer dirty state.
- Navigation waits for save and blocks on failure with Retry/export.
- No normal Save button.
- Temporary file/blob background is never reported as saved.

Undo/redo covers preset, name, description, and committed visual edits. Invalid control text creates no history until valid commit. History is session-only; undo/redo results autosave.

Reset removes authored visual overrides while retaining metadata after confirmation. Discard restores the latest persisted config and clears session history after confirmation.

## Import and export

Accept pasted JSON or `.jb-theme.json`. Parse and validate before changing draft/storage. Default rejects the whole unsupported input; explicit Import supported values only previews and removes unsupported optional paths. Unsupported schema versions and missing required names remain blocking errors.

Import creates a new local theme and asks on every name/generated-slug conflict. Create copy is the safe default. Failure changes nothing.

Export uses the latest valid canonical draft even if IndexedDB fails. Invalid intermediate input is excluded with explanation; it does not destroy export recovery. Download `{theme-slug}.jb-theme.json`.

Exclude null, undefined, empty/default, local-record, binding, history, runtime, and temporary-source data. Form export is always independent.

## Default and bindings

Default selection and form-to-theme bindings are local relationships, not portable config. Explicit URL theme wins without changing binding. Default affects only unbound forms; JB default is final fallback.

## Background behavior

Accept HTTP/HTTPS and attempt loading. On network, decoding, mixed-content, or CORS-dependent extraction failure, keep editing and render fallback with Background unavailable, Retry, and Edit source.

Local file selection creates a temporary browser source. Keep it out of persistence/export and show a warning to upload/use URL or convert to Base64. Navigation offers Stay and replace or Leave with saved background/fallback.

Base64 accepts PNG/JPEG/WebP. Measure decoded bytes: above 400 KB through 800 KB warns and needs confirmation; above 800 KB rejects while preserving prior background.

Attempt fallback extraction automatically. Local/blob, Base64, and same-origin are normally readable; cross-origin needs CORS even when cached. On success commit through the normal fallback field. Failure retains current/default fallback and manual editing.

## Delete and runtime application

Presets/JB default cannot be deleted. Deleting an unused local theme requires confirmation. A used/default theme requires selecting another theme or Default. Reference replacement and delete are atomic; failure rolls back everything.

Apply theme only in renderer/form scope; never change host `<html>` size or mutate FormConfig. Explicit element size wins over theme `controlSize`; unset inherits. Component tokens win over globals and are not recalculated. Missing, `undefined`, or `null` theme values produce no override.

## Recovery

| Failure | Behavior |
| --- | --- |
| Unknown/corrupt theme | Explain and offer Library/Create/Import; do not invent a record. |
| Unsupported import | Reject or explicit supported-values-only path. |
| Storage/autosave failure | Keep memory draft; Retry and export. |
| Background unavailable | Use fallback; retry/edit source. |
| Missing preview form | Use fixture and continue editing. |
| Temporary source on leave | Stay/replace or leave with saved fallback. |
| Delete transaction failure | Preserve theme and relationships. |

Acceptance is the walkthrough in `DESIGNER-PLAN.md` plus tests for sparse output, precedence, migrations, save races, rollback, Base64 limits, temporary-source exclusion, query resolution, keyboard use, 320px layout, and performance.
