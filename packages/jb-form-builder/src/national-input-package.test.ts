// @vitest-environment happy-dom

import { expect, it } from "vitest";

it("loads the published jb-national-input package from a clean ESM boundary", async () => {
  await expect(import("jb-national-input")).resolves.toBeDefined();
});
