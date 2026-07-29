# JB Form — Form-Element Support Matrix

Status: Inventory baseline; DSR-001, DSR-004, and renderer publication DSR-005 remain open  
Reviewed source: JB Design System revision `8afc94a5cae5910c2dccab35c033d4d01150d27e`

The matrix reflects direct audits of `jb-time-input@2.3.0`, `jb-file-input@3.3.0`, and `jb-switch@1.7.1` performed on 2026-07-29. DSR-004 separately blocks a reproducible recursive checkout because the latest design-system revision references an unreachable switch commit.

DSR-005 is a cross-cutting Preview release gate: local renderer work may exercise this matrix, but Phase 1 acceptance requires the published `jb-form-builder` package.

## Legend

- ✅ Verified or defined during inventory.
- ⚠️ Partially compatible; see the listed design-system request.
- ⬜ Planned work not started.
- N/A does not apply to that component.

“API” covers the package/version, value type, editable public properties, events, slots, parts, built-in validation, React wrapper, and styling-hook surface documented in `COMPONENT-INVENTORY.md`.

## Addable components

| Component | Inventory | API | Form contract | Validation | Minimum config | JSON mapping | Registry adapter | Tests | Blocker |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| `jb-input` | ✅ | ✅ | ✅ | ✅ | ✅ | ⬜ | ⬜ | ⬜ | — |
| `jb-number-input` | ✅ | ✅ | ✅ inherited | ✅ | ✅ | ⬜ | ⬜ | ⬜ | — |
| `jb-mobile-input` | ✅ | ✅ | ✅ inherited | ✅ | ✅ | ⬜ | ⬜ | ⬜ | — |
| `jb-password-input` | ✅ | ✅ | ✅ inherited | ✅ | ✅ | ⬜ | ⬜ | ⬜ | — |
| `jb-payment-input` | ✅ | ✅ | ✅ inherited | ✅ | ✅ | ⬜ | ⬜ | ⬜ | — |
| `jb-national-input` | ✅ | ✅ | ✅ inherited | ✅ | ✅ | ⬜ | ⬜ | ⬜ | — |
| `jb-date-input` | ✅ | ✅ | ✅ | ✅ | ✅ | ⬜ | ⬜ | ⬜ | — |
| `jb-time-input` | ✅ | ✅ | ⚠️ | ✅ | ✅ | ⬜ | ⬜ | ⬜ | DSR-001 |
| `jb-pin-input` | ✅ | ✅ | ✅ | ✅ | ✅ | ⬜ | ⬜ | ⬜ | — |
| `jb-textarea` | ✅ | ✅ | ✅ | ✅ | ✅ | ⬜ | ⬜ | ⬜ | — |
| `jb-select` | ✅ | ✅ | ✅ | ✅ | ✅ | ⬜ | ⬜ | ⬜ | JSON-safe options/rendering |
| `jb-checkbox` | ✅ | ✅ | ✅ | ✅ | ✅ | ⬜ | ⬜ | ⬜ | — |
| `jb-switch` | ✅ | ✅ | ✅ | ✅ | ✅ | ⬜ | ⬜ | ⬜ | — |
| `jb-file-input` | ✅ | ✅ | ✅ | ✅ | ✅ | ⬜ | ⬜ | ⬜ | — |
| `jb-image-input` | ✅ | ✅ | ✅ | ✅ | ✅ | ⬜ | ⬜ | ⬜ | Serializable bridge reference |
| `jb-button` | ✅ | ✅ | N/A | N/A | ✅ | ⬜ | ⬜ | ⬜ | — |

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
- [ ] Keyboard and accessibility checks pass.
- [ ] Component-specific unit and integration tests pass.
- [ ] No unresolved design-system request blocks the supported flow.
