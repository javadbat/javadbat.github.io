const EDITING_LOCALE_KEY_PREFIX = "jb-form-builder:editing-locale:";

export interface BuilderLocalePreferences {
  get(scope: string): string | null;
  set(scope: string, locale: string): void;
}

/** Persists builder-only locale choices without adding them to exported form JSON. */
export class BrowserBuilderLocalePreferences implements BuilderLocalePreferences {
  get(scope: string): string | null {
    try {
      return globalThis.localStorage?.getItem(`${EDITING_LOCALE_KEY_PREFIX}${scope}`) ?? null;
    } catch {
      return null;
    }
  }

  set(scope: string, locale: string): void {
    try {
      globalThis.localStorage?.setItem(`${EDITING_LOCALE_KEY_PREFIX}${scope}`, locale);
    } catch {
      // The builder remains usable when browser storage is disabled or full.
    }
  }
}

export const builderLocalePreferences = new BrowserBuilderLocalePreferences();
