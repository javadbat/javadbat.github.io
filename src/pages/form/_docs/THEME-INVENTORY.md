# JB Theme Token and Styling-Hook Inventory

Status: Phase 2, first inventory pass complete  
Reviewed: 2026-08-04

This inventory records the styling surfaces available to Theme Builder. It is based on `jb-core/theme` and the installed web-component `custom-elements.json` manifests. The builder should consume these public surfaces; it should not copy component CSS or reach into private Shadow DOM.

## Token layers

### Shared `jb-core` theme tokens

`jb-core/theme` provides the shared palette and sizing foundation:

- Color families: `--jb-primary`, `--jb-secondary`, `--jb-green`, `--jb-red`, `--jb-yellow`, `--jb-neutral`, and the neutral scale `--jb-neutral-0` through `--jb-neutral-10`.
- Text aliases: `--jb-text-primary`, `--jb-text-secondary`, and `--jb-text-contrast`.
- Single colors: `--jb-black`, `--jb-white`, and `--jb-highlight`.
- Radius tokens: `--jb-radius`, `--jb-radius-xs`, `--jb-radius-sm`, `--jb-radius-lg`, and `--jb-radius-xl`.
- Control-height tokens: `--jb-control-height-xs`, `--jb-control-height-sm`, `--jb-control-height-md`, `--jb-control-height-lg`, and `--jb-control-height-xl`.

Components initialize the shared tokens they need. Application-owned surfaces may also use `defineColors()` and `defineSizes()` from `jb-core/theme` when they need the same foundation.

### Component tokens

Each component manifest exposes its supported CSS custom properties under a component namespace. The principal namespaces are:

| Component family | Public token namespace | Notes |
| --- | --- | --- |
| Input and inherited input controls | `--jb-input-*` | Size variants and specialized inherited namespaces are available. |
| Date/time controls | `--jb-date-input-*`, `--jb-time-input-*` | Picker z-index and trigger/presentation tokens are component-owned. |
| Choice controls | `--jb-select-*`, `--jb-listbox-*`, `--jb-range-input-*`, `--jb-checkbox-*`, `--jb-switch-*` | Includes state, focus, sizing, and presentation tokens. |
| File controls | `--jb-file-input-*`, `--jb-image-input-*` | Includes upload, loading, overlay, and file-state presentation. |
| Actions and overlays | `--jb-button-*`, `--jb-popover-*`, `--jb-modal-*` | Includes control geometry, overlay colors, radius, and elevation. |

The complete property names and descriptions remain the installed package manifests' `cssProperties` entries. Theme Builder should expose a curated semantic subset and retain an escape hatch only where the corresponding public component contract supports it.

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

Use these hooks with `::part(...)` from the application or the form theme scope. Part names are public contracts; selectors must not target private descendants inside a component's Shadow DOM.

## Corner geometry rule

There is no shared `corner-shape` variable in the JB theme contract. `--jb-radius*` remains the available radius foundation. For JB Shadow DOM surfaces that need the application's squircle treatment, Theme Builder may emit documented `::part` rules such as:

```css
form[data-theme="..."] jb-input::part(input-box) {
  corner-shape: squircle;
  border-radius: var(--jb-radius);
}
```

The `border-radius` declaration is the progressive-enhancement fallback. App-owned Builder, Designer, and Preview surfaces may use `corner-shape: squircle` directly; this rule does not create or require a `--jb-corner-shape` token.

## Phase 2 boundaries discovered

- Global tokens are suitable for form-wide theme values.
- Component CSS properties and `::part` selectors are separate public styling surfaces and should not be collapsed into one undifferentiated token map.
- Derived input controls inherit the `jb-input` surface, so the schema should avoid duplicating inherited properties for every specialized input.
- Overlay and picker parts are available for styling, but their private descendants are not part of the contract.
- Runtime values such as callbacks, DOM factories, uploaded `File` objects, and generated CSS are not theme JSON values.
- The theme JSON schema and its relationship to the stable form document are defined in `THEME-SCHEMA.md`.

## Sources

- `node_modules/jb-core/theme/stories/colors.mdx`
- `node_modules/jb-core/theme/stories/sizes.mdx`
- `node_modules/jb-core/theme/lib/color/define-colors.ts`
- `node_modules/jb-core/theme/lib/sizes/index.ts`
- `node_modules/jb-*/web-component/custom-elements.json`
- `src/pages/form/_docs/COMPONENT-INVENTORY.md`
