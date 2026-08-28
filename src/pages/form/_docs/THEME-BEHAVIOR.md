# JB Form Theme Designer Behavior

Status: Product behavior approved; implementation not started
Reviewed: 2026-08-29

This document owns Designer interaction, persistence, and recovery. `THEME-SCHEMA.md` owns portable data; `DESIGNER-PLAN.md` owns full scope and sequence.

## State model

Keep persisted ThemeConfig, editor draft/intermediate input, preview runtime, and local relationships separate. Themes never live inside FormConfig. Preview responses, validation state, viewport, preview-form selection, and component selection never enter ThemeConfig.

## Library and loading

`/form/designer` opens the library. Create asks Blank/Preset, required name, and optional description. Editing a preset clones it before the first edit. Duplicate creates new UUID/slug.

`theme=:slug` resolves a local theme; `form=:slug` selects preview only. Missing theme offers Library/Create/Import. Missing preview form uses the fixture. The saved-form selector changes preview without changing bindings.

## Live preview and components

Committed valid changes reach preview under 100ms. Invalid intermediate input stays local; preview retains last valid value. Preview uses the runtime renderer, is interactive, and keeps responses session-only. Desktop offers Desktop/Mobile viewports; mobile uses real width. Reset preview clears runtime state only.

Preview uses form locale/direction while v1 Designer chrome is English/LTR.

Components is a selector plus isolated representative preview, not a token editor. Valid preset/import component values apply and persist. State clearly that editing comes later; add no override warnings, propagation, or reset-all action.

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

Accept pasted JSON or `.jb-theme.json`. Parse and validate before changing draft/storage. Default rejects the whole unsupported input; explicit Import supported values only shows/removes unsupported paths.

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
