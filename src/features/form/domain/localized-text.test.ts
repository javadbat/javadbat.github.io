import { describe, expect, it } from "vitest";
import { getLocalizedText } from "./form-document";

describe("localized form text", () => {
  it("falls back to the document default locale when the app locale is unavailable", () => {
    expect(
      getLocalizedText(
        { translations: { fa: "فرم تماس" } },
        "en",
        "fa",
      ),
    ).toBe("فرم تماس");
  });
});
