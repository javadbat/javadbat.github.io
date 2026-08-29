import { expect, test, type Page } from "@playwright/test";

const targetWidths = [1440, 768, 412, 375, 320] as const;

async function openDesigner(page: Page): Promise<void> {
  await page.goto("/form/designer");
  await expect(page.getByRole("button", { name: "Export theme" })).toBeVisible();
}

test("has no page overflow and switches to compact navigation at every target width", async ({ page }) => {
  await openDesigner(page);

  for (const width of targetWidths) {
    await page.setViewportSize({ width, height: 900 });
    const state = await page.evaluate(() => {
      const tabs = document.querySelector<HTMLElement>("[class*=mobileTabs]");
      return {
        overflowX: document.documentElement.scrollWidth > document.documentElement.clientWidth,
        tabsDisplay: tabs ? getComputedStyle(tabs).display : null,
      };
    });

    expect(state.overflowX, `${width}px should not overflow horizontally`).toBe(false);
    expect(state.tabsDisplay).toBe(width <= 1024 ? "grid" : "none");
  }
});

test("supports keyboard compact navigation and 44px primary targets", async ({ page }) => {
  await openDesigner(page);
  await page.setViewportSize({ width: 320, height: 900 });
  const workspace = page.locator("main[data-mobile-panel]");
  const design = page.getByRole("button", { name: "Design", exact: true });
  const preview = page.getByRole("button", { name: "Preview", exact: true });

  await design.focus();
  await design.press("Enter");
  await expect(workspace).toHaveAttribute("data-mobile-panel", "design");
  await preview.focus();
  await preview.press("Enter");
  await expect(workspace).toHaveAttribute("data-mobile-panel", "preview");

  for (const control of [design, preview, page.getByRole("button", { name: "Export theme" })]) {
    const box = await control.boundingBox();
    expect(Math.round(box?.height ?? 0)).toBeGreaterThanOrEqual(44);
  }
});

test("keeps Designer chrome LTR while a saved Persian form previews RTL", async ({ page }) => {
  await openDesigner(page);
  await page.evaluate(async () => {
    const timestamp = "2026-08-30T00:00:00.000Z";
    const documentValue = {
      $schema: "https://javadbat.github.io/schemas/jb-form/v1.json",
      schemaVersion: 1,
      id: "9c416bbd-83e5-4ca1-b996-62ae18b99e83",
      slug: "rtl-acceptance",
      metadata: {
        name: { translations: { fa: "فرم آزمایشی راست‌به‌چپ" } },
        createdAt: timestamp,
        updatedAt: timestamp,
      },
      localization: { defaultLocale: "fa", locales: { fa: { direction: "rtl" } } },
      elements: [],
      theme: null,
    };
    const record = {
      recordVersion: 1,
      builderVersion: "e2e",
      id: documentValue.id,
      slug: documentValue.slug,
      revision: 1,
      createdAt: timestamp,
      updatedAt: timestamp,
      document: documentValue,
    };
    await new Promise<void>((resolve, reject) => {
      const request = indexedDB.open("jb-form-builder", 2);
      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        const database = request.result;
        const transaction = database.transaction("forms", "readwrite");
        transaction.objectStore("forms").put(record);
        transaction.oncomplete = () => {
          database.close();
          resolve();
        };
        transaction.onerror = () => reject(transaction.error);
      };
    });
  });

  await page.goto("/form/designer?form=rtl-acceptance");
  await expect(page.getByText("فرم آزمایشی راست‌به‌چپ", { exact: true }).first()).toBeAttached();
  const picker = page.locator("header").filter({ hasText: "Previewing:" }).locator("jb-select");
  await picker.getByRole("button", { name: "Toggle options" }).click();
  await page.locator("jb-option").filter({ hasText: "فرم آزمایشی راست‌به‌چپ", visible: true }).click();

  const designer = page.locator("[class*=designer]").first();
  const preview = page.locator("[class*=formPreview]").first();
  const renderer = page.locator("jb-form-builder");
  await expect(renderer).toHaveAttribute("locale", "fa");
  await expect(renderer).toHaveAttribute("dir", "rtl");
  await expect(page.getByRole("heading", { name: "فرم آزمایشی راست‌به‌چپ" })).toBeVisible();
  expect(await designer.evaluate(element => getComputedStyle(element).direction)).toBe("ltr");
  expect(await preview.evaluate(element => getComputedStyle(element).direction)).toBe("rtl");
});
