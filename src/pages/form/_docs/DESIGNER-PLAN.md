# JB Form Theme Designer Plan

Status: Implementation and automated Chromium/Firefox/WebKit acceptance complete; physical mobile-device matrix pending
Reviewed: 2026-08-30
Owner: Form Builder product owner

This is the dedicated delivery plan for the visual theme editor at `/form/designer`. Theme Builder and Theme Designer are one feature. The owner advanced this work while backend-dependent Form Builder work remains deferred in `PLAN.md`.

## Product outcome

The Designer lets ordinary form authors create reusable, professional visual themes without CSS knowledge. Authors can start from a preset, change every shared `jb-core/theme` token through friendly controls, adjust typography and audience sizing, choose a background, preview a real form, and import or export a standalone `ThemeConfig`.

Success means themes are reusable across forms, the editor works from 320px without page-level overflow, every shared JB token is reachable, preview is immediate, valid edits autosave, and exported JSON reproduces the same visual through `<jb-form-builder>`.

## Benchmark direction

Use Typeform's theme-first workflow and Tally's compact control organization as product references, while keeping JB's own design system and data model. Additional comparison references are [Google Forms themes](https://support.google.com/docs/answer/145737), [Fillout styling](https://support.fillout.com/help/styling), and [Jotform themes](https://www.jotform.com/features/themes/). Version 1 deliberately avoids arbitrary CSS.

## Version 1 boundary

Version 1 includes:

- local theme library, create, import, duplicate, delete, and default selection;
- eight immutable bundled presets;
- friendly colors, typography, size/spacing, shape, and background editors;
- every public shared token exported by `jb-core/theme`;
- live sample/saved-form preview and component inspection;
- only `controlSize` as a component-default override;
- ThemeConfig import/export, autosave, history, reset, and recovery;
- local form-to-theme bindings and query theme selection.

Deferred: component-token editing, per-element styles, `::part`/raw CSS, deep state styling, cloud/collaboration, and font uploading/remote stylesheets. Common states continue to follow effective shared/component tokens; there is no separate state editor. Valid component values from presets/imports remain preserved and rendered.

## Library and routes

`/form/designer` contains Default theme, My themes, Preset gallery, search, Create, and Import. Cards show thumbnail, name, optional description, default badge, Edit, Duplicate, Export, Set default, and Delete.

Create asks for Blank or Preset, then required name and optional description. Editing an immutable preset creates a local copy before its first edit.

| Route | Meaning |
| --- | --- |
| `/form/designer` | Library and create/import entry. |
| `/form/designer?theme=:themeSlug` | Edit with the comprehensive fixture. |
| `/form/designer?theme=:themeSlug&form=:formSlug` | Edit while previewing a saved form. |
| `/form/preview?form=:formSlug&theme=:themeSlug` | Preview a form/theme pair. |

The application owns query/IndexedDB resolution. `<jb-form-builder>` receives objects and never reads either. A missing/corrupt preview form falls back to the fixture without blocking editing.

Resolution precedence: explicit `theme` query, saved local form-to-theme binding, locally selected default, built-in JB default. Bindings stay outside both configs.

## Editor layout

Desktop has Back, editable name, autosave state, Undo, Redo, and Export; settings and Live Preview form two columns. Categories are Presets, Colors, Typography, Size and spacing, Shape, Background, and Components. Preview includes Desktop/Mobile choices, saved-form selection, and Reset preview.

Preview is interactive; responses/validation are runtime-only. Component family selection shows an isolated representative preview. Choosing a supported component opens its searchable manifest-backed public-token editor; sparse overrides can be added, filtered, removed individually, or reset for that component without arbitrary CSS, propagation, or recalculation.

Automated browser acceptance runs in Chromium, Firefox, and WebKit and covers desktop plus 320px, 375px, 412px, and 768px viewports with no page-level horizontal overflow, keyboard activation/focus for compact navigation, 44px primary compact targets, independent form-preview direction, and persistent English/Persian Designer chrome. Run it with `npm run test:form:e2e`.

GitHub Actions runs this matrix for pull requests and main-branch deployments. A deployment waits for both the production build and browser job; the Playwright report is retained as an artifact for failed-run diagnosis.

Mobile is a complete authoring surface: 320px minimum, no page overflow, compact Back/name/save-state/More header, Design/Preview tabs, one category at a time, persistent Preview action, real-width preview, and `2.75rem` important targets.

Designer chrome supports English/LTR and Persian/RTL through the shared form-language preference. Preview independently uses the form's actual locale/direction.

## Friendly controls

Primary controls use author-facing concepts; CSS variable names may appear as secondary advanced detail.

Colors cover every current shared palette/text/highlight/black/white token. The author owns choices; version 1 gives no contrast warning.

Typography uses an owner-supplied font catalog and scoped text scale. Never change host `<html>` font size because root `rem` affects unrelated host UI. Audit fixed non-overridable component `rem` values before implementation and log only confirmed missing hooks.

Audience size offers Compact, Standard, Large, and Extra Large, resolving text scale, spacing scale, and default control size. Store preset plus resolved values; manual edits set `custom`.

Size precedence: explicit element `size`, then `themeConfig.defaults.controlSize`, then native JB default. `null`, `undefined`, or absent element size inherits the theme default. Shape maps friendly controls to shared radius tokens; parts/CSS are deferred.

## Backgrounds

Support solid color, bundled SVG pattern, and URL/Base64 image. Patterns have stable IDs plus background/foreground color, opacity, and scale. Images have fit, position, opacity, overlay, and fallback.

Accept HTTP/HTTPS. Load failure, including mixed content, is non-blocking and uses fallback. Portable Base64 supports PNG/JPEG/WebP: warn and confirm above 400 KB decoded; reject above 800 KB.

Local files create temporary `blob:` or equivalent previews. `file:`/`blob:` are session-only and never autosaved/exported. Warn to upload/use URL or convert to Base64; navigation asks to stay/replace or leave using saved background/fallback.

Extract fallback best-effort for Base64, local files/blobs, same-origin URLs, and CORS-permitted remote URLs. Cache does not bypass CORS. Failure keeps current/default fallback and manual editing.

## Presets

| Preset | Direction |
| --- | --- |
| Rose Pop | Pink, playful, child-friendly. |
| Electric Play | High-energy blue, green, and orange, child-friendly. |
| Classroom | Welcoming for teachers and learning. |
| Academic | Reserved and readable for research/college. |
| Professional | Neutral business presentation. |
| Technical | Crisp technology presentation. |
| Calm | Soft, low-distraction presentation. |
| High Contrast | Strong separation/readable affordances. |

Presets are templates, not dependencies. Creation materializes an editable snapshot. Preset component refinements remain independent and preserved.

## Persistence, import, and identity

- Preview updates under 100ms after committed valid edits.
- Autosave starts 500ms after the last committed valid change.
- Show Saving, Saved, or Save failed.
- Invalid intermediate text stays local; preview/storage keep the last valid value.
- Navigation waits for saving and blocks on failure with Retry/export recovery.
- Undo/redo covers preset, metadata, and visual changes; history is session-only and results autosave.
- There is no normal Save button; Form Builder retains explicit Save/Save As.

Portable JSON uses `{theme-slug}.jb-theme.json`; runtime consumes the parsed object. Persisted/exported ThemeConfig requires `schemaVersion` and `name`; `description` is optional. Every visual section/value is optional and sparse.

Local records add hidden UUID, stable slug, timestamps, and autosave metadata. Generate slug from initial name; conflicts append `-2`, `-3`, etc. Rename does not change slug.

Import creates new local identity and asks on every name/generated-slug conflict; Create copy is safest. Default import rejects any unsupported value. Explicit Import supported values only strips unsupported values. Failure leaves the draft unchanged.

Canonical export omits `undefined`, `null`, invalid empty strings, empty maps/lists, and unset/default representations; preserves meaningful `0`/`false`; and orders keys deterministically.

Deleting a used/default theme requires selecting another local theme or Default. Reference replacement and deletion are atomic. Presets/JB default cannot be deleted.

## Runtime handoff

```js
builder.formConfig = formConfig;
builder.themeConfig = themeConfig; // optional; absence means JB default
```

Apply only in form scope. Theme never changes form identity, elements, values, validation, localization, or responses. Precedence is JB defaults, sparse globals, then sparse component overrides. Globals never overwrite explicit component values; version 1 does not recalculate or remove refinements.

Cover unknown/corrupt themes, unsupported data, conflicts, storage failure, unavailable/temporary backgrounds, missing preview form, and atomic failure. Preserve last valid preview/config and export recovery.

## Delivery sequence

1. Keep the placeholder while Form Builder steps are active.
2. Audit tokens and fixed non-overridable `rem`.
3. Freeze schema, types, canonicalizer, migrations, and fixtures.
4. Add independent records, bindings, default selection, and repository tests.
5. Build library/create/import and responsive editor/fixture.
6. Add friendly controls, autosave, history, presets, and recovery.
7. Integrate optional `themeConfig` with final `<jb-form-builder>`.
8. Run browser, mobile, RTL-preview, performance, and recovery acceptance.

The selected Builder-aligned visual direction, responsive editor, presets, friendly controls, preview, local autosave/history, export UI, shared ThemeConfig validation/canonicalization, renderer handoff, and independent IndexedDB theme records are implemented. Stable slugs, optimistic revisions, query/binding/default resolution, localized search across built-in/saved/preset themes, named Blank/Preset creation, built-in Default restoration, registry-driven component preview isolation, searchable manifest-validated component token editing and preservation, editor actions for default/binding selection, a compact mobile header with persistent Preview and keyboard-accessible More actions, strict paste/file import with create-copy conflict handling, duplication, atomic delete/reference replacement, renderer-scoped portable backgrounds, image fallback/retry recovery, non-blocking failed-save status, temporary-image leave confirmation, supported-values-only import, and automated browser/mobile/RTL acceptance are covered. The physical mobile-device matrix remains a release check.

## Acceptance walkthrough

1. On mobile create from Rose Pop, then name/describe.
2. Change colors, font, Audience size, default control size, radius, spacing, and pattern.
3. Inspect a JB input and preview a saved form.
4. Verify explicit sizes win and unset sizes use the theme default.
5. Reopen and verify autosave.
6. Export sparse JSON without null/undefined/empty/default values.
7. Import with a conflict and resolve it.
8. Set default, verify an unbound form, then bind another form.
9. Delete with a replacement and verify atomic bindings.
10. Pass parsed FormConfig and ThemeConfig to `<jb-form-builder>` and reproduce the visual.
