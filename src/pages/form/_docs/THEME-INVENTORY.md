# JB Theme Token and Styling-Hook Inventory

Status: Theme Designer v1 input; manifest-backed component token allowlist implemented
Reviewed: 2026-08-31

This inventory records styling surfaces available to Theme Designer. It is based on `jb-core/theme` and installed `custom-elements.json` manifests. Designer consumes public surfaces only.

## Token layers

### Shared `jb-core` theme tokens

`jb-core/theme` provides the shared palette and sizing foundation:

- Color families: `--jb-primary`, `--jb-secondary`, `--jb-green`, `--jb-red`, `--jb-yellow`, `--jb-neutral`, and the neutral scale `--jb-neutral-0` through `--jb-neutral-10`.
- Text aliases: `--jb-text-primary`, `--jb-text-secondary`, and `--jb-text-contrast`.
- Single colors: `--jb-black`, `--jb-white`, and `--jb-highlight`.
- Radius tokens: `--jb-radius`, `--jb-radius-xs`, `--jb-radius-sm`, `--jb-radius-lg`, and `--jb-radius-xl`.
- Control-height tokens: `--jb-control-height-xs`, `--jb-control-height-sm`, `--jb-control-height-md`, `--jb-control-height-lg`, and `--jb-control-height-xl`.

Components initialize the shared tokens they need. Application-owned surfaces may also use `defineColors()` and `defineSizes()` from `jb-core/theme` when they need the same foundation.

ThemeConfig v1 accepts every public shared token using its CSS variable name as a sparse `global` key. Missing, `undefined`, and `null` produce no override and are omitted from canonical JSON. Verify the allowlist against the exact supported `jb-core/theme` release before freezing the JSON Schema.

### Component tokens

Each component manifest exposes its supported CSS custom properties under a component namespace. The principal namespaces are:

| Component family | Public token namespace | Notes |
| --- | --- | --- |
| Input and inherited input controls | `--jb-input-*` | Size variants and specialized inherited namespaces are available. |
| Date/time controls | `--jb-date-input-*`, `--jb-time-input-*` | Picker z-index and trigger/presentation tokens are component-owned. |
| Choice controls | `--jb-select-*`, `--jb-listbox-*`, `--jb-range-input-*`, `--jb-checkbox-*`, `--jb-switch-*` | Includes state, focus, sizing, and presentation tokens. |
| File controls | `--jb-file-input-*`, `--jb-image-input-*` | Includes upload, loading, overlay, and file-state presentation. |
| Actions and overlays | `--jb-button-*`, `--jb-popover-*`, `--jb-modal-*` | Includes control geometry, overlay colors, radius, and elevation. |

The complete property names/descriptions remain the manifests' `cssProperties`. The renderer contract captures those names in a checked-in allowlist, rejects unknown tags and cross-component or invented token names, and permits the documented inherited input/file surfaces. ThemeConfig v1 preserves valid component maps from presets/imports, and Designer exposes the allowlist through searchable sparse override controls with an isolated preview.

## Public Shadow DOM styling hooks

The following public parts are relevant to form controls and editor surfaces:

| Component | Exposed parts |
| --- | --- |
| `jb-input` and inherited input controls | `label`, `input-box`, `input`, `message` |
| `jb-date-input` | `input`, `popover`, `calendar` |
| `jb-time-input` | `wrapper`, `input`, `popover`, `time-picker`, `close-button` |
| `jb-pin-input` | `pin-input`, `input-wrapper`, `inputs-wrapper`, `message` |
| `jb-textarea` | `component`, `textarea-box`, `textarea`, slot wrappers, `label`, `message` |
| `jb-select` | `arrow-icon`, `clear-button`, `popover`, `search-input`, `selected-value`; option `color-box` |
| `jb-listbox` | `wrapper`, `label`, `list`, `message`; option `color-box` |
| `jb-checkbox` | `checkbox`, `check-bg`, `check-mark`, `label`, `message` |
| `jb-switch` | `component`, `switch`, `bar`, `trigger`, `trigger-button`, `trigger-ring`, `svg-wrapper`, `true-text`, `false-text` |
| `jb-file-input` | `file-name`, `loading`, `placeholder-title`, `upload-loading`, `uploading-title` |
| `jb-image-input` | `message` |
| `jb-popover` | `content` |
| `jb-modal` | `background`, `content-box`, `component-wrapper` |

These hooks remain inventory for a later CSS/parts editor. ThemeConfig v1 accepts no `::part`, selector, declaration map, or arbitrary CSS. Private Shadow DOM descendants are never valid targets.

## Corner geometry rule

There is no shared `corner-shape` variable. `--jb-radius*` is the v1 radius foundation. The example below is future CSS/parts-editor syntax, not valid ThemeConfig v1 data:

```css
form[data-theme="..."] jb-input::part(input-box) {
  corner-shape: squircle;
  border-radius: var(--jb-radius);
}
```

The `border-radius` declaration is the progressive-enhancement fallback. App-owned Builder, Designer, and Preview surfaces may use `corner-shape: squircle` directly; this rule does not create or require a `--jb-corner-shape` token.

## Theme Designer boundaries

- Every shared token is supported as a sparse form-wide override.
- Component CSS properties and `::part` selectors are separate public styling surfaces and should not be collapsed into one undifferentiated token map.
- Derived input controls inherit the `jb-input` surface, so the schema should avoid duplicating inherited properties for every specialized input.
- Overlay and picker parts are available for styling, but their private descendants are not part of the contract.
- Runtime callbacks, DOM factories, `File` objects, `blob:`/`file:` sources, and generated CSS are not ThemeConfig.
- Typography, spacing, Audience size, and backgrounds add form-scope fields outside the JB token inventory.
- Never change host `<html>` font size. Audit fixed non-overridable component `rem` values and request public hooks only for confirmed gaps.
- ThemeConfig is separate from FormConfig and reusable across forms.

## Sources

- `node_modules/jb-core/theme/stories/colors.mdx`
- `node_modules/jb-core/theme/stories/sizes.mdx`
- `node_modules/jb-core/theme/lib/color/define-colors.ts`
- `node_modules/jb-core/theme/lib/sizes/index.ts`
- `node_modules/jb-*/web-component/custom-elements.json`
- `src/pages/form/_docs/COMPONENT-INVENTORY.md`
