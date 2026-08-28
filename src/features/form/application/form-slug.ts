/** Defines the canonical, URL-safe identifier accepted for named forms. */
export const FORM_SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

/**
 * Converts a user-entered form name into a stable slug suitable for URLs and
 * the unique IndexedDB slug index, removing accents and limiting it to the
 * storage contract's 80-character maximum.
 */
export function normalizeFormSlug(value: string): string {
  return value
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80)
    .replace(/-+$/g, "");
}

/** Confirms that a form identifier can safely participate in URLs and unique storage lookup. */
export function isValidFormSlug(value: string): boolean {
  return value.length > 0 && value.length <= 80 && FORM_SLUG_PATTERN.test(value);
}
