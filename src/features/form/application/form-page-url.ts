import { isValidFormSlug } from "./form-slug";

/** Names the `/form` business surfaces that can preserve a selected form. */
export type FormPage = "landing" | "builder" | "designer" | "preview";

/** Carries the selected named-form identity between independently rendered routes. */
const FORM_SLUG_QUERY_PARAMETER = "form";

/** Maps each form workflow surface to its public Astro route. */
const FORM_PAGE_PATHS: Record<FormPage, string> = {
  landing: "/form",
  builder: "/form/builder",
  designer: "/form/designer",
  preview: "/form/preview",
};

/**
 * Builds a link to a form workflow page and preserves the selected named-form
 * identity as query state. Landing intentionally drops identity because it is
 * the form-selection surface rather than an editor for one record.
 */
export function formPageHref(page: FormPage, slug?: string): string {
  /** Public route for the requested workflow surface. */
  const path = FORM_PAGE_PATHS[page];
  if (!slug || page === "landing") return path;

  /** Encoded query state that transfers form ownership to the destination route. */
  const search = new URLSearchParams({ [FORM_SLUG_QUERY_PARAMETER]: slug });
  return `${path}?${search}`;
}

/**
 * Reads and validates the selected form slug from a URL search string so
 * malformed external links never reach repository lookup operations.
 */
export function readFormSlug(search: string): string | undefined {
  /** Candidate identity supplied by browser-controlled URL state. */
  const slug = new URLSearchParams(search).get(FORM_SLUG_QUERY_PARAMETER);
  return slug && isValidFormSlug(slug) ? slug : undefined;
}

/** Reads the browser-owned form selection while remaining safe during server rendering. */
export function getCurrentFormSlug(): string | undefined {
  return typeof window === "undefined" ? undefined : readFormSlug(window.location.search);
}
