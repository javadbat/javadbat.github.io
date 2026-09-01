# JB Form — Design System Requests

Status: No active Form Builder design-system requests
Reviewed: 2026-09-02

This file tracks only work that still requires a change in the JB Design System. Completed requests are intentionally removed from the active list; their verification is reflected in `COMPONENT-INVENTORY.md`, `COMPONENT-SUPPORT.md`, and `PLAN.md`.

## Closed baseline

Previously tracked component requests are complete and intentionally not repeated here. Their verification is recorded in the inventory, support matrix, and operational plan. The current 25-entry catalog is migrated to the latest published API ranges. The application-local renderer now defers configuration for components whose latest runtime initializes internal DOM only in `connectedCallback`.

## Audit result

The current published JB packages are importable without browser globals during module evaluation. The audit passed for every JB dependency used by the repository. The only exception is the intentionally non-root-exported `jb-icons` package; its documented subpath entry, such as `jb-icons/arrow`, passes.

All audited web-component packages use `jb-core`'s `defineWebComponent` helper. The helper guards browser-only registration and skips tags that are already defined, so registration is safe and idempotent.

No upstream API change is required for the supported Form Builder flow. Verified representative imports include:

- `jb-form`
- `jb-color-input`
- `jb-input`
- `jb-select`
- `jb-date-input`
- `jb-core/i18n`

`jb-core/i18n` is SSR-safe in the current baseline. No upstream change is required for the supported Form Builder flow.

## Intake rule for new requests

Add a request here only when all of the following are true:

1. The required behavior cannot be achieved through a documented public JB API.
2. The limitation blocks an approved Form Builder capability or an explicitly scheduled platform requirement.
3. The request includes the affected package, proposed API/behavior, acceptance criteria, and a small usage example.

Do not add local forks, private Shadow DOM selectors, or silent builder workarounds in place of an approved design-system change.
