# JB Form — Design System Dependency Requests

Status: Release audit complete; DSR-002 and DSR-003 resolved, DSR-006 closed, DSR-001, DSR-004, and DSR-005 open
Baseline source revision reviewed: `835fddf109e39c33ee7aecd0af6e4a0b4832ebda`  
Latest design-system revision audited: `8afc94a5cae5910c2dccab35c033d4d01150d27e`
Latest npm release audit: 2026-07-29

These requests follow the project's JB Design System dependency policy. The form builder must not add local forks or silent workarounds for these gaps.

## DSR-001 — Complete `jb-time-input` form-standard support

Priority: Phase 1 blocker for reliable `jb-form` value collection  
Baseline package reviewed: `jb-time-input@2.0.1`  
Latest package audited: `jb-time-input@2.3.0`  
Status: Partially resolved

### Required behavior

`jb-time-input` must fully implement `JBFormInputStandards<string>` so it participates in `jb-form` consistently with the other form controls.

### Current limitation

- The class implements `WithValidation<ValidationValue>` but does not declare `JBFormInputStandards<string>`.
- It forwards the `name` attribute to its internal input but does not expose the required public `name` property.
- It does not expose the required public `form` getter.
- `jb-form` collects and updates values by reading `formElement.name`; an attribute forwarded only to the internal input is insufficient.

### Requested API/standard upgrade

- Implement `JBFormInputStandards<string>`.
- Add a public `name: string` getter/setter returning `""` when absent.
- Add a public `form` getter backed by `ElementInternals`.
- Confirm or add `formDisabledCallback`, preserving the component's existing `disabled` behavior.
- Keep `value`, `initialValue`, `isDirty`, `required`, `disabled`, `formResetCallback`, and validation behavior aligned with the standard.
- Expose the same contract through the React wrapper and typings.

### 2.3.0 release audit

The release adds the `JBFormInputStandards<string>` class declaration, public `form` getter, and public `name` getter/setter. The published source still does not provide `formDisabledCallback`.

DSR-001 remains a Phase 1 blocker until `formDisabledCallback` preserves the component's disabled behavior when a native parent form or disabled fieldset changes its form-associated disabled state, and the acceptance test covers that behavior.

### Builder usage example

```html
<jb-form>
  <jb-time-input name="startTime"></jb-time-input>
</jb-form>
```

The builder must be able to save, restore, reset, disable, validate, and collect `startTime` by name.

### Acceptance criteria

- `getFormValues()` includes the named time value.
- `setFormValues()` updates the time value.
- `setFormInitialValues()` updates the baseline without incorrectly marking the field dirty.
- `reset()` restores the initial value and clears validation.
- Parent-form disabling updates the time input.
- `checkValidity`, `reportValidity`, and `jbCheckValidity` agree.
- Web-component and React tests cover all behaviors.

## DSR-002 — Complete `jb-file-input` form-standard support

Priority: Phase 1 blocker for consistent form-control behavior  
Baseline package reviewed: `jb-file-input@3.1.0`  
Latest package audited: `jb-file-input@3.3.0`  
Status: Resolved

### Required behavior

`jb-file-input` must fully implement `JBFormInputStandards<File | null>`.

### Current limitation

- The class implements `WithValidation<ValidationValue>` but does not declare `JBFormInputStandards<File | null>`.
- It exposes `name`, `value`, `initialValue`, `isDirty`, `required`, and reset behavior, but does not expose the standard public `disabled` property or `form` getter.
- Parent-form disabling cannot be applied consistently through the JB form-control contract.

### Requested API/standard upgrade

- Implement `JBFormInputStandards<File | null>`.
- Add a reflected `disabled` property/attribute and apply it to every interactive file-input action.
- Add a public `form` getter backed by `ElementInternals`.
- Add `formDisabledCallback` and keep its behavior synchronized with `disabled`.
- Preserve `name`, `value`, `initialValue`, `isDirty`, `required`, and `formResetCallback`.
- Expose the completed contract through the React wrapper and typings.

### 3.3.0 release audit

The release implements `JBFormInputStandards<File | null>` and includes the public `disabled` property, `form` getter, and `formDisabledCallback`. Its disabled story verifies that selection, reselection, and deletion are unavailable while the intentional download action remains available. DSR-002 is resolved.

### Builder usage example

```html
<jb-form>
  <jb-file-input name="attachment" required></jb-file-input>
</jb-form>
```

The builder must be able to disable the generated form, restore its configured initial state, validate the required field, and collect the selected file at runtime.

### Acceptance criteria

- The component type-checks as `JBFormInputStandards<File | null>`.
- Parent-form disabling disables selection, reselect, delete, upload, and download interactions as appropriate.
- `getFormValues`, `setFormInitialValues`, dirty checking, and reset work by name.
- Native and `jb-validation` validity results agree.
- Web-component and React tests cover all behaviors.

## DSR-003 — Map `jb-switch` required failure to native validity

Priority: Phase 1 validation consistency blocker  
Baseline package reviewed: `jb-switch@1.7.0`  
Latest package audited: `jb-switch@1.7.1`  
Status: Resolved

### Required behavior

A required switch whose value is `false` must be invalid through both `jb-validation` and native form validity APIs.

### Current limitation

The required validation item returns invalid for `false`, but it does not declare a `stateType`. The component's `ElementInternals.setValidity` logic only adds a native invalid flag when a validation item supplies a state type. This can leave native validity state inconsistent with the `jb-validation` result.

### Requested API/standard upgrade

- Set the required validation item's `stateType` to `valueMissing`.
- Ensure the required failure supplies the localized message.
- Confirm that `checkValidity`, `reportValidity`, native form submission, and `jbCheckValidity` all report the same invalid state.

### 1.7.1 release audit

The required validation item now supplies `stateType: "valueMissing"` together with the localized required message. The source-level gap tracked by DSR-003 is resolved. The builder's later component integration tests will still exercise the full acceptance checklist.

## DSR-004 — Repair the design-system `jb-switch` submodule reference

Priority: Phase 1 reproducible-source blocker  
Design-system revision reviewed: `8afc94a5cae5910c2dccab35c033d4d01150d27e`  
Status: Open

### Current limitation

The design-system repository pins `modules/jb-switch` to commit `b540e47886653fda7bc3718da092a62607166f18`, but the `jb-switch` remote cannot serve that commit. Its current `main` branch is `efbfacf6c4d264a93eb120a7de24ce2fa98258fb`, which does not contain the `valueMissing` correction published in `jb-switch@1.7.1`.

As a result, `git submodule update --init --recursive` fails and the authoritative source checkout cannot reproduce the published switch release.

### Requested repository correction

- Restore a reachable source commit containing the `jb-switch@1.7.1` validity fix, or publish an equivalent new commit.
- Update the design-system `modules/jb-switch` gitlink to that reachable commit.
- Keep the package version and published npm contents aligned with the referenced source.

### Acceptance criteria

- A fresh recursive clone of the design-system repository completes successfully.
- The pinned `jb-switch` source contains `stateType: "valueMissing"` for the required rule.
- The pinned source package version matches the intended published release.

### Builder usage example

```html
<jb-form>
  <jb-switch name="termsAccepted" required></jb-switch>
</jb-form>
```

The generated form must reject submission until `termsAccepted` is `true`.

### Acceptance criteria

- `switch.checkValidity()` returns `false` while required and off.
- `switch.reportValidity()` returns `false` and displays the required message.
- The containing native form and `jb-form` both report invalid.
- Turning the switch on clears `valueMissing`.
- Tests cover native APIs, `jb-validation`, and `jb-form`.

## DSR-005 — Publish `jb-form-builder` as the JSON form renderer

Priority: Phase 1 production-release blocker  
Status: Open; application-local implementation approved for tests only  
Proposed package/tag: `jb-form-builder` / `<jb-form-builder>`

### Use case

The separate Preview route loads portable form JSON from IndexedDB and needs one design-system renderer that converts the document into a responsive runtime `jb-form`. Builder and Preview must exercise exactly the same registry, component configuration, locale, direction, names, initial values, and declarative validation behavior.

### Responsibilities

- Accept a complete validated form document through a JavaScript property.
- Render all approved JB form elements in document order inside `jb-form`.
- Apply a non-empty `name` to every rendered element and preserve repeated names so `jb-form` can collect intentional array values.
- Apply English/LTR defaults and document-configured locale/direction through `jb-core/i18n`.
- Convert portable declarative validation rules into runtime `jb-validation` items.
- Initialize, validate, reset, and collect runtime form values.
- Keep runtime response values separate from the source document.
- Isolate and report document-level and element-level render failures.
- Render responsively across narrow mobile and desktop viewports.
- Remain storage- and route-agnostic; the owning page loads IndexedDB and supplies JSON.

### Proposed public API

```ts
class JBFormBuilderWebComponent extends HTMLElement {
  formDocument: JBFormDocument | null;
  readonly form: HTMLFormElement | null;
  readonly value: Record<string, unknown>;

  reset(): void;
  getFormValues(): Record<string, unknown>;
  checkValidity(): boolean;
  reportValidity(): boolean;
}
```

The document is assigned as an object property, not serialized into an HTML attribute.

### Proposed events

- `load` — component setup completed.
- `ready` — the current document rendered successfully.
- `document-invalid` — the supplied document failed schema or naming validation.
- `render-error` — one or more elements could not render.
- `input` and `change` — runtime value changes, with form values available to the consumer.
- `submit` — valid local form submission; the component does not call a backend.
- `reset` — runtime values returned to configured initial values.

### Required states

- empty/no document;
- loading/rendering;
- ready;
- invalid document;
- partially degraded element rendering;
- form invalid;
- form valid/submitted;
- reset.

### Validation behavior

- Reject missing or invalid element names before rendering; preserve valid duplicate names.
- Use the same document-schema validation as Builder and export.
- Keep native validity, `jb-validation`, and `jb-form` collection consistent.
- Provide element ID, name, type, and failure detail with renderer errors.
- Never mutate the source document to repair invalid data silently.

### Accessibility

- Preserve the accessibility contract of every rendered JB element.
- Maintain document order and logical LTR/RTL behavior.
- Focus the first invalid form control when reporting validity where appropriate.
- Announce document/render failures and form validation outcomes without relying on color.
- Keep loading and error states perceivable to assistive technology.

### Styling

- Provide responsive host behavior without horizontal page scrolling.
- Use external pure CSS, `rem`, logical properties, and JB design tokens; do not use CSS-in-JS.
- Expose stable parts for at least `form`, `element`, `loading`, `error-summary`, and `submit-result`.
- Document supported CSS custom properties and avoid leaking Preview-page layout into the component.

### Usage example

```html
<jb-form-builder id="preview-form"></jb-form-builder>

<script type="module">
  import "jb-form-builder";

  const renderer = document.querySelector("#preview-form");
  renderer.formDocument = formDocumentLoadedFromIndexedDB;
</script>
```

### Local test implementation exception

The project owner explicitly approved an application-local `<jb-form-builder>` for test and integration work before publication. It must:

- follow the proposed package API closely;
- remain isolated so it can be replaced by the package import;
- not be presented as a permanent local substitute;
- use no CSS-in-JS; and
- be removed after the published package is integrated.

### Acceptance criteria

- The published package renders every approved support-matrix element from JSON.
- Missing or invalid names are rejected; duplicate names are valid and rendered unchanged.
- `jb-form` values remain scalar for singly named controls and become arrays for repeated names.
- Declarative validation, reset, initial values, locale, and direction round-trip correctly.
- Preview is responsive and accessible across the agreed viewport/browser matrix.
- Runtime values never mutate the portable document.
- Web-component source, typings, custom-elements manifest, documentation, tests, and React wrapper are published.
- The application replaces its local test implementation with the published package before Phase 1 production acceptance.

## DSR-006 — Scoped and SSR-safe i18n review

Priority: None for Phase 1; reconsider only if Phase 2 needs simultaneous scoped locales
Status: Closed; not required by the approved client-only architecture
Baseline reviewed: `jb-core@0.30.0`

### Resolution

Every Phase 1 form route is a client-only application and configures one active `jb-core/i18n` locale after the browser document exists. Builder uses its active editor locale; Preview is a separate page and uses the form's default locale/direction. Simultaneous independently scoped JB component subtrees are not required in Phase 1, and no SSR import is needed.

The following analysis is retained as a possible Phase 2 enhancement, not a current design-system request or implementation blocker.

### Use case

Builder chrome has an editor locale, while the portable form document has its own default locale and direction. The two may differ on the same page—for example, English/LTR Builder controls editing a Persian/RTL form. Preview uses the form locale. Both surfaces must continue using `jb-core/i18n`.

### Current limitation

`jb-core/i18n` exports a process-wide `i18n` singleton. JB components consume that shared context, and the context observes `document.documentElement.lang`. Changing the form locale therefore also changes JB controls used by the editor chrome. The module also touches `document` and `MutationObserver` during construction, so importing it during Astro server/static rendering is not safe.

Although `JBI18N` is constructible, JB components have no standard property/provider for receiving a scoped instance. Creating a second instance in the application does not make component internals consume it.

### Possible future standard and API

- Define an official scoped i18n context that a JB component subtree can consume independently of the document-global singleton.
- Support at least locale, language, direction, calendar, numbering system, and locale-change subscription.
- Provide a web-component provider or equivalent DOM context protocol for nested JB components.
- Provide a matching React provider/hook.
- Keep the existing global singleton as a backward-compatible default when no scoped context exists.
- Make `jb-core/i18n` safe to import when `document` and `MutationObserver` are unavailable.
- Provide listener removal/disposal so scoped contexts and providers do not leak subscriptions.
- Update JB form components and validation-message helpers to resolve their nearest scoped context.
- Document whether `lang` and `dir` attributes are mirrored onto the provider host or managed by the consumer.

One acceptable shape is:

```ts
const editorI18n = createJBI18N({
  locale: new Intl.Locale("en"),
  direction: "ltr",
});

const formI18n = createJBI18N({
  locale: new Intl.Locale("fa"),
  direction: "rtl",
});
```

```html
<jb-i18n-provider context="formI18n">
  <jb-input></jb-input>
</jb-i18n-provider>
```

The exact provider API may differ, but consumers must not need to mutate the document-global locale to localize a subtree.

### Acceptance criteria

- An English/LTR JB editor subtree and Persian/RTL JB form subtree render correctly in the same document.
- Changing either scoped locale does not change the other subtree.
- Component-owned labels, placeholders, popovers, required messages, validation summaries, and number/date presentation use the nearest context.
- Nested providers override and then correctly fall back to their parent/global context.
- Existing applications using the exported singleton continue to work.
- Importing `jb-core/i18n` in an Astro/Node build does not access unavailable browser globals.
- Provider/context listeners can be removed or disposed.
- Web-component and React tests cover independent contexts, runtime switching, nested fallback, SSR import, and cleanup.

## Missing-component review

The form-element inventory itself requires no additional input component. Product-flow design identified the missing JSON renderer tracked by DSR-005. The owner approved a local test implementation while the publishable design-system package is developed. DSR-006 is closed because scoped/SSR i18n is not required for the client-only Phase 1 route model.
