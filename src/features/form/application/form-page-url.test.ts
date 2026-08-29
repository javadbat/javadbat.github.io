import { describe, expect, it } from "vitest";
import { formPageHref, readFormSlug, readThemeSlug } from "./form-page-url";

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

  it("links and reads independent form/theme selections", () => {
    expect(formPageHref("designer", "form-1", "rose-pop")).toBe("/form/designer?form=form-1&theme=rose-pop");
    expect(formPageHref("designer", undefined, "rose-pop")).toBe("/form/designer?theme=rose-pop");
    expect(readThemeSlug("?form=form-1&theme=rose-pop")).toBe("rose-pop");
    expect(readThemeSlug("?theme=Not%20Valid")).toBeUndefined();
  });
});
