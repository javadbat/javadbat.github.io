# JB Form — Form-Element Component Inventory

Status: Inventory complete; all Form Builder design-system requests resolved or deferred outside current scope
Reviewed: 2026-08-27
Latest repository revision audited: [`8afc94a5cae5910c2dccab35c033d4d01150d27e`](https://github.com/javadbat/design-system/tree/8afc94a5cae5910c2dccab35c033d4d01150d27e)

## Sources

- [JB Design System package catalog](https://github.com/javadbat/design-system/blob/835fddf109e39c33ee7aecd0af6e4a0b4832ebda/config/package-list.ts)
- [Generated component list](https://github.com/javadbat/design-system/blob/835fddf109e39c33ee7aecd0af6e4a0b4832ebda/docs/component-list.md)
- [Form Elements overview](https://github.com/javadbat/design-system/blob/835fddf109e39c33ee7aecd0af6e4a0b4832ebda/docs/form-element.mdx)
- Each component's pinned source submodule, package manifest, React wrapper, README, stories, and current npm release.

The package versions were refreshed against npm on 2026-09-02. This inventory now follows the latest ranges in the repository manifests and records the current SSR/import audit separately from browser rendering coverage.

## Scope rule

An addable Phase 1 JB Form item must be either:

- a value-producing form control intended to participate in `jb-form`; or
- an action control needed to operate the generated form; or
- a structural container that owns an explicitly bounded child-element collection.

Validation foundations, embedded pickers, overlays, and editor-only controls are inventoried separately but are not addable form elements. `jb-tab` and `jb-condition` are addable structural containers; both are limited to one level and cannot contain another container.

## Shared contracts

### `JBFormInputStandards<TValue>`

The standard requires `disabled`, `required`, `name`, `value`, `id`, `isDirty`, `initialValue`, `form`, and `formResetCallback`, with optional form-associated and disabled/restoration callbacks.

The form builder will treat this contract as the minimum interoperability boundary for value-producing JB controls. It is required for reliable naming, value collection, initial values, dirty state, reset, form disabling, and nested `jb-form` behavior.

### `jb-validation`

Every addable value control exposes a `validation` helper or inherits it from `jb-input`. React wrappers accept `validationList` where supported. The helper supports:

- component-provided validation items;
- caller-provided synchronous or asynchronous validation items;
- sync checks through `checkValiditySync`;
- async checks through `checkValidity`;
- validation result and summary access;
- resetting displayed and stored validation results.

The exported form JSON cannot contain JavaScript validator functions. The JSON contract must therefore represent user-configured rules declaratively and map approved rule identifiers and parameters to runtime `ValidationItem` objects.

### `jb-input` inheritance

`jb-number-input`, `jb-mobile-input`, `jb-password-input`, `jb-payment-input`, and `jb-national-input` extend `JBInputWebComponent`. They inherit the `jb-input` value, form, dirty-state, validation, attributes, events, slots, parts, and base theme surface in addition to their specialized APIs.

## Current catalog

Four portable content blocks are implemented directly by the form document and renderer contract rather than as JB form-control packages:

- `text` — explanatory text;
- `image` — image content from a URL;
- `voice` — playable audio content from a URL;
- `link` — a link to a page or resource.

The remaining catalog entries are JB controls, an action, and structural containers:

| Category | Component | Package/version | Value | Form contract | React |
| --- | --- | --- | --- | --- | --- |
| Text | Input | `jb-input@3.19.0` | `string` | Verified against latest API | Yes |
| Number | Number Input | `jb-number-input@1.8.0` | Numeric string | Inherited from `jb-input` | Yes |
| Choice | Range Input | `jb-range-input@0.6.0` | Number or two-number tuple | Verified | Yes |
| Text | Mobile Input | `jb-mobile-input@2.5.0` | Normalized mobile string | Inherited from `jb-input` | Yes |
| Text | Password Input | `jb-password-input@2.4.0` | `string` | Inherited from `jb-input` | Yes |
| Financial | Payment Input | `jb-payment-input@3.6.0` | Card/SHABA string | Inherited from `jb-input` | Yes |
| Identity | National ID Input | `jb-national-input@2.5.0` | National-code string | Inherited from `jb-input` | Yes |
| Date/time | Date Input | `jb-date-input@6.5.0` | `string`, `Date`, or timestamp-facing configuration | Verified | Yes |
| Date/time | Time Input | `jb-time-input@2.5.0` | Time string | Verified | Yes |
| Text | PIN Input | `jb-pin-input@1.16.0` | `string` | Verified | Yes |
| Text | Textarea | `jb-textarea@3.14.0` | `string` | Verified | Yes |
| Choice | Select | `jb-select@8.1.1` | Generic value or array in multiple mode | Verified | Yes |
| Choice | Listbox | `jb-select/listbox@8.1.1` | Generic value or array in multiple mode | Verified | Yes |
| Choice | Checkbox | `jb-checkbox@2.0.0` | `boolean` | Verified | Yes |
| Choice | Switch | `jb-switch@1.8.0` | `boolean` | Verified; latest API | Yes |
| File | File Input | `jb-file-input@3.4.0` | `File \| null` | Verified; latest API | Yes |
| File | Image Input | `jb-image-input@4.0.0` | File or stored string value, or `null` | Verified | Yes |
| Action | Button | `jb-button@4.2.0` | None | Not a value control | Yes |
| Container | Tabs | `jb-tab@0.1.2` | None | Owns tab panels containing leaf elements | Yes |
| Container | Conditional container | `jb-condition@0.1.0` | None | Shows an ordered child list when portable field-name rules match | Web component |
| Workflow container | Wizard | `jb-form-wizard@0.1.0` | None | Owns ordered steps, validates the active step before forward navigation, and emits navigation/completion events | Web component |

Total: 25 catalog entries — 4 portable content blocks, 17 value-producing controls, 1 action control, and 3 structural/workflow containers.

## Minimum builder configuration and public API

Every builder element receives a builder-owned stable `id`, ordered position, component type, schema version, registry icon, and generated non-empty `name`. The stable ID, position, type, schema version, and icon mapping are not component props; `name` is applied to the generated JB element.

### Mandatory name and icon rules

- Every addable value or action element must render with a non-empty `name` attribute.
- Structural containers keep a non-empty portable builder name for identity and configuration, but do not emit it as a form-control `name` attribute.
- The registry provides a valid default name for Add. Duplicate preserves the source name by default and receives a new element ID.
- Missing or invalid name blocks Preview and export.
- Names must be non-empty and syntactically valid. Repeated names are supported because `jb-form` returns an array when multiple controls share a name.
- The JSON contract defines character, normalization, length, and suffix rules.
- Every catalog and canvas-list entry maps to a proper semantic icon, preferring an existing JB asset and otherwise using a locally designed catalog icon.
- Icons supplement visible component names and include correct decorative/accessible treatment.
- Emoji, Unicode text symbols, third-party icon packages, CSS drawings, and ad hoc inline SVGs are not permitted; approved repository-owned catalog SVG assets are allowed.
- If no suitable JB icon exists, design a consistent repository-owned SVG under the approved catalog-icon standard.

### Input family

| Component | Minimum editable component configuration | React events | Built-in validation |
| --- | --- | --- | --- |
| `jb-input` | `name`, `label`, `message`, `placeholder`, `size`, `type`, `inputmode`, `autocomplete`, `value`, `initialValue`, `disabled`, `required`, declarative validation rules | `change`, `input`, `beforeinput`, `focus`, `blur`, `keyup`, `keydown`, `enter` | Required and forced custom error |
| `jb-number-input` | All input configuration plus `minValue`, `maxValue`, `acceptNegative`, `decimalPrecision`, `showThousandSeparator`, `thousandSeparator`, `step`, `showPersianNumber`, `showControlButton` | Inherits input events | Numeric-format rule plus inherited rules; min/max are not separate `jb-validation` states in the reviewed source |
| `jb-mobile-input` | All input configuration | Inherits input events | Mobile-number format plus inherited rules |
| `jb-password-input` | All input configuration plus `minLength` | Inherits input events | Minimum length plus inherited rules |
| `jb-payment-input` | All input configuration plus `inputType` (`CARD` or `SHABA`) and `separator` | Inherits input events | Card length, SHABA length/format, plus inherited rules |
| `jb-national-input` | All input configuration | Inherits input events | Iranian national-code validity plus inherited rules |

Common input-family styling:

- Slots: `start-section`, `end-section`.
- Parts: `input`, `input-box`, `label`, `message`.
- Base theme namespace: `--jb-input-*` with size variants `xs`, `sm`, `md`, `lg`, and `xl`.
- Specialized namespaces: `--jb-number-input-*`, `--jb-mobile-input-*`, `--jb-password-input-*`, `--jb-payment-input-*`, and `--jb-national-input-*`.

### Standalone value controls

| Component | Minimum editable component configuration | React events | Built-in validation |
| --- | --- | --- | --- |
| `jb-date-input` | `name`, `label`, `message`, `placeholder`, `value`, `initialValue`, `inputType`, `valueType`, `format`, `min`, `max`, `direction`, `showPersianNumber`, calendar default view/month lists, `required`, declarative validation rules | `load`, `init`, `invalid`, `change`, `input`, `beforeinput`, keyboard events, `select`, `enter`, `focus`, `blur` | Required, forced custom error, range underflow/overflow, date validity |
| `jb-time-input` | `name`, `label`, `message`, `placeholder`, `value`, `initialValue`, `secondEnabled`, `frontalZero`, `optionalUnits`, `showPersianNumber`, `closeButtonText`, `required`, `disabled`, declarative validation rules | `load`, `init`, `change`, `input`, `beforeinput`, keyboard events, `enter`, `focus`, `blur` | Required, forced custom error, complete-time format |
| `jb-pin-input` | `name`, `label`, `message`, `value`, `initialValue`, `charLength`, `inputmode`, `autofocus`, `disabled`, `required`, declarative validation rules | `change`, `input`, `beforeinput`, keyboard events, `enter`, `focus`, `blur`, `complete` | Required and forced custom error |
| `jb-textarea` | `name`, `label`, `message`, `placeholder`, `value`, `initialValue`, `autoHeight`, `disabled`, `required`, declarative validation rules | `load`, `init`, `change`, `input`, `beforeinput`, keyboard events, `enter`, `focus`, `blur` | Required and forced custom error |
| `jb-select` | `name`, `label`, `message`, `placeholder`, `searchPlaceholder`, `value`, `initialValue`, `multiple`, `size`, `popoverPosition`, `hideClear`, `disabled`, `required`, declarative option list and validation rules | `load`, `init`, `change`, `input`, `keyup`; web component also emits `filter-change` | Required and forced custom error |
| `jb-listbox` | `name`, `label`, `message`, `value`, `initialValue`, `multiple`, `useCheckbox`, `disabled`, `required`, declarative option list and validation rules | `load`, `init`, `change`, `input`, `invalid`; options respond to `filter-change` | Required and forced custom error |
| `jb-checkbox` | `name`, `label`, `message`, `value`, `initialValue`, `size`, `variant`, `color`, `disabled`, `required`, declarative validation rules | `change`, `before-change` | Required and forced custom error |
| `jb-switch` | `name`, `value`, `initialValue`, `trueTitle`, `falseTitle`, `isLoading`, `disabled`, `required`, declarative validation rules | `load`, `init`, `change`, `before-change` | Required with native `valueMissing` mapping |
| `jb-file-input` | `name`, `label`, `message`, `acceptTypes`, `maxSize` (KB), optional upload endpoint, `required`; runtime `File` values are not builder configuration | `load`, `init`, `change`; web component also emits `delete` and `download`; builder emits cancelable `file-upload` | Required and maximum file size |
| `jb-image-input` | `name`, `label`, `message`, `value`, `initialValue`, `multiple`, `acceptTypes`, `maxFileSize`, upload endpoint, `uploading`, `uploadPercent`, `required`, declarative validation rules | `load`, `init`, `change`, `imageSelected`, `maxSizeExceed`, `download-start`, `invalid`; builder emits cancelable `file-upload` | Required and maximum file size |

### Action control

| Component | Minimum editable component configuration | Events |
| --- | --- | --- |
| `jb-button` | Content, `name`, `type`, `color`, `variant`, `size`, `isLoading`, `loadingText`, `disabled`, `square` | `click` |

Button variants:

- Colors: `primary`, `secondary`, `positive`, `danger`, `warning`, `light`, `dark`.
- Styles: `solid`, `outline`, `ghost`, `text`.
- Sizes: `xs`, `sm`, `md`, `lg`, `xl`.

### Structural container

| Component | Minimum editable container configuration | Events |
| --- | --- | --- |
| `jb-tab` | `orientation`, `size`, `nullable`, initially active tab, accessible list label, validation scope; ordered tabs with stable value, localized label, disabled state, indicator color, and ordered leaf children | `change`; triggers emit `select` |
| `jb-condition` | `all`/`any` matching; ordered rules with field name, operator, and portable comparison value; ordered leaf children | `condition-change` |

The builder treats `jb-tab`, `jb-tab-list`, `jb-tab-trigger`, and `jb-tab-content` as one catalog component. It renders the package's required light-DOM composition and keeps triggers as direct list children. The independent `<jb-condition>` component receives the complete `jb-form` value object and conditionally connects its slot content while preserving hidden control state. Nested containers are forbidden for both container types.

## Slots, parts, and styling-hook coverage

CSS-variable counts include component variables, compatibility aliases, and referenced shared theme tokens. Counts are recorded as a change-detection aid; the builder should consume semantic JB theme variables rather than copy component CSS.

| Component | Slots | Exported parts | CSS-variable declarations |
| --- | --- | --- | ---: |
| `jb-input` | `start-section`, `end-section` | `input`, `input-box`, `label`, `message` | 127 |
| `jb-number-input` | Inherits input slots | Inherits input parts | 41 specialized + inherited |
| `jb-mobile-input` | Inherits input slots | Inherits input parts | 3 specialized + inherited |
| `jb-password-input` | Inherits input slots | Inherits input parts | 9 specialized + inherited |
| `jb-payment-input` | Inherits input slots | Inherits input parts | 6 specialized + inherited |
| `jb-national-input` | Inherits input slots | Inherits input parts | 3 specialized + inherited |
| `jb-date-input` | `calendar-trigger-icon`, `inline-start-section`, `inline-end-section` | `jb-input`, `calendar`, `popover` | 43 |
| `jb-time-input` | None | `wrapper`, `input`, `popover`, `time-picker`, `close-button` | 32 |
| `jb-pin-input` | None | `pin-input`, `input-wrapper`, `inputs-wrapper`, `message` | 59 |
| `jb-textarea` | `block-start-section`, `block-end-section`, `inline-start-section`, `inline-end-section` | `component`, `textarea-box`, `textarea`, slot wrappers, `label`, `message` | 137 |
| `jb-select` | Default options, `empty-list-message`, `select-arrow-icon`, `start-section` | `arrow-icon`, `clear-button`, `popover`, `search-input`, `selected-value`, option `color-box` | 188 |
| `jb-listbox` | Default options | `wrapper`, `label`, `list`, `message`, option `color-box` | 18 |
| `jb-checkbox` | `label` | `checkbox`, `check-bg`, `check-mark`, `label`, `message` | 63 |
| `jb-switch` | None | `component`, `switch`, `bar`, `trigger`, `trigger-button`, `trigger-ring`, `svg-wrapper`, `true-text`, `false-text` | 62 |
| `jb-file-input` | Default, `file-icon`, `overlay-content`, `placeholder`, `placeholder-icon`, `upload`, `uploader-icon` | `file-name`, `loading`, `placeholder-title`, `upload-loading`, `uploading-title` | 103 |
| `jb-image-input` | Default, `overlay-content`, `placeholder` | `message` | 66 |
| `jb-button` | Default content | None | 173 |

## Supporting, embedded, and excluded components

| Package/version | Classification | Form-builder treatment |
| --- | --- | --- |
| `jb-form@0.12.0` | Form container | Root generated-form container; not user-addable |
| `jb-validation@1.0.0` | Validation foundation | Converts declarative builder rules to runtime validation items |
| `jb-calendar@5.2.0` | Embedded picker | Used through `jb-date-input`; not a standalone form value control |
| `jb-time-picker@2.4.0` | Embedded picker | Used through `jb-time-input`; not a standalone form value control |
| `jb-popover@1.13.0` | Overlay dependency | Used by select/date/time controls and editor surfaces; not addable |
| `jb-core@0.36.0` | Foundation | Theme, events, SSR-safe i18n, and React helpers |
| `jb-searchbar@3.4.0` | Data filtering control | Excluded from generated forms: it does not implement `JBFormInputStandards` and is cataloged as Data Display |

## Serialization constraints discovered

- Validator functions, custom DOM render callbacks, and upload/download bridge functions cannot be placed directly in JSON.
- `Date`, `File`, `HTMLElement`, `Map`, and callback values need a portable representation or must be excluded from form configuration.
- `jb-select` and `jb-listbox` builder options must use JSON-safe values and declarative content; arbitrary DOM callbacks remain runtime-only.
- `jb-image-input` needs a serializable adapter/configuration reference; its `bridge` functions remain runtime integration code.
- File and image runtime selections are form-response data, not builder configuration, and must not be exported as the form definition.
- Date defaults should be normalized to an agreed string or timestamp representation.

These constraints are inputs to the Form JSON Contract task. They do not authorize builder-only component workarounds.

## Design-system requests

Design-system requests found during inventory and technical-foundation review:

- DSR-001 — resolved in `jb-time-input@2.4.0`; the complete form-associated contract, including `formDisabledCallback`, is available. Integration acceptance coverage remains part of the form-builder verification work.
- DSR-002 — resolved in `jb-file-input@3.3.0`.
- DSR-003 — resolved in `jb-switch@1.7.3`; the required rule now maps to `valueMissing`.
- DSR-004 — resolved after the `jb-switch` source reference was updated.
- DSR-006 — closed for Phase 1; the application is client-only and uses one active `jb-core/i18n` locale per route page.

Full evidence, requested APIs, and acceptance criteria are in `DESIGN-SYSTEM-REQUESTS.md`.
