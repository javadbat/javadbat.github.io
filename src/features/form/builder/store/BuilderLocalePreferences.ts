/** Prefix that isolates per-form editing-locale preferences from exported document localization. */
const EDITING_LOCALE_KEY_PREFIX = "jb-form-builder:editing-locale:";

/** Persistence boundary for remembering which locale a user edits in each form workspace. */
export interface BuilderLocalePreferences {
  /** Reads the last editing locale for a draft or named-form scope. */
  get(scope: string): string | null;
  /** Stores the editing locale for a draft or named-form scope. */
  set(scope: string, locale: string): void;
}

/** Persists builder-only locale choices without adding them to exported form JSON. */
export class BrowserBuilderLocalePreferences implements BuilderLocalePreferences {
  /** Reads a scoped preference without letting unavailable browser storage block editing. */
  get(scope: string): string | null {
    try {
      return globalThis.localStorage?.getItem(`${EDITING_LOCALE_KEY_PREFIX}${scope}`) ?? null;
    } catch {
      return null;
    }
  }

  /** Persists a scoped preference on a best-effort basis. */
  set(scope: string, locale: string): void {
    try {
      globalThis.localStorage?.setItem(`${EDITING_LOCALE_KEY_PREFIX}${scope}`, locale);
    } catch {
      // The builder remains usable when browser storage is disabled or full.
    }
  }
}

/** Shared browser-backed editing-locale preference service. */
export const builderLocalePreferences = new BrowserBuilderLocalePreferences();
