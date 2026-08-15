# JB Design System changes required by `jb-form-builder`

Status: local integration renderer implemented; design-system publication work remains  
Local baseline: `jb-core@0.33.0`, `jb-form@0.12.0`, and the form-package versions installed by this repository

## Purpose

The application-local `<jb-form-builder>` proves the JSON renderer contract before it is published as a JB Design System package. The local component is deliberately split into concern modules and has no route, IndexedDB, Builder-store, or application-shell dependency.

The published component should retain this public behavior:

- accept a portable form document through the `formDocument` property;
- render the document inside `jb-form`;
- expose value, reset, synchronous validity, and asynchronous validity APIs;
- preserve repeated names;
- lazy-load only used JB packages when `autoImport` is enabled;
- perform no JB component imports when `autoImport` is disabled;
- provide the `jb-form-builder/react` wrapper as a separate export;
- expose typed renderer events and stable Shadow DOM parts.

## Delivery split

The design-system changes below have two delivery windows. The first is required for the current client-only form builder. The second is deliberately deferred until the application needs server-compatible module evaluation or simultaneous locale scopes.

### Phase 1 — client-only requirements (do now)

- Standardize idempotent, dependency-controlled custom-element registration (Phase 1 requirement 1 below).
- Preserve portable declarative validation and complete `jb-time-input` form standards (Phase 1 requirements 5–6 below).

These requirements are browser-facing and remain mandatory even though the route does not render on a server. The renderer package will be published as the final delivery step after implementation and verification are complete.

### Deferred — SSR/platform compatibility (do later)

- Make every JB package importable when browser globals are absent (Deferred SSR requirement 1 below).
- Add scoped locale providers for simultaneously rendered locale scopes (Deferred SSR requirement 2 below). DOM-free construction and explicit subscriptions shipped in `jb-core@0.33.0`.

The deferred work must preserve the existing browser auto-registration behavior and the portable form JSON contract. It is not a Phase 1 blocker, but it becomes required before this renderer is imported or evaluated in an SSR process.

## Deferred SSR requirement 1 — Make JB package imports safe outside a browser

### Current limitation

Representative direct Node imports currently fail:

```text
jb-form: ReferenceError: HTMLElement is not defined
jb-input: ReferenceError: document is not defined
jb-select: ReferenceError: document is not defined
jb-date-input: ReferenceError: document is not defined
```

Phase 1 routes are client-only, so this does not block the application. The local renderer contains a guarded custom-element base and keeps all JB component imports inside its client render pipeline. This is preparation for SSR-safe module evaluation, not a claim that the current JB packages can render on a server.

### Required standard

Every JB package should be importable when these globals are absent:

- `window`;
- `document`;
- `HTMLElement`;
- `customElements`;
- `MutationObserver`;
- `ElementInternals`.

Import safety does not mean server rendering the control. It only means module evaluation must not throw.

### Requested implementation

- Move DOM construction out of module scope.
- Do not instantiate browser observers or global stores during module evaluation.
- Guard automatic registration with `typeof globalThis.customElements !== "undefined"`.
- Make registration idempotent with `customElements.get(tagName)`.
- Either create the `HTMLElement` subclass only inside a browser registration function or expose separate browser and platform-neutral entries.
- Keep the current browser auto-registration entry for backward compatibility.
- Add an explicit `define...()` export for applications that control registration.

Suggested entry structure:

```text
package/
├─ core        platform-neutral types and logic
├─ element     browser class factory
├─ define      guarded, idempotent registration
└─ index       browser-friendly auto-registration
```

### Acceptance tests

Run each published form package in a Node environment without DOM shims:

```ts
await import("jb-form");
await import("jb-input");
await import("jb-select");
await import("jb-core/i18n");
```

All imports must resolve without throwing. A separate browser test must confirm that the normal package entry still defines its documented tag.

## Deferred SSR requirement 2 — Change `jb-core/i18n` initialization

### Current limitation

As of `jb-core@0.33.0`, `jb-core/i18n` is safe to import and construct without a DOM, reads the document language once when available, accepts locale strings, and exposes cleanup-returning subscriptions. The remaining limitation is that JB components consume the shared singleton, so two renderer instances cannot reliably display different active JB locales on one page.

### Phase 1 requirement

One active locale per page is sufficient. Automatic renderer mode imports the SSR-safe `jb-core/i18n`, sets the document language/direction in its browser render path, and calls `i18n.setLocale(...)`. Manual mode does not mutate i18n and requires the consumer to configure it.

### Requested future implementation

- Add a scoped provider/context that a JB component subtree can consume.
- Retain the current global singleton as the backward-compatible default.

Scoped i18n becomes necessary when multilingual form support requires two simultaneously rendered forms with different locales. Switching one renderer between locales does not require scoped i18n.

### Acceptance tests

- Importing `jb-core/i18n` in Node succeeds. (Delivered in `0.33.0`.)
- Constructing `JBI18N` without a document succeeds. (Delivered in `0.33.0`.)
- Browser initialization reads the current document locale once. (Delivered in `0.33.0`.)
- Explicit locale changes notify subscribers and subscriptions can be cleaned up. (Delivered in `0.33.0`.)
- Two explicitly provided scoped instances do not change each other.

## Phase 1 requirement 1 — Standardize dependency-controlled custom-element registration

`jb-form-builder` supports two modes:

```html
<jb-form-builder auto-import="true"></jb-form-builder>
<jb-form-builder auto-import="false"></jb-form-builder>
```

The property defaults to `true`. The attribute is enumerated rather than a native boolean attribute:

- absent, empty, or `"true"` means automatic loading;
- `"false"` means consumer-controlled loading.

When automatic loading is disabled, the consumer registers `jb-form`, every used control, `jb-option` when needed, and configures `jb-core/i18n`. The renderer exposes missing packages/tags through `requiredDependencies` and `dependencies-required`.

For reliable package composition, every JB custom-element package should:

- expose an idempotent registration function;
- document every tag registered by its main entry;
- avoid throwing when a compatible tag already exists;
- publish its dependency/version policy;
- keep the default browser entry tree-shakeable where side-effect metadata permits it.

`jb-select` must explicitly document that it also registers `jb-option`.

## Renderer integration boundary — final package step

Requested package/tag:

```text
package: jb-form-builder
tag:     jb-form-builder
```

The final package should preserve the local concern boundaries:

```text
jb-form-builder/
├─ jb-form-builder
├─ document-controller
├─ dependency-loader
├─ locale-controller
├─ form-renderer
├─ element-renderer
├─ form-facade
├─ event-controller
├─ render-state
├─ types
├─ style.css
├─ define
├─ index
└─ react/
```

The main class should coordinate lifecycle and public properties only. It should not absorb schema validation, dependency discovery, DOM mapping, locale initialization, event forwarding, or form-value logic.

### Package exports

At minimum:

```json
{
  "exports": {
    ".": {},
    "./define": {},
    "./react": {}
  }
}
```

The exact conditions should include types and ESM files. The React entry must not be imported by the default web-component entry.

### Dependency policy

- JB runtime packages are normal dependencies so installing `jb-form-builder` is sufficient.
- React is an optional peer dependency used only by `jb-form-builder/react`.
- Literal dynamic imports must remain visible to bundlers so each used form package can become a lazy chunk.
- Already registered custom elements take precedence over automatic imports.
- Package loads are memoized across renderer instances.

## Shared document contract

The local renderer currently reuses the application's framework-independent document types, JSON Schema, registry adapters, and validation-rule compiler. Copying those files into a new repository would create contract drift.

At the final package step, move the portable contract into a shared design-system module or an exported platform-neutral subpath:

- document TypeScript types;
- JSON Schema;
- schema version constants;
- localized-text resolution;
- declarative validation-rule types;
- stable issue codes;
- adapter version rules.

Builder, Preview renderer, import/export, and migrations must consume the same source.

The shared contract must not import React, MobX, IndexedDB, Astro, or browser-only JB components.

## `jb-form` type exposed by the renderer

The renderer's `form` property is not an `HTMLFormElement`. It is the `JBFormWebComponent`-compatible runtime element and exposes:

- `getFormValues`;
- `setFormValues`;
- `reset`;
- `checkValidity`;
- `reportValidity`;
- `jbCheckValidity`.

Published typings should use the `jb-form` public type or a structurally compatible interface rather than claiming it is a native form.

## Phase 1 requirement 5 — Retain declarative validation portability

The renderer accepts no consumer-supplied validation functions. Portable JSON rules are compiled into trusted `jb-validation` entries only after the document passes schema, semantic, and adapter validation.

JB validation packages must continue supporting:

- optional empty values for non-required controls;
- localized messages;
- synchronous native-style validity;
- asynchronous `jbCheckValidity`;
- regular-expression source and flags from validated JSON;
- reset of validation presentation.

No renderer path may use `eval`, `Function`, or HTML injection.

## Phase 1 requirement 6 — Verify `jb-time-input` form-standard integration

`jb-time-input@2.4.0` provides the complete `JBFormInputStandards<string>` contract, including public `name` and `form` accessors and `formDisabledCallback`. A disabled native parent form or fieldset must update and restore the component's effective disabled state through the available component contract.

DSR-001 is resolved at the design-system dependency level. The remaining task is to retain integration coverage in the renderer's acceptance suite; no application adapter workaround is required.

## Renderer styling contract

Renderer styles are authored in a standalone CSS file and attached inside an open Shadow Root by the package build. Required rules:

- use rem units and logical properties;
- use OKLCH for renderer-owned color tokens;
- use `corner-shape: squircle` with `border-radius` fallback on renderer-owned surfaces, and use documented `::part` selectors for JB control surfaces;
- prevent horizontal overflow at narrow widths;
- expose `form`, `form-container`, `element`, `loading`, `error-summary`, and `element-error` parts;
- avoid relying on application Preview CSS;
- keep the CSS assets ready for the final package step.

The final package build must verify that its CSS strategy works for bundlers and direct browser ESM delivery without an application-specific loader.

## Final package checklist

At the final delivery step, before replacing the application renderer:

- render every support-matrix component from portable JSON;
- verify automatic and manual dependency modes;
- verify repeated-name value collection;
- verify initial values, reset, native validity, and asynchronous validity;
- verify English/LTR and Persian/RTL;
- verify typed error and dependency events;
- verify the React wrapper ref, properties, cleanup, and event callbacks;
- verify narrow mobile, desktop, zoom, keyboard, and touch behavior;
- verify module import without DOM globals;
- publish typings, custom-elements manifest, CSS contract, README, and migration notes.
