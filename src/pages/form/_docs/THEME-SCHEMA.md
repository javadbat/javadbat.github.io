# JB Form ThemeConfig Version 1 Contract

Status: Runtime types, validation, canonicalization, renderer property/backgrounds, strict/supported-values-only import, and persistence implemented
Reviewed: 2026-08-31

ThemeConfig is standalone portable visual configuration. It is not nested in FormConfig, does not own form identity, and is reusable with any form.

## Runtime relationship

```js
builder.formConfig = formConfig;
builder.themeConfig = themeConfig; // optional
```

Missing, `undefined`, or `null` ThemeConfig means current JB defaults. The component does not resolve theme names, queries, files, or IndexedDB.

Form schema v1 stays unchanged with legacy `theme: null`. A future form schema removes that field; it never promotes it to an embedded object. Form/theme exports stay separate.

## Required and optional fields

`schemaVersion: 1` and non-empty `name` are required for persisted/exported config. `description` is optional. Every visual section and value is optional. Partial in-memory config cannot persist/export until required metadata is valid.

## Portable fields

| Field | Rule |
| --- | --- |
| `$schema` | Optional stable schema URL. |
| `schemaVersion` | Required integer; version 1 is `1`. |
| `name` | Required non-empty display name. |
| `description` | Optional description. |
| `global` | Optional sparse map keyed by CSS variable name. |
| `typography` | Optional font family and text scale. |
| `sizing` | Optional audience preset and spacing scale. |
| `defaults` | Optional `controlSize`; the only v1 component default. |
| `background` | Optional color, pattern, or image configuration. |
| `components` | Optional preserved component token maps; not edited in v1. |

Export includes only meaningful values actually set. It never expands all supported tokens, null placeholders, or current JB defaults.

## Global and friendly values

`global` accepts every public shared CSS custom property in the supported `jb-core/theme`, keyed by its actual CSS variable name. Verify the exact allowlist against the supported package during implementation.

Maps are sparse. Missing, `undefined`, or `null` means no override. JSON cannot encode `undefined`; setting `null` removes the key. Unknown/invalid entries fail unless the author explicitly chooses supported-values-only import.

Font family uses the product catalog. Text and spacing scales remain form-scoped. Audience size stores Compact, Standard, Large, Extra Large, or `custom` plus its resolved values. Manual resolution changes set `custom`.

Size precedence is explicit element size, then theme `controlSize`, then native JB default.

## Background

Background is one discriminated object:

- `color`: required color value;
- `pattern`: stable bundled `patternId`, optional background/foreground colors, opacity, and scale;
- `image`: URL or data source, optional fit, position, opacity, overlay color, and fallback color.

URL sources permit HTTP/HTTPS; load failure is runtime state. Data sources accept Base64 PNG/JPEG/WebP. Decoded size warns above 400 KB and rejects above 800 KB.

`file:` and `blob:` are temporary editor sources, never portable ThemeConfig. Extracted fallback stores only after valid commit.

## Component compatibility

`components` stores supported component CSS-variable overrides. Keys are restricted to form-renderer JB tags, and tokens are restricted to the exact public properties captured from their installed custom-element manifests. Derived input controls may also use the public `jb-input` properties they inherit; image input may use inherited file-input properties. Maps are sparse and non-null. Designer edits these values through component selection and searchable public-token controls.

`::part`, selectors, declaration maps, arbitrary CSS, and per-element maps are invalid.

Precedence is JB defaults, `global`, then `components[tag].tokens`. Global edits never overwrite or recalculate explicit component values.

## Sparse canonicalization

Remove editor-only fields, `undefined`, `null`, invalid empty strings, empty objects/arrays, and unset/default representations. Preserve meaningful `0` and `false`.

Canonical top-level order is `$schema`, `schemaVersion`, `name`, `description`, `global`, `typography`, `sizing`, `defaults`, `background`, and `components`.

Emit only non-empty optional sections. Sort token/component keys lexicographically. Never materialize current JB defaults.

## Local record versus portable config

The local record adds `recordVersion`, UUID `id`, stable `slug`, timestamps, and the portable `config`. Generate slug from initial name and append `-2`, `-3`, etc. on conflict. Rename keeps slug; import creates new local identity.

UUID, slug, timestamps, source preset, default selection, bindings, save state, and history are never portable.

## Import and export

- Reject unsupported/newer versions without silent downgrade.
- Compatible missing fields use current defaults without materializing them.
- Validate before persistence or draft replacement.
- Default import is all-or-nothing.
- Explicit Import supported values only strips and reports unsupported optional paths before persistence. It never downgrades `schemaVersion` or invents a missing required name.
- Failure changes nothing.
- Export filename is `{theme-slug}.jb-theme.json`.
- Export is canonical snapshot, not a preset reference.
- Exclude local/runtime/temporary/generated data.
- Form export stays separate and never embeds ThemeConfig.
