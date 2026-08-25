import { describe, expect, it } from "vitest";
import { formRouteTitle, parseFormRoute } from "./form-route";

describe("form route titles", () => {
  it.each([
    ["/form", "JB Form"],
    ["/form/builder/form1", "JB Form Builder"],
    ["/form/designer/form1", "JB Form Designer"],
    ["/form/preview/form1", "JB Form Preview"],
  ])("uses the correct title for %s", (pathname, expectedTitle) => {
    const route = parseFormRoute(pathname);

    expect(route).not.toBeNull();
    expect(formRouteTitle(route!.surface)).toBe(expectedTitle);
  });
});
