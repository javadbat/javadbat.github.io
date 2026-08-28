import { describe, expect, it } from "vitest";
import { formPageHref, readFormSlug } from "./form-page-url";

describe("form page URLs", () => {
  it.each([
    ["landing", undefined, "/form"],
    ["builder", undefined, "/form/builder"],
    ["designer", "form-1", "/form/designer?form=form-1"],
    ["preview", "form-1", "/form/preview?form=form-1"],
  ] as const)("links the %s Astro page", (page, slug, expectedHref) => {
    expect(formPageHref(page, slug)).toBe(expectedHref);
  });

  it("reads a valid form slug from the query string", () => {
    expect(readFormSlug("?lang=fa&form=form-1")).toBe("form-1");
  });

  it.each(["", "?form=", "?form=Not%20Valid", `?form=${"a".repeat(81)}`])(
    "ignores an invalid form selection in %s",
    search => expect(readFormSlug(search)).toBeUndefined(),
  );
});
