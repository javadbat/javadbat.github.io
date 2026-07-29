# JB Form — Form-Element Component Inventory

Status: Initial input inventory complete; DSR-001, DSR-004, and renderer publication DSR-005 remain open; DSR-006 is closed
Reviewed: 2026-07-29  
Latest repository revision audited: [`8afc94a5cae5910c2dccab35c033d4d01150d27e`](https://github.com/javadbat/design-system/tree/8afc94a5cae5910c2dccab35c033d4d01150d27e)

## Sources

- [JB Design System package catalog](https://github.com/javadbat/design-system/blob/835fddf109e39c33ee7aecd0af6e4a0b4832ebda/config/package-list.ts)
- [Generated component list](https://github.com/javadbat/design-system/blob/835fddf109e39c33ee7aecd0af6e4a0b4832ebda/docs/component-list.md)
- [Form Elements overview](https://github.com/javadbat/design-system/blob/835fddf109e39c33ee7aecd0af6e4a0b4832ebda/docs/form-element.mdx)
- Each component's pinned source submodule, package manifest, React wrapper, README, stories, and current npm release.

The baseline package versions matched npm on 2026-07-28. The newer `jb-time-input@2.3.0`, `jb-file-input@3.3.0`, and `jb-switch@1.7.1` releases were audited on 2026-07-29. The latest design-system revision advances the time and file input gitlinks, but its switch gitlink is unreachable; see DSR-004.

## Scope rule

An addable Phase 1 JB Form item must be either:

- a value-producing form control intended to participate in `jb-form`; or
- an action control needed to operate the generated form.

Containers, validation foundations, embedded pickers, overlays, and editor-only controls are inventoried separately but are not addable form elements.

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

## Addable Phase 1 catalog

| Category | Component | Package/version | Value | Form contract | React |
| --- | --- | --- | --- | --- | --- |
| Text | Input | `jb-input@3.17.0` | `string` | Verified | Yes |
| Number | Number Input | `jb-number-input@1.6.0` | Numeric string | Inherited from `jb-input` | Yes |
| Text | Mobile Input | `jb-mobile-input@2.4.0` | Normalized mobile string | Inherited from `jb-input` | Yes |
| Text | Password Input | `jb-password-input@2.2.0` | `string` | Inherited from `jb-input` | Yes |
| Financial | Payment Input | `jb-payment-input@3.5.0` | Card/SHABA string | Inherited from `jb-input` | Yes |
| Identity | National ID Input | `jb-national-input@2.4.0` | National-code string | Inherited from `jb-input` | Yes |
| Date/time | Date Input | `jb-date-input@6.3.0` | `string`, `Date`, or timestamp-facing configuration | Verified | Yes |
| Date/time | Time Input | `jb-time-input@2.3.0` | Time string | Partial — DSR-001 | Yes |
| Text | PIN Input | `jb-pin-input@1.14.0` | `string` | Verified | Yes |
| Text | Textarea | `jb-textarea@3.13.1` | `string` | Verified | Yes |
| Choice | Select | `jb-select@7.4.3` | Generic value or array in multiple mode | Verified | Yes |
| Choice | Checkbox | `jb-checkbox@1.4.0` | `boolean` | Verified | Yes |
| Choice | Switch | `jb-switch@1.7.1` | `boolean` | Verified; DSR-003 resolved | Yes |
| File | File Input | `jb-file-input@3.3.0` | `File \| null` | Verified; DSR-002 resolved | Yes |
| File | Image Input | `jb-image-input@3.10.0` | Generic uploaded value or `null` | Verified | Yes |
| Action | Button | `jb-button@4.0.0` | None | Not a value control | Yes |

Total: 15 value-producing controls and 1 action control.

## Minimum builder configuration and public API

Every builder element receives a builder-owned stable `id`, ordered position, component type, schema version, registry icon, and generated non-empty `name`. The stable ID, position, type, schema version, and icon mapping are not component props; `name` is applied to the generated JB element.

### Mandatory name and icon rules

- Every addable value or action element must render with a non-empty `name` attribute.
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
| `jb-checkbox` | `name`, `label`, `message`, `value`, `initialValue`, `size`, `disabled`, `required`, declarative validation rules | `change`, `before-change` | Required and forced custom error |
| `jb-switch` | `name`, `value`, `initialValue`, `trueTitle`, `falseTitle`, `isLoading`, `disabled`, `required`, declarative validation rules | `load`, `init`, `change`, `before-change` | Required with native `valueMissing` mapping |
| `jb-file-input` | `name`, `acceptTypes`, `placeholderTitle`, upload presentation state, `required`, declarative validation rules; runtime `File` values are not builder configuration | `load`, `init`, `change`; web component also emits `delete` and `download` | Required; source contains a pending file-size validation TODO |
| `jb-image-input` | `name`, `label`, `message`, `value`, `initialValue`, `multiple`, `acceptTypes`, `maxFileSize`, serializable upload configuration, `required`, declarative validation rules | `load`, `init`, `change`, `imageSelected`, `maxSizeExceed` | Required and maximum file size |

### Action control

| Component | Minimum editable component configuration | Events |
| --- | --- | --- |
| `jb-button` | Content, `name`, `type`, `color`, `variant`, `size`, `isLoading`, `loadingText`, `disabled`, `square` | `click` |

Button variants:

- Colors: `primary`, `secondary`, `positive`, `danger`, `warning`, `light`, `dark`.
- Styles: `solid`, `outline`, `ghost`, `text`.
- Sizes: `xs`, `sm`, `md`, `lg`, `xl`.

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
| `jb-core@0.30.0` | Foundation | Theme, events, i18n, and React helpers |
| `jb-searchbar@3.1.0` | Data filtering control | Excluded from generated forms: it does not implement `JBFormInputStandards` and is cataloged as Data Display |

## Serialization constraints discovered

- Validator functions, custom DOM render callbacks, and upload/download bridge functions cannot be placed directly in JSON.
- `Date`, `File`, `HTMLElement`, `Map`, and callback values need a portable representation or must be excluded from form configuration.
- `jb-select` builder options must use JSON-safe values and declarative content; arbitrary `getContentDOM` and `getSelectedValueDOM` callbacks are runtime-only.
- `jb-image-input` needs a serializable adapter/configuration reference; its `bridge` functions remain runtime integration code.
- File and image runtime selections are form-response data, not builder configuration, and must not be exported as the form definition.
- Date defaults should be normalized to an agreed string or timestamp representation.

These constraints are inputs to the Form JSON Contract task. They do not authorize builder-only component workarounds.

## Design-system requests

Design-system requests found during inventory and technical-foundation review:

- DSR-001 — partially resolved in `jb-time-input@2.3.0`; `formDisabledCallback` and its acceptance coverage remain open.
- DSR-002 — resolved in `jb-file-input@3.3.0`.
- DSR-003 — resolved in `jb-switch@1.7.1`; the required rule now maps to `valueMissing`.
- DSR-004 — repair the unreachable `jb-switch` gitlink in the latest design-system repository revision.
- DSR-005 — publish `jb-form-builder`; a replaceable application-local renderer is approved for tests only.
- DSR-006 — closed for Phase 1; the application is client-only and uses one active `jb-core/i18n` locale per route page.

Full evidence, requested APIs, and acceptance criteria are in `DESIGN-SYSTEM-REQUESTS.md`.
