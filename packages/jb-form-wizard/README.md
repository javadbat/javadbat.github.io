# jb-form-wizard

Accessible, framework-independent linear navigation for multi-step forms.

```html
<jb-form-wizard validation-mode="current">
  <section data-wizard-step data-step-label="Profile">...</section>
  <section data-wizard-step data-step-label="Review">...</section>
</jb-form-wizard>
```

The component validates the active step before moving forward, disables controls in hidden steps, exposes 44px Previous/Next targets, and emits `wizard-before-change`, `wizard-change`, and `wizard-complete` events. A host can cancel `wizard-before-change` for additional asynchronous validation or route guards.
