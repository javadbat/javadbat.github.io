import { expect, test } from "@playwright/test";

const routes = ["/form", "/form/builder", "/form/designer", "/form/preview"] as const;

test("renders one visible inline navigation without horizontal overflow on every form route", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  const pageErrors: string[] = [];
  page.on("pageerror", error => pageErrors.push(error.message));
  page.on("console", message => { if (message.type() === "error") pageErrors.push(message.text()); });
  page.on("requestfailed", request => pageErrors.push(`${request.url()}: ${request.failure()?.errorText ?? "request failed"}`));
  page.on("response", response => { if (response.status() >= 400) pageErrors.push(`${response.status()} ${response.url()}`); });

  for (const route of routes) {
    await page.goto(route);
    const navigation = page.locator('nav[aria-label="Form navigation"]:visible');
    try {
      await expect(navigation).toHaveCount(1, { timeout: 20_000 });
    } catch (error) {
      throw new Error(`${route} did not hydrate. Browser errors: ${pageErrors.join(" | ") || "none"}\n${String(error)}`);
    }
    await expect(navigation.getByRole("link", { name: "All forms" })).toBeVisible();
    await expect(navigation.getByRole("link", { name: "Builder", exact: true })).toBeVisible();
    await expect(navigation.getByRole("link", { name: "Designer", exact: true })).toBeVisible();
    await expect(navigation.locator("a svg")).toHaveCount(3);
    expect(await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth), `${route} should not overflow horizontally`).toBe(false);
  }
});

test("uses the shared popover navigation on mobile", async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 900 });

  for (const route of routes) {
    await page.goto(route);
    const trigger = page.getByRole("button", { name: "Open form navigation" });
    await expect(trigger).toBeVisible({ timeout: 20_000 });
    expect(Math.round((await trigger.boundingBox())?.height ?? 0)).toBeGreaterThanOrEqual(44);
    await trigger.click();

    const navigation = page.locator('nav[aria-label="Form navigation"]:visible');
    await expect(navigation).toHaveCount(1);
    for (const label of ["All forms", "Builder", "Designer"]) {
      const link = navigation.getByRole("link", { name: label, exact: true });
      await expect(link).toBeVisible();
      expect(Math.round((await link.boundingBox())?.height ?? 0)).toBeGreaterThanOrEqual(44);
    }

    await page.keyboard.press("Escape");
    await expect(trigger).toHaveAttribute("aria-expanded", "false");
    expect(await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth), `${route} should not overflow horizontally`).toBe(false);
  }
});
