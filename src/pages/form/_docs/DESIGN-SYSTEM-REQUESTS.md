# JB Form — Design System Requests

Status: No active Form Builder blockers
Reviewed: 2026-08-27

This file tracks only work that still requires a change in the JB Design System. Completed requests are intentionally removed from the active list; their verification is reflected in `COMPONENT-INVENTORY.md`, `COMPONENT-SUPPORT.md`, and `PLAN.md`.

## Closed baseline

Previously tracked component requests are complete and intentionally not repeated here. Their verification is recorded in the inventory, support matrix, and operational plan. The current 25-entry catalog has no unresolved design-system dependency blocker. The application-local renderer remains a deliberate implementation boundary until final package publication.

## Deferred platform follow-up

These are not Form Builder release blockers and should return here only when SSR or independently localized component trees become product requirements:

- Make `jb-core/i18n` safe to import without browser globals.
- Provide an official scoped i18n context/provider for independently localized JB component trees.
- Add web-component and React coverage for scoped locale inheritance, runtime switching, SSR import, and listener cleanup.
- Guard browser-only registration and globals in JB package server entry points.

## Intake rule for new requests

Add a request here only when all of the following are true:

1. The required behavior cannot be achieved through a documented public JB API.
2. The limitation blocks an approved Form Builder capability or an explicitly scheduled platform requirement.
3. The request includes the affected package, proposed API/behavior, acceptance criteria, and a small usage example.

Do not add local forks, private Shadow DOM selectors, or silent builder workarounds in place of an approved design-system change.
