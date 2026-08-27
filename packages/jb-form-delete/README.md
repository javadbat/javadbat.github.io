# jb-form-delete

An accessible, framework-independent delete action for saved forms. The host
owns confirmation, persistence, and recovery behavior.

```html
<jb-form-delete form-id="exam-1" label="Delete form"></jb-form-delete>
```

The component emits `delete-request` with `{ formId: string }`.
