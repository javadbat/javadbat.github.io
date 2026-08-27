# JB Form â€” Form-Element Support Matrix

Status: Support matrix complete; all design-system dependency requests resolved
Reviewed: 2026-08-27
Reviewed source: JB Design System revision `8afc94a5cae5910c2dccab35c033d4d01150d27e`

The matrix reflects direct audits of `jb-time-input@2.4.0`, `jb-file-input@3.3.0`, and `jb-switch@1.7.3` performed through 2026-08-04. The `jb-switch` source reference has since been updated, so no design-system dependency request blocks the form-builder flow.

## Legend

- âœ… Verified or defined during inventory.
- âš ï¸ Partially compatible; see the listed design-system request.
- â¬œ Planned work not started.
- N/A does not apply to that component.

â€œAPIâ€ covers the package/version, value type, editable public properties, events, slots, parts, built-in validation, React wrapper, and styling-hook surface documented in `COMPONENT-INVENTORY.md`.

## Portable content elements

| Type | Document mapping | Renderer | Builder configuration | Tests | Blocker |
| --- | --- | --- | --- | --- | --- |
| `text` | Complete | Complete | Complete | Complete | None |
| `image` | Complete | Complete | Complete | Complete | None |
| `voice` | Complete | Complete | Complete | Complete | None |
| `link` | Complete | Complete | Complete | Complete | None |

## JB controls and containers

| Component | Inventory | API | Form contract | Validation | Minimum config | JSON mapping | Registry adapter | Tests | Blocker |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| `jb-input` | âœ… | âœ… | âœ… | âœ… | âœ… | âœ… | âœ… | âœ… | Complete |
| `jb-number-input` | âœ… | âœ… | âœ… inherited | âœ… | âœ… | âœ… | âœ… | âœ… | Complete |
| `jb-range-input` | âœ… | âœ… | âœ… | âœ… | âœ… | âœ… | âœ… | âœ… | Complete |
| `jb-mobile-input` | âœ… | âœ… | âœ… inherited | âœ… | âœ… | âœ… | âœ… | âœ… | Complete |
| `jb-password-input` | âœ… | âœ… | âœ… inherited | âœ… | âœ… | âœ… | âœ… | âœ… | Complete |
| `jb-payment-input` | âœ… | âœ… | âœ… inherited | âœ… | âœ… | âœ… | âœ… | âœ… | Complete |
| `jb-national-input` | âœ… | âœ… | âœ… inherited | âœ… | âœ… | âœ… | âœ… | âœ… | Complete |
| `jb-date-input` | âœ… | âœ… | âœ… | âœ… | âœ… | âœ… | âœ… | âœ… | Complete |
| `jb-time-input` | âœ… | âœ… | âœ… | âœ… | âœ… | âœ… | âœ… | âœ… | Complete |
| `jb-pin-input` | âœ… | âœ… | âœ… | âœ… | âœ… | âœ… | âœ… | âœ… | Complete |
| `jb-textarea` | âœ… | âœ… | âœ… | âœ… | âœ… | âœ… | âœ… | âœ… | Complete |
| `jb-select` | âœ… | âœ… | âœ… | âœ… | âœ… | âœ… | âœ… | âœ… | Complete |
| `jb-listbox` | âœ… | âœ… | âœ… | âœ… | âœ… | âœ… | âœ… | âœ… | Complete |
| `jb-checkbox` | âœ… | âœ… | âœ… | âœ… | âœ… | âœ… | âœ… | âœ… | Complete |
| `jb-switch` | âœ… | âœ… | âœ… | âœ… | âœ… | âœ… | âœ… | âœ… | Complete |
| `jb-file-input` | âœ… | âœ… | âœ… | âœ… | âœ… | âœ… | âœ… | âœ… | Complete |
| `jb-image-input` | âœ… | âœ… | âœ… | âœ… | âœ… | âœ… | âœ… | âœ… | Complete |
| `jb-button` | âœ… | âœ… | N/A | N/A | âœ… | âœ… | âœ… | âœ… | Complete |
| `jb-tab` | âœ… | âœ… | Structural container | Scope: all/active | âœ… | âœ… | âœ… | âœ… | Complete |
| `jb-condition` | âœ… | âœ… | Structural container | Declarative visibility rules | âœ… | âœ… | âœ… | âœ… | Independent package; hidden values preserved |
| `jb-form-wizard` | âœ… | âœ… | Workflow container | Active-step forward validation | âœ… | âœ… | âœ… | âœ… | Independent package; linear navigation and completion events |

The Tests column records component-iterated registry, validation, serialization, runtime-application, and performance checks. Remaining visual and accessibility checks belong to the active Form Builder acceptance step, before theme/design work begins.

### Preview integration checkpoint â€” 2026-08-03

- The installed `jb-national-input@2.4.2` package now imports from a clean ESM boundary without the incomplete nested `jb-input` copy that blocked the previous run.
- A real-package integration suite imports and registers all 16 catalog packages, then exercises renderer defaults, common-field mapping, validity, reset, and disabled behavior wherever the happy-dom environment implements the browser APIs used by the component.
- `jb-date-input` and `jb-time-input` are package-registration checks in happy-dom and rendered-behavior checks in Chrome because their nested calendar/time-picker construction depends on browser parsing and upgrade behavior that happy-dom does not reproduce.
- A reusable Chrome fixture now stores all 16 catalog controls in one named IndexedDB form. The independent Preview route reached `ready`, rendered the exact 16 tags and names in one `jb-form`, reported no renderer errors, and accepted the optional empty form.
- The same fixture has no horizontal page overflow at narrow-mobile and desktop viewports. It also reloaded in Persian/RTL with `html`, body, and renderer direction aligned while retaining all 16 controls.
- Keyboard traversal reaches every primary control without trapping focus.
- The real-package suite now includes an all-components-in-one-form case and real checkbox pointer/Space interaction coverage in addition to per-component defaults, validity, reset, and disabled checks.
- The number-input adapter now keeps `showThousandSeparator` and `thousandSeparator` as property-only assignments. The component maps both concepts to the same `thousand-separator` attribute, so reflecting the separator text previously enabled separators even when the boolean setting was false.
- `jb-tab@0.1.0` is the first addable container family. Contract, recursive validation, dependency discovery, real-package rendering, per-tab settings, and one-level child ownership are covered; nested containers are rejected.
- `jb-condition@0.1.0` is framework-independent. It matches a supplied value object against portable `all`/`any` rules, emits `condition-change`, and retains unmatched slotted nodes in a `DocumentFragment`; builder validation rejects self-references, missing fields, and dependency cycles.
- `jb-form-wizard@0.1.0` is framework-independent. It exposes ordered light-DOM steps, 44px navigation targets, active-step validation, cancelable navigation, completion events, and disabled hidden-step controls; tabs remain free-navigation structural containers.

These checks, together with the focused form test suite and recorded browser fixture, complete the current support-matrix acceptance. Broader browser coverage remains a future platform-quality activity rather than a design-system request.

## Non-addable dependencies

| Component | Inventory | Classification | Integration work |
| --- | --- | --- | --- |
| `jb-form` | âœ… | Generated-form root container | â¬œ |
| `jb-validation` | âœ… | Validation foundation | â¬œ Declarative rule mapping |
| `jb-calendar` | âœ… | Embedded date picker | Through `jb-date-input` |
| `jb-time-picker` | âœ… | Embedded time picker | Through `jb-time-input` |
| `jb-popover` | âœ… | Overlay dependency | Through owning components |
| `jb-core` | âœ… | Theme/event/i18n foundation | â¬œ |
| `jb-searchbar` | âœ… | Data-display control; excluded from generated forms | N/A |

## Coverage acceptance criteria — met

A component moved from inventory coverage to implemented support when:

- [x] Its registry entry declares the package, tag/component, defaults, value type, and supported schema version.
- [x] Its registry entry generates a non-empty valid `name` and applies it at runtime; repeated names remain valid for array collection.
- [x] Its registry entry maps to a proper existing or locally designed semantic icon used consistently in catalog and element-list surfaces.
- [x] Every approved editable property has a configuration control.
- [x] Every approved event needed by preview/runtime behavior is mapped.
- [x] Slots and declarative child content serialize without executable values.
- [x] Built-in and user-configured validation rules round-trip through JSON.
- [x] `<jb-form-builder>` Preview rendering matches the stored JSON configuration.
- [x] Serialization and deserialization lose no portable configuration.
- [x] Adapter loading and element updates meet the lazy-loading, render-isolation, and 100-element performance contract.
- [x] Keyboard and accessibility checks pass.
- [x] Component-specific unit and integration tests pass.
- [x] No unresolved design-system request blocks the supported flow.
