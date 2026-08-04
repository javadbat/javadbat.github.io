# JB Form Theme Builder Behavior

Status: Phase 2 behavior definition complete; runtime implementation pending  
Reviewed: 2026-08-04

This document defines Theme Builder operations without deciding the deferred global-token versus component-override allowlists. It also does not implement the Designer route, which remains Phase 3.

## State model

Theme editing uses three distinct states:

- **Persisted theme:** the theme stored inside the saved form document.
- **Draft theme:** the editable working copy used by the Theme Builder and live preview.
- **Preview runtime:** the rendered controls and styles produced from the draft theme; runtime response values and validation state are never written into theme data.

Opening Theme Builder clones the persisted theme into draft state. A draft edit marks the form dirty but does not write IndexedDB, change the saved form revision, or mutate the source form document until explicit Save.

## Live preview

- Every valid draft edit updates the Theme Builder preview without navigation or persistence.
- Preview uses the same form document and `<jb-form-builder>` renderer contract as the standalone Preview route.
- Theme changes are presentation-only: values, validation state, element order, form identity, and response data remain unchanged.
- Invalid intermediate input stays in editor state and is shown near the editing control; the last valid theme remains active in preview.
- Preview updates should meet the existing editing feedback target of 100 ms on the reference environment.
- Leaving the page with unsaved theme changes uses the existing unsaved-change guard.

## Reset behavior

Theme Builder exposes two explicit reset operations:

1. **Discard draft changes** restores the draft to the last persisted theme. It does not alter the saved form and clears the theme dirty state.
2. **Reset to default** removes the selected preset and all theme overrides, producing `theme: null` semantics in the draft. It requires confirmation when the draft contains changes.

Reset never changes form structure, element properties, values, or the persisted document without explicit Save.

## Presets

- Presets are local, named, versioned entries supplied by the application or the approved JB preset catalog; they are not remote URLs, executable modules, or arbitrary CSS files.
- Selecting a preset replaces the draft theme base and keeps the result unsaved until explicit Save.
- A preset selection is represented by the stable `theme.preset` identifier. Explicit draft overrides remain separate from the preset base.
- The preset catalog must provide a default fallback. If an imported preset identifier is unavailable, import reports a recoverable issue and offers the default theme; it does not execute or fetch replacement code.
- Applying a preset does not rewrite form element props or create per-element styling data.

## Theme import

Theme Builder supports importing a theme object defined by `THEME-SCHEMA.md`.

- The file is parsed as JSON and validated before it can affect the draft.
- Import validates the theme schema version, preset identifier, supported component keys, public CSS properties, public part names, and JSON-safe CSS declarations.
- Unknown fields, private Shadow DOM selectors, arbitrary CSS blocks, scripts, callbacks, and non-serializable values are rejected.
- A valid import replaces draft theme state only; it does not overwrite the persisted form or IndexedDB record.
- The user can preview, discard, or explicitly Save the imported draft.
- Import failure leaves the current draft unchanged and reports recoverable field/file issues.

Full form JSON import remains a separate operation. When a full form document contains a valid `theme` object, the same theme validation and draft rules apply.

## Theme export

- Theme Builder can export the current valid draft theme as a standalone, readable JSON theme file.
- The standalone filename is `{slug-or-untitled-form}.jb-theme.json`.
- The export contains the theme schema version, preset identifier, and explicit theme data. It excludes editor selection, dirty state, preview response values, generated CSS text, and runtime component instances.
- Export is deterministic and uses the repository's canonical JSON key ordering.
- A full form export continues to contain the theme under the form document's `theme` field. It remains the portable source of form structure plus presentation configuration.
- Invalid draft data blocks export and leaves the last valid/persisted export available as recovery.

## Save and recovery

- Explicit Save validates the complete form document and the draft theme together, then stores them as one new document revision.
- Save failure preserves the draft in memory and provides export/retry recovery.
- Save As creates the normal new form identity and carries the current valid theme draft into the new document.
- Browser refresh, route navigation, and tab close follow the existing draft-recovery policy; theme draft data is not silently discarded when recovery is available.

## Undo and redo

- Builder undo/redo operates on detached portable document snapshots, so editor selection and MobX state are never serialized into history.
- Undo and redo cover approved form edits and will cover theme data automatically when the `theme` object becomes editable.
- `Ctrl/Cmd+Z` undoes and `Ctrl/Cmd+Shift+Z` or `Ctrl/Cmd+Y` redoes when focus is not inside a text-editing control.
- Undoing back to the persisted document clears the dirty state; any other history position remains unsaved.
- Import starts a new unsaved draft history and does not expose the previous saved record through undo.

## Deferred decision

This behavior contract intentionally does not define the global-token versus component-level override allowlists, detailed precedence, or token editor UI. Those decisions remain deferred until after these operations are accepted.
