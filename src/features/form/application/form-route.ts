export type FormSurface = "landing" | "builder" | "designer" | "preview";

export interface FormRoute {
  surface: FormSurface;
  slug?: string;
}

const FORM_ROUTE_TITLES: Record<FormSurface, string> = {
  landing: "JB Form",
  builder: "JB Form Builder",
  designer: "JB Form Designer",
  preview: "JB Form Preview",
};

const FORM_ROUTE_PATTERN = /^\/form(?:\/(builder|designer|preview)(?:\/([a-z0-9]+(?:-[a-z0-9]+)*))?)?\/?$/;

export function parseFormRoute(pathname: string): FormRoute | null {
  const match = pathname.match(FORM_ROUTE_PATTERN);
  if (!match) {
    return null;
  }
  if (match[2] && match[2].length > 80) {
    return null;
  }

  return {
    surface: (match[1] as FormSurface | undefined) ?? "landing",
    slug: match[2],
  };
}

export function formRouteHref(surface: FormSurface, slug?: string): string {
  if (surface === "landing") {
    return "/form";
  }

  return `/form/${surface}${slug ? `/${encodeURIComponent(slug)}` : ""}`;
}

export function formRouteTitle(surface: FormSurface): string {
  return FORM_ROUTE_TITLES[surface];
}

export function getCurrentFormRoute(): FormRoute {
  if (typeof window === "undefined") {
    return { surface: "landing" };
  }

  return parseFormRoute(window.location.pathname) ?? { surface: "landing" };
}
