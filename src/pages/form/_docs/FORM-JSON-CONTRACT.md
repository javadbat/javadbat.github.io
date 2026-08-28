# JB Form — Version 1 JSON Contract

Status: Approved for Phase 1  
Document schema version: `1`  
JSON Schema: `schema/v1/form-document.schema.json`  
TypeScript: `schema/v1/form-document.types.ts`  
Reviewed validation source: `jb-validation@1.0.0`

## Purpose

The form document is the portable source of truth shared by Builder, IndexedDB records, JSON export, and `<jb-form-builder>`. It describes form identity, localization, ordered elements, component properties, and declarative validation without storing editor state, route state, executable code, or Preview response values.

## Contract principles

- JSON-only: strings, numbers, booleans, null, arrays, and objects.
- Stable form and element UUIDs.
- Human-readable, deterministic export.
- Non-empty element names. Repeated names are allowed intentionally so `jb-form` can collect grouped values as arrays.
- Ordered top-level elements plus one-level structural containers.
- Component-specific properties stay inside `props`.
- Localizable strings use locale-keyed values from version 1.
- Validation uses approved declarative rule IDs, including portable regular expressions; no user-provided JavaScript functions.
- Runtime packages, icons, editor selection, IndexedDB metadata, and Preview responses are not portable document data.
- Unknown newer documents are preserved and never silently rewritten.

## Canonical document shape

```json
{
  "$schema": "https://javadbat.github.io/schemas/jb-form/v1.json",
  "schemaVersion": 1,
  "id": "7933ad60-0ccf-4ad5-b6ef-4e62d587b7e5",
  "slug": "customer-registration",
  "metadata": {
    "name": {
      "translations": {
        "en": "Customer registration"
      }
    },
    "description": {
      "translations": {
        "en": "Collect customer account information."
      }
    },
    "createdAt": "2026-07-29T12:00:00.000Z",
    "updatedAt": "2026-07-29T12:00:00.000Z"
  },
  "localization": {
    "defaultLocale": "en",
    "locales": {
      "en": {
        "direction": "ltr"
      }
    }
  },
  "elements": [],
  "theme": null
}
```

## Top-level fields

| Field | Required | Meaning |
| --- | --- | --- |
| `$schema` | Yes | Stable published schema URL for tooling. |
| `schemaVersion` | Yes | Integer document migration version. Version 1 is `1`. |
| `id` | Yes | Stable UUID for the portable form identity. |
| `slug` | No | Route-safe unique slug for a named form. Unnamed working drafts omit it. |
| `metadata` | Yes | Localized display metadata and portable timestamps. |
| `localization` | Yes | Default locale and supported locale/direction declarations. |
| `elements` | Yes | Ordered top-level leaf/container array. Container-owned child arrays preserve their own form order. |
| `theme` | Yes | Version 1 legacy field; it must be `null`. ThemeConfig is a separate portable config. |

Top-level unknown fields are rejected in version 1.

## Identity

### Form and element IDs

- IDs are RFC 4122 UUID strings generated with `crypto.randomUUID()`.
- IDs never depend on name, slug, position, or locale.
- Reordering preserves element IDs.
- Duplicate generates a new element ID.
- Save As in the Builder creates a new IndexedDB form with a new form ID and slug while preserving the copied elements and their IDs.
- Exporting or downloading another file preserves the document ID; file export is not an IndexedDB Save As operation.
- Import collision behavior is defined in Phase 2.

### Element names

Version 1 syntax:

```text
^[A-Za-z][A-Za-z0-9_-]{0,63}$
```

Rules:

- required on every element, including `jb-button`;
- stable across reorder;
- Duplicate preserves the name by default so repeated controls can intentionally collect an array, such as a list of phone numbers;
- changing component type does not silently change a user-edited name;
- missing or syntactically invalid names block Save, Preview, and export;
- duplicate names do not block Save, Preview, or export;
- one occurrence produces the component's scalar value, while repeated occurrences are collected by `jb-form` as an array under that name;
- display labels may be Persian or any supported language; machine-facing names remain portable ASCII identifiers.

### Slugs

Version 1 syntax:

```text
^[a-z0-9]+(?:-[a-z0-9]+)*$
```

Rules:

- maximum 80 characters;
- unique among named-form records in the local IndexedDB database;
- generated when the user first saves a named form;
- based on the form's default-locale name when possible, with collision suffixes;
- does not change automatically when the display name changes;
- may be changed explicitly after collision validation;
- omitted from an unnamed current draft;
- unknown slug routes never fall back to a different document.

## Metadata

`metadata.name` is required and localizable. An unnamed Builder draft uses an English default such as `Untitled form`; this is a display value and does not create a named-form record.

`metadata.description` is optional.

`createdAt` and `updatedAt` are ISO 8601 UTC strings. They describe the portable document. IndexedDB record timestamps remain separate storage metadata and may differ after migration or recovery.

## Localization

### Locale declaration

```json
{
  "defaultLocale": "en",
  "locales": {
    "en": {
      "direction": "ltr"
    },
    "fa": {
      "direction": "rtl"
    }
  }
}
```

- Locale keys use canonical BCP 47-style tags.
- English (`en`) is the default for new forms.
- LTR is the default direction.
- Every translation key must exist in `localization.locales`.
- `defaultLocale` must exist in `localization.locales`.
- Phase 2 Builder editing selects any declared locale, preserves other locale entries, and writes localized values under the active content locale.
- The Builder supports locale management, explicit direction configuration, and fallback resolution without changing stable form or element identities.
- `<jb-form-builder>` uses `jb-core/i18n` and the selected/default locale to resolve text.

### Localized text

Every localizable property uses:

```json
{
  "translations": {
    "en": "Full name",
    "fa": "نام کامل"
  }
}
```

Resolution:

1. requested locale;
2. form `defaultLocale`;
3. first available translation;
4. empty string only when the component property permits it.

Version 1 does not store executable translation functions or UI dictionary references.

Typical localized component properties include:

- form name and description;
- label;
- message/help text;
- placeholder;
- button content and loading text;
- select option labels;
- switch true/false titles;
- file/image placeholder text;
- validation messages.

## Element structure

```json
{
  "id": "c069817a-f3d3-4941-b2ea-3900908b80ab",
  "type": "jb-input",
  "adapterVersion": 1,
  "name": "fullName",
  "required": true,
  "disabled": false,
  "initialValue": "",
  "label": {
    "translations": {
      "en": "Full name"
    }
  },
  "placeholder": {
    "translations": {
      "en": "Enter your full name"
    }
  },
  "props": {
    "size": "md",
    "type": "text"
  },
  "validation": [
    {
      "id": "20f45ee7-e281-4f0a-a17d-6876a854544f",
      "rule": "minLength",
      "params": {
        "value": 3
      },
      "message": {
        "translations": {
          "en": "Enter at least 3 characters."
        }
      }
    }
  ]
}
```

### Common element fields

| Field | Required | Meaning |
| --- | --- | --- |
| `id` | Yes | Stable UUID. |
| `type` | Yes | Registry component key/tag from the approved catalog. |
| `adapterVersion` | Yes | Version of the component JSON adapter, starting at `1`. |
| `name` | Yes | Non-empty `jb-form` collection key. Repeated names intentionally create array values. |
| `required` | No | Whether a value is required. Omitted means `false`; fields are optional by default. |
| `disabled` | No | Whether the element is disabled. Omitted means `false`. |
| `initialValue` | No | JSON-safe initial value. Omission means the component's empty/default value. |
| `label` | No | Localized common label when the component supports one. |
| `placeholder` | No | Localized common placeholder when the component supports one. |
| `props` | Yes | JSON-safe component-specific configuration. |
| `validation` | Yes | User-configured declarative rules; empty array when none. |

Element order is represented only by array order. Version 1 has no row, column, span, or responsive layout fields.

The registry declares whether `label`, `placeholder`, `initialValue`, `required`, and `disabled` apply to a component and maps supported fields to the component API. Unsupported common fields are rejected for that component rather than silently ignored.

### Structural container elements

Containers are a first-class registry family alongside `content` and `field`; structural children are never hidden inside generic `props`. Version 1 supports `jb-tab` and `jb-condition` as one-level containers. Their children may contain content, fields, and actions, but may not contain another container.

```json
{
  "id": "a8012254-f5a4-4ec0-9f06-8fd98370b3ac",
  "type": "jb-tab",
  "adapterVersion": 1,
  "name": "audienceTabs",
  "props": {
    "orientation": "horizontal",
    "size": "md",
    "nullable": false,
    "defaultValue": "female",
    "ariaLabel": { "translations": { "en": "Audience" } }
  },
  "validation": [],
  "validationScope": "all",
  "tabs": [
    {
      "id": "8bf5fd11-e8a8-43fd-948f-22ea3170dd3f",
      "value": "female",
      "label": { "translations": { "en": "Female" } },
      "disabled": false,
      "color": "primary",
      "children": []
    }
  ]
}
```

A conditional container stores portable field-name rules and one ordered child list:

```json
{
  "id": "ca64a580-c4b8-4c9d-b3a3-e4a42d945967",
  "type": "jb-condition",
  "adapterVersion": 1,
  "name": "adultDetails",
  "props": {},
  "validation": [],
  "conditions": {
    "match": "all",
    "rules": [
      {
        "id": "42fc807c-b8ee-48bf-8319-8dbbd1ea7fcf",
        "fieldName": "age",
        "operator": "greaterThanOrEqual",
        "value": "18"
      }
    ]
  },
  "children": []
}
```

Container rules:

- Every container has a stable builder-owned `id` and `name`, but its name is not emitted as a form-control `name` attribute.
- Every tab has a stable UUID, unique developer-facing `value`, localized `label`, `disabled` state, optional indicator `color`, and ordered `children`.
- `validationScope: "all"` is the default and validates/collects fields in every panel.
- `validationScope: "active"` disables inactive-panel controls at runtime so only the selected panel participates in validation and value collection.
- A non-nullable container must have at least one enabled tab, and `props.defaultValue` must reference an existing tab value.
- Conditional rules reference `jb-form` values by field `name`; fields inside tabs are valid sources.
- `match: "all"` requires every rule and `match: "any"` requires at least one rule. An empty rule list is always visible.
- Supported operators are `equals`, `notEquals`, `isEmpty`, `isNotEmpty`, `contains`, `notContains`, `containsAny`, `containsAll`, `greaterThan`, `greaterThanOrEqual`, `lessThan`, and `lessThanOrEqual`.
- A conditional container cannot reference one of its own child fields, and conditional-container dependency cycles are invalid.
- When unmatched, `<jb-condition>` disconnects its children from `jb-form` but preserves their runtime state for the next match.

### Registry boundary

The structural JSON Schema validates the shared envelope and JSON-safe values. The component registry performs a second validation layer keyed by `type` and `adapterVersion`:

- allowed and required properties;
- property value types and enums;
- localizable versus non-localizable properties;
- default values;
- validation-rule compatibility;
- serialization normalization;
- component package/tag mapping;
- icon mapping.

Unknown props are rejected by registry validation even though the shared schema permits JSON-safe values inside `props`.

This keeps the top-level document stable while component adapters evolve independently.

### Values that are not portable props

The following are prohibited as direct JSON values:

- functions and callbacks;
- `RegExp` objects;
- `Date`, `File`, `Blob`, `HTMLElement`, and `Map` instances;
- React nodes or render callbacks;
- open popover/modal state;
- validation display results;
- selected files/images from a user response;
- editor selection and panel state;
- MobX observables or proxies.

Portable replacements:

- dates/times use normalized strings defined by their adapter;
- regex uses a `pattern` validation rule with JSON-safe `source` and `flags`, then compiles to `RegExp` in the trusted renderer;
- upload/download integration uses a serializable adapter identifier/configuration;
- select options use JSON-safe IDs, values, and localized labels;
- runtime files and response values remain outside the form document.

## Declarative validation

### Why validation is compiled

`jb-validation@1.0.0` runtime `ValidationItem` supports:

- optional `key`;
- a `RegExp` or validator function;
- message;
- optional native `stateType`;
- optional deferred execution.

Functions, promises, and `RegExp` objects are not portable JSON. Version 1 accepts regular-expression validation by storing its `source` and `flags`. The trusted registry/compiler creates the runtime `RegExp` and `ValidationItem`. User-provided JavaScript validator functions are rejected.

### Version 1 rule shape

```json
{
  "id": "20f45ee7-e281-4f0a-a17d-6876a854544f",
  "rule": "pattern",
  "params": {
    "source": "^[A-Za-z ]+$",
    "flags": "u"
  },
  "message": {
    "translations": {
      "en": "Use letters and spaces only."
    }
  }
}
```

The rule `id` becomes the runtime validation `key`. Users do not set `stateType`; the compiler owns native validity mapping.

### Initial approved rule registry

| Rule | Parameters | Runtime native state | Compatibility |
| --- | --- | --- | --- |
| `minLength` | `{ "value": integer >= 0 }` | `tooShort` | String-like values |
| `maxLength` | `{ "value": integer >= 0 }` | `tooLong` | String-like values |
| `pattern` | `{ "source": string, "flags": string }` | `patternMismatch` | Values with a stable string representation |
| `minValue` | `{ "value": number }` | `rangeUnderflow` | Numeric adapters |
| `maxValue` | `{ "value": number }` | `rangeOverflow` | Numeric adapters |
| `allowedValues` | `{ "values": scalar[] }` | `customError` | Scalar choice/text adapters |

Rules:

- `required` remains an optional common element field and built-in component validation; omission means `false`, and it is not duplicated in the validation array.
- Component-specific built-in rules remain component props, such as date min/max or image maximum size.
- Pattern source is limited to 256 characters.
- Phase 1 pattern flags are limited to `i`, `m`, `s`, and `u`, without duplicates.
- Invalid regex compilation makes the document invalid.
- A rule is offered only when its component adapter declares compatibility.
- Rule order is evaluation/display order.
- User-provided functions, async validators, server calls, and external-schema callbacks are not supported in version 1.
- Regular-expression validation is supported through JSON-safe `source` and `flags`.
- Future portable rule types require a schema/registry addition and migration policy.

### Compiler mapping

Given:

```json
{
  "id": "20f45ee7-e281-4f0a-a17d-6876a854544f",
  "rule": "minLength",
  "params": {
    "value": 3
  },
  "message": {
    "translations": {
      "en": "Enter at least 3 characters."
    }
  }
}
```

The runtime adapter creates the equivalent of:

```ts
{
  key: "20f45ee7-e281-4f0a-a17d-6876a854544f",
  validator: (value) => value.length >= 3,
  message: resolveLocalizedText(message, locale),
  stateType: "tooShort"
}
```

The function exists only at runtime inside the trusted rule registry.

## Component types

Version 1 supports these registry keys:

- `text` (localized static text)
- `image` (URL and localized alternative text)
- `voice` (audio URL)
- `jb-input`
- `jb-number-input`
- `jb-range-input`
- `jb-mobile-input`
- `jb-password-input`
- `jb-payment-input`
- `jb-national-input`
- `jb-date-input`
- `jb-time-input`
- `jb-pin-input`
- `jb-textarea`
- `jb-select`
- `jb-listbox`
- `jb-checkbox`
- `jb-switch`
- `jb-file-input`
- `jb-image-input`
- `jb-button`
- `jb-tab`
- `jb-condition`

Adding a new type requires a registry adapter and a schema enum update. Existing documents remain valid.

## Theme boundary

Phase 1 exports:

```json
{
  "theme": null
}
```

`null` means use the default JB theme in FormConfig v1. A future form schema version removes this legacy field instead of promoting it to an object. The standalone ThemeConfig defined by `THEME-SCHEMA.md` is supplied separately to the renderer. Form export never embeds it, and no Phase 1 element property is reinterpreted as theme data.

## Portable document versus IndexedDB record

The exported form document does not include:

- builder application version;
- current-draft key;
- linked named-form state;
- unsaved/saving status;
- migration backup;
- last-opened route;
- editor locale/panel preferences.

IndexedDB stores a separate envelope:

```json
{
  "recordVersion": 1,
  "builderVersion": "0.1.0",
  "recordKind": "named",
  "id": "7933ad60-0ccf-4ad5-b6ef-4e62d587b7e5",
  "slug": "customer-registration",
  "updatedAt": "2026-07-29T12:00:00.000Z",
  "document": {}
}
```

The persistence step finalizes store names, indexes, draft keys, and transactional behavior. Indexed projections such as ID and slug must match the contained document.

## Deterministic export

Canonical key order:

1. `$schema`
2. `schemaVersion`
3. `id`
4. `slug` when present
5. `metadata`
6. `localization`
7. `elements`
8. `theme`

Within each element:

1. `id`
2. `type`
3. `adapterVersion`
4. `name`
5. `required` when present
6. `disabled` when present
7. `initialValue` when present
8. `label` when present
9. `placeholder` when present
10. `props`
11. `validation`
12. `validationScope` and `tabs` for `jb-tab`, or `conditions` and `children` for `jb-condition`

Export:

- uses UTF-8;
- uses two-space indentation;
- ends with one newline;
- preserves element and validation array order;
- sorts unordered translation, locale, and prop keys lexicographically;
- rejects non-finite numbers;
- validates structural and registry rules before download.

Filename:

```text
{slug-or-untitled-form}.jb-form.json
```

## Versioning and migration

### Form document version

- `schemaVersion` is a positive integer.
- Any incompatible field meaning/type change increments it.
- Additive registry prop support may use `adapterVersion` without changing the document envelope version.
- A document migration is a pure function from one version to the next.
- Migrations run sequentially; no skipped transformations.
- Before overwriting IndexedDB data, preserve the original record as recovery data.
- Migration preserves form ID, element IDs, names, translations, and unknown future locale values whenever possible.
- A failed migration leaves the source untouched.
- A newer unsupported version opens in recovery/read-only mode and may be exported unchanged.

### Adapter version

- Each element starts with `adapterVersion: 1`.
- A component adapter version changes when serialized prop meaning or normalization changes.
- Renderer supports known adapter migrations before rendering.
- Unknown newer adapter versions isolate the affected element and invalidate Preview/export rather than guessing.

### Builder version

Builder application version belongs to the IndexedDB envelope, not the portable document schema. Application/storage migrations and form-document migrations remain independent.

## Validation layers

1. JSON parsing.
2. Structural JSON Schema.
3. Semantic document validation:
   - unique form/element IDs, including elements inside containers;
   - unique tab IDs and values within each tab container;
   - valid default-tab references and at least one enabled tab when non-nullable;
   - valid conditional field references, required comparison values, unique rule IDs, and acyclic dependencies;
   - one-level-only container depth;
   - non-empty, syntactically valid element names;
   - default locale exists;
   - translation locale keys are declared;
   - slug/storage consistency.
4. Component registry validation for `props`.
5. Validation-rule compatibility and regex compilation.
6. Renderer preflight.

All layers return stable issue objects containing:

```json
{
  "code": "invalid_element_name",
  "path": "/elements/2/name",
  "message": "Element name must use the supported portable syntax.",
  "elementId": "optional-element-uuid"
}
```

Localized user-facing messages are resolved by the UI; stable issue codes remain language-independent.

## Fixture set

| Fixture | Purpose |
| --- | --- |
| `fixtures/v1/valid-minimal.json` | Empty English/LTR form. |
| `fixtures/v1/valid-complex.json` | Multiple element types, localized text, options, validation, and submit button. |
| `fixtures/v1/valid-repeated-name.json` | Repeated phone-number name demonstrating intentional `jb-form` array collection. |
| `fixtures/v1/invalid-missing-name.json` | Structural failure: element name omitted. |

## Owner approval

Approved for Phase 1:

- ASCII element-name syntax and 64-character limit.
- Slug syntax, maximum 80 characters, stable-on-rename behavior, and explicit slug editing.
- Locale-keyed `translations` objects and the documented resolution order.
- `theme: null` remains the version 1 legacy field; a future form schema removes it and keeps ThemeConfig separate.
- The initial six declarative validation rules, JSON-safe regex representation, and exclusion of user-provided/async functions.
- Export filename `{slug-or-untitled-form}.jb-form.json`.
- Builder Save As creates a new IndexedDB form ID and slug while preserving copied element IDs. Exporting another file preserves all document IDs.
