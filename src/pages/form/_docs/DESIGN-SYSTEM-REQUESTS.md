# JB Form — Design System Requests

Status: Two active SSR entry-point requests
Reviewed: 2026-09-02

This file tracks only work that still requires a change in the JB Design System. Completed requests are intentionally removed from the active list; their verification is reflected in `COMPONENT-INVENTORY.md`, `COMPONENT-SUPPORT.md`, and `PLAN.md`.

## Closed baseline

Previously tracked component requests are complete and intentionally not repeated here. Their verification is recorded in the inventory, support matrix, and operational plan. The current 25-entry catalog is migrated to the latest published API ranges. The application-local renderer now defers configuration for components whose latest runtime initializes internal DOM only in `connectedCallback`.

## Active platform requests

SSR is now an explicit Form Builder requirement. The following published entry points still fail direct Node evaluation:

- `jb-form` reads `HTMLElement` from its default entry during module evaluation.
- `jb-color-input` performs unguarded custom-element registration from its default entry.

Required upstream API:

- Preserve the existing browser auto-registration entry.
- Add guarded, idempotent `define...()` functions and an SSR-safe default import path for both packages.
- Keep React and browser-only DOM construction out of the SSR-safe path.
- Add Node import tests and browser registration tests to each package.

`jb-core/i18n` is already SSR-safe in the current baseline. `jb-icons` is a subpath package; documented entries such as `jb-icons/arrow` pass the Node import audit, while the package root is intentionally not an exported API.

## Intake rule for new requests

Add a request here only when all of the following are true:

1. The required behavior cannot be achieved through a documented public JB API.
2. The limitation blocks an approved Form Builder capability or an explicitly scheduled platform requirement.
3. The request includes the affected package, proposed API/behavior, acceptance criteria, and a small usage example.

Do not add local forks, private Shadow DOM selectors, or silent builder workarounds in place of an approved design-system change.
