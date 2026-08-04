# JB Form Theme JSON Schema

Status: Phase 2 schema definition complete; runtime implementation pending  
Reviewed: 2026-08-04

This document defines how theme data will be attached to the portable form document. It does not implement the Theme Builder UI and does not move Designer work out of Phase 3.

## Relationship to the form document

- Form document schema version 1 remains unchanged. Its required `theme` field is `null`, which means the default JB theme.
- Form document schema version 2 will retain `theme` as a required nullable field. `null` continues to mean “use the default JB theme.”
- A non-null theme is a versioned object with its own `schemaVersion`. The form document owns that object; theme data is not stored as a second document or as element props.
- Theme data is portable and is included in Save, export, import, IndexedDB records, and renderer input.
- Theme data changes presentation only. It must not change form identity, element identity/order, element values, validation rules, or the runtime response payload.
- A v1 document migrates to v2 by preserving `theme: null`. No element property is reinterpreted as theme data.

## Proposed v2 shape

The following is the Phase 2 contract shape. Exact allowlists and value validation remain intentionally deferred; Theme Builder behavior is defined first in `THEME-BEHAVIOR.md`.

```json
{
  "theme": {
    "schemaVersion": 1,
    "preset": null,
    "globals": {
      "tokens": {
        "--jb-primary": "oklch(0.6 0.26 256)",
        "--jb-radius": "1rem"
      }
    },
    "components": {
      "jb-input": {
        "tokens": {
          "--jb-input-border-color": "var(--jb-primary)"
        },
        "parts": {
          "input-box": {
            "styles": {
              "border-radius": "var(--jb-radius)",
              "corner-shape": "squircle"
            }
          }
        }
      }
    }
  }
}
```

The enclosing form document keeps its existing top-level fields, changes `$schema` and `schemaVersion` to version 2, and accepts this object in its `theme` field.

## Field rules

| Field | Rule |
| --- | --- |
| `theme.schemaVersion` | Positive integer owned by the theme contract; starts at `1`. |
| `theme.preset` | Nullable local preset identifier. It is not a URL, module name, or executable reference. |
| `theme.globals.tokens` | Map of allowlisted shared JB token names to CSS values. The allowlist comes from `jb-core/theme`. |
| `theme.components` | Map keyed by supported JB custom-element tag name. Unknown component keys are rejected. |
| `components[*].tokens` | Map of allowlisted public component CSS custom properties to CSS values. |
| `components[*].parts` | Map of allowlisted public part names to style declarations. The renderer generates the corresponding `::part(...)` selector. |
| `parts[*].styles` | JSON-safe CSS declaration map validated against the component's public styling contract. Selector text and arbitrary CSS blocks are not accepted. |

All values must be JSON-safe strings, numbers, booleans, arrays, or objects allowed by the final schema. Functions, DOM nodes, callbacks, uploaded `File` objects, and generated CSS text are not portable theme values.

## Styling and corner geometry

There is no global `corner-shape` token. `corner-shape: squircle` may appear only in a component part declaration that is emitted through the matching public `::part(...)` selector. The shared `--jb-radius*` tokens remain available for radius values and progressive-enhancement fallbacks.

Private Shadow DOM descendants and undocumented selectors are never valid theme targets. App-owned Builder, Designer, and Preview surfaces remain outside `theme.components` and use application CSS.

## Theme resolution

The renderer resolves the effective theme in this order:

1. JB component defaults and shared `jb-core` defaults.
2. The selected local preset, if any.
3. `theme.globals.tokens`.
4. Component token overrides in `theme.components`.
5. Public part declarations in `theme.components[*].parts`.

The same resolved theme is used by Preview and the future Theme Designer. Phase 2 may provide editing and preview operations without implementing the Designer route; Designer implementation remains Phase 3.

## Compatibility

- A missing or `null` theme renders with the default JB theme.
- A theme object with an unsupported `schemaVersion` is rejected with a recoverable document issue; it is not silently downgraded.
- Imports must validate the complete form document and theme object before persistence.
- Export preserves the theme object exactly after canonical JSON key ordering.

## Next decision

The global-token versus component-level override allowlists and precedence details remain deferred by the current plan.
