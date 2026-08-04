# JB Form — Form-Element Support Matrix

Status: Inventory baseline; all design-system dependency requests are resolved
Reviewed source: JB Design System revision `8afc94a5cae5910c2dccab35c033d4d01150d27e`

The matrix reflects direct audits of `jb-time-input@2.4.0`, `jb-file-input@3.3.0`, and `jb-switch@1.7.3` performed through 2026-08-04. The `jb-switch` source reference has since been updated, so no design-system dependency request blocks the form-builder flow.

## Legend

- ✅ Verified or defined during inventory.
- ⚠️ Partially compatible; see the listed design-system request.
- ⬜ Planned work not started.
- N/A does not apply to that component.

“API” covers the package/version, value type, editable public properties, events, slots, parts, built-in validation, React wrapper, and styling-hook surface documented in `COMPONENT-INVENTORY.md`.

## Addable components

| Component | Inventory | API | Form contract | Validation | Minimum config | JSON mapping | Registry adapter | Tests | Blocker |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| `jb-input` | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | Preview checks pending |
| `jb-number-input` | ✅ | ✅ | ✅ inherited | ✅ | ✅ | ✅ | ✅ | ✅ | Preview checks pending |
| `jb-mobile-input` | ✅ | ✅ | ✅ inherited | ✅ | ✅ | ✅ | ✅ | ✅ | Preview checks pending |
| `jb-password-input` | ✅ | ✅ | ✅ inherited | ✅ | ✅ | ✅ | ✅ | ✅ | Preview checks pending |
| `jb-payment-input` | ✅ | ✅ | ✅ inherited | ✅ | ✅ | ✅ | ✅ | ✅ | Preview checks pending |
| `jb-national-input` | ✅ | ✅ | ✅ inherited | ✅ | ✅ | ✅ | ✅ | ✅ | Preview checks pending |
| `jb-date-input` | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | Preview checks pending |
| `jb-time-input` | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | Preview checks pending |
| `jb-pin-input` | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | Preview checks pending |
| `jb-textarea` | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | Preview checks pending |
| `jb-select` | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | Preview checks pending |
| `jb-checkbox` | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | Preview checks pending |
| `jb-switch` | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | Preview checks pending |
| `jb-file-input` | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | Preview checks pending |
| `jb-image-input` | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | Preview checks pending |
| `jb-button` | ✅ | ✅ | N/A | N/A | ✅ | ✅ | ✅ | ✅ | Preview checks pending |

The Tests column records component-iterated registry, validation, serialization, runtime-application, and performance checks. Final visual and accessibility acceptance of each rendered component remains in Step 9 with the form renderer.

### Preview integration checkpoint — 2026-08-03

- The installed `jb-national-input@2.4.2` package now imports from a clean ESM boundary without the incomplete nested `jb-input` copy that blocked the previous run.
- A real-package integration suite imports and registers all 16 catalog packages, then exercises renderer defaults, common-field mapping, validity, reset, and disabled behavior wherever the happy-dom environment implements the browser APIs used by the component.
- `jb-date-input` and `jb-time-input` are package-registration checks in happy-dom and rendered-behavior checks in Chrome because their nested calendar/time-picker construction depends on browser parsing and upgrade behavior that happy-dom does not reproduce.
- A reusable Chrome fixture now stores all 16 catalog controls in one named IndexedDB form. The independent Preview route reached `ready`, rendered the exact 16 tags and names in one `jb-form`, reported no renderer errors, and accepted the optional empty form.
- The same fixture has no horizontal page overflow at narrow-mobile and desktop viewports. It also reloaded in Persian/RTL with `html`, body, and renderer direction aligned while retaining all 16 controls.
- Keyboard traversal reaches every primary control without trapping focus.
- The real-package suite now includes an all-components-in-one-form case and real checkbox pointer/Space interaction coverage in addition to per-component defaults, validity, reset, and disabled checks.
- The number-input adapter now keeps `showThousandSeparator` and `thousandSeparator` as property-only assignments. The component maps both concepts to the same `thousand-separator` attribute, so reflecting the separator text previously enabled separators even when the boolean setting was false.

These checks advance runtime integration confidence but do not complete the pending per-row visual, interaction, keyboard, accessibility, responsive, or cross-browser acceptance work.

## Non-addable dependencies

| Component | Inventory | Classification | Integration work |
| --- | --- | --- | --- |
| `jb-form` | ✅ | Generated-form root container | ⬜ |
| `jb-validation` | ✅ | Validation foundation | ⬜ Declarative rule mapping |
| `jb-calendar` | ✅ | Embedded date picker | Through `jb-date-input` |
| `jb-time-picker` | ✅ | Embedded time picker | Through `jb-time-input` |
| `jb-popover` | ✅ | Overlay dependency | Through owning components |
| `jb-core` | ✅ | Theme/event/i18n foundation | ⬜ |
| `jb-searchbar` | ✅ | Data-display control; excluded from generated forms | N/A |

## Coverage acceptance checklist

A component moves from inventory coverage to implemented support only when:

- [ ] Its registry entry declares the package, tag/component, defaults, value type, and supported schema version.
- [ ] Its registry entry generates a non-empty valid `name` and applies it at runtime; repeated names remain valid for array collection.
- [ ] Its registry entry maps to a proper existing or locally designed semantic icon used consistently in catalog and element-list surfaces.
- [ ] Every approved editable property has a configuration control.
- [ ] Every approved event needed by preview/runtime behavior is mapped.
- [ ] Slots and declarative child content serialize without executable values.
- [ ] Built-in and user-configured validation rules round-trip through JSON.
- [ ] `<jb-form-builder>` Preview rendering matches the stored JSON configuration.
- [ ] Serialization and deserialization lose no portable configuration.
- [ ] Adapter loading and element updates meet the lazy-loading, render-isolation, and 100-element performance contract.
- [ ] Keyboard and accessibility checks pass.
- [ ] Component-specific unit and integration tests pass.
- [ ] No unresolved design-system request blocks the supported flow.
