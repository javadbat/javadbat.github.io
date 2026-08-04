# JB Form — Design System Dependency Requests

Status: Release audit complete; DSR-001, DSR-002, DSR-003, and DSR-004 resolved, DSR-006 closed
Baseline source revision reviewed: `835fddf109e39c33ee7aecd0af6e4a0b4832ebda`  
Latest design-system revision audited: `8afc94a5cae5910c2dccab35c033d4d01150d27e`
Latest npm release audit: 2026-08-04

These requests follow the project's JB Design System dependency policy. The form builder must not add local forks or silent workarounds for these gaps.

## Delivery split

The requirements are intentionally split by the current runtime target. Phase 1 is a client-only application, so the first group is required before the form builder can be considered complete. The second group is a later platform-hardening pass and must not delay the client-only release.

### Phase 1 — required for client-only apps


DSR-002, DSR-003, and DSR-004 are resolved. Renderer publication is reserved for the final delivery step and is not tracked as a component requirement.

### Deferred — SSR/platform compatibility

- **DSR-006 (SSR portion)** — make `jb-core/i18n` safe to import without `document`/`MutationObserver`, separate state construction from browser observation, and add scoped instances for future simultaneous locale trees.
- **SSR import safety for JB packages** — move browser globals and custom-element registration behind guarded browser entry points so importing packages in a server process never throws.

The deferred group is a future compatibility contract. Phase 1 may continue using the guarded client pipeline and one active locale per page; no server-rendered form is required now. When SSR work starts, its acceptance tests must be added without changing the portable form JSON contract.

## DSR-001 — Verify `jb-time-input` form-standard integration

Priority: Phase 1 integration verification
Original baseline package reviewed: `jb-time-input@2.0.1`
Latest package audited: `jb-time-input@2.4.0`
Status: Resolved

### Component status

`jb-time-input@2.4.0` already satisfies the design-system dependency requirement. It is a form-associated control and participates in `jb-form` through the published standard contract.

### Available contract

- `JBFormInputStandards<string>` is implemented.
- The public `name` getter/setter returns `""` when absent.
- The public `form` getter is backed by `ElementInternals`.
- `formDisabledCallback` preserves the component's existing `disabled` behavior.
- `value`, `initialValue`, `isDirty`, `required`, `disabled`, `formResetCallback`, and validation behavior are available through the standard contract.
- The same contract is exposed through the React wrapper and published typings.

### 2.4.0 release audit

The release includes all APIs previously requested by DSR-001, including `JBFormInputStandards<string>`, public `name` and `form` accessors, and `formDisabledCallback`. DSR-001 is closed. The acceptance criteria below are retained only as form-builder integration checks; they are not pending design-system requirements.

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
Latest package audited: `jb-switch@1.7.3`
Status: Resolved

### Required behavior

A required switch whose value is `false` must be invalid through both `jb-validation` and native form validity APIs.

### Current limitation

The required validation item returns invalid for `false`, but it does not declare a `stateType`. The component's `ElementInternals.setValidity` logic only adds a native invalid flag when a validation item supplies a state type. This can leave native validity state inconsistent with the `jb-validation` result.

### Requested API/standard upgrade

- Set the required validation item's `stateType` to `valueMissing`.
- Ensure the required failure supplies the localized message.
- Confirm that `checkValidity`, `reportValidity`, native form submission, and `jbCheckValidity` all report the same invalid state.

### 1.7.3 release audit

The required validation item now supplies `stateType: "valueMissing"` together with the localized required message. The source-level gap tracked by DSR-003 is resolved. The builder's later component integration tests will still exercise the full acceptance checklist.

## DSR-004 — Verify the design-system `jb-switch` source reference

Priority: Phase 1 reproducible-source blocker  
Design-system revision reviewed: `8afc94a5cae5910c2dccab35c033d4d01150d27e`  
Status: Resolved

### Resolution

The `jb-switch` source reference was updated and the published `jb-switch@1.7.3` validity behavior is now available to the form builder. DSR-004 is closed.

### Verification criteria

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

## DSR-006 — Scoped and SSR-safe i18n review (deferred platform work)

Priority: None for Phase 1; reconsider only if Phase 2 needs simultaneous scoped locales
Status: Closed for Phase 1; SSR portions deferred; not required by the approved client-only architecture
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

The form-element inventory itself requires no additional input component. DSR-006 is closed because scoped/SSR i18n is not required for the client-only Phase 1 route model. The renderer package will be published as the final delivery step after implementation and verification are complete. JB control styling should use documented `::part` selectors where the component exposes the needed styling hook; no shared corner-shape variable is requested.
