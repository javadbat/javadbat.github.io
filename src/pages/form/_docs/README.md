# JB Form documentation map

Use this folder in operational order. `PLAN.md` is the only execution checklist; the other files are decision and implementation references.

## Operational order

1. `PLAN.md` — current step, gate, acceptance, and delivery sequence.
2. `PROJECT.md` — product scope, route family, phase boundaries, and durable decisions.
3. `PRODUCT-FLOW.md` — author and Preview interactions, navigation, persistence feedback, and recovery.
4. `COMPONENT-INVENTORY.md` — supported JB packages and public capabilities.
5. `COMPONENT-SUPPORT.md` — per-component support and acceptance matrix.
6. `DESIGN-SYSTEM-REQUESTS.md` — only unresolved or future platform-level JB requests.
7. `FORM-JSON-CONTRACT.md` — portable form document and serialization contract.
8. `TECHNICAL-FOUNDATION.md` — implementation boundaries, testing, and performance rules.
9. `THEME-INVENTORY.md` — public theme tokens and styling hooks.
10. `THEME-SCHEMA.md` — theme data shape and compatibility rules.
11. `THEME-BEHAVIOR.md` — Theme Builder behavior and acceptance rules.
12. `UX-ROADMAP.md` — product/UX direction and future backlog.

## Status convention

- `complete` — implemented and checked; do not keep it in the active plan.
- `in progress` — the current implementation step.
- `blocked by decision` — do not implement until the named product or API decision is recorded.
- `deferred` — intentionally outside the current release sequence.

When code changes, update `PLAN.md` first, then the one reference document that owns the changed decision. Avoid copying the same checklist into multiple documents.
