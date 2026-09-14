# JB component upgrade — September 2026

Updated the 30 external JB dependencies while retaining local `file:` package links. Reviewed upstream changelogs and installed manifests, declarations, and CSS; verified published versions on npm, including time-input 3.0.2's September 14 initial-value fix.

## Compatibility changes

| Previous contract | Current handling |
| --- | --- |
| Select `hideClear` | Inverted `clearable`; explicit false stays `clearable="false"` |
| Input clear control | New opt-in `clearable` builder setting |
| File/image `acceptTypes` | `accept`; legacy arrays become comma-separated strings |
| Time `frontalZero` | `leadingZero` |
| Date custom `direction` | Native `dir` |
| File/image `uploading` attribute | `is-uploading`; application-owned upload orchestration |
| Image `imageSelected`, `maxSizeExceed` | `image-selected`, `max-size-exceed` |
| Directional section slots | Logical `inline-start` / `inline-end` |
| Input `input-box` part | `control` |
| Modal `content-box` part | `content`, including portfolio consumers |
| Calling native component reset callbacks | Public `reset()` |
| Input/textarea box margin, overflow, shadow, focus-shadow tokens | Corresponding `--jb-control-*` tokens |
| `--jb-textarea-input-box-bg-color` | `--jb-textarea-control-bg-color` |

Saved forms and themes migrate on detached copies during validation, including inherited tokens and nested containers. Explicit current keys win. Unknown data still fails validation; caller objects remain unchanged. Saving persists canonical data.

Also checked consumers for React keyboard event casing, option `isActive`, picker `open()` / `close()` / `isOpen`, date `valueAsDate` / `displayValue`, validation methods, button `is-loading`, and native modal `url-open` versus React `onUrlOpen`.

## Component-data ownership

Edit `src/features/form/component-data/<component>/theme-tokens.ts`, `property-migrations.ts`, and `theme-token-migrations.ts`. The generator lives in the same component-data directory; renderer package copies are generated, not another editable source:

```sh
node src/features/form/component-data/sync-package-data.mjs
node src/features/form/component-data/sync-package-data.mjs --check
```

Renderer prebuild synchronizes these files without making the published package import application source. Catalogs include current public manifest/CSS tokens, shared input/textarea control tokens, and tab subcomponent tokens.

## Dependency and verification notes

`jb-color-input@0.4.0` still declares an exact older `jb-form` peer. The root override aligns it with `0.14.0`, without `--legacy-peer-deps`. npm reports seven audit advisories (two moderate, four high, one critical); no unrelated blanket audit upgrade was applied.

Exact installed versions are in `package-lock.json`. Production builds now include all four local form packages. Browser coverage checks every registered component, reset/submission, saved-data migration, clear controls, theme editing/computed focus styling, autosave/library navigation, responsive routes, and Persian interface persistence.
