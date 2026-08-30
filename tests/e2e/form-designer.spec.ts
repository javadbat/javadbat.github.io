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
  const mobileTabs = page.locator("[class*=mobileTabs]");
  const design = mobileTabs.getByRole("button", { name: "Design", exact: true });
  const preview = mobileTabs.getByRole("button", { name: "Preview", exact: true });

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

test("uses the demo canvas as the only preview background layer", async ({ page }) => {
  await openDesigner(page);

  const backdropImage = await page.locator("[class*=previewBackdrop]").first().evaluate(element => getComputedStyle(element).backgroundImage);
  const rendererBackground = await page.locator("jb-form-builder").evaluate(element => {
    const form = element.shadowRoot?.querySelector<HTMLElement>('[part~="form"]');
    return form?.dataset.themeBackground ?? null;
  });

  expect(backdropImage).not.toBe("none");
  expect(rendererBackground).toBeNull();
});

test("isolates inputs, choices, and actions through the component preview selector", async ({ page }) => {
  await openDesigner(page);
  await page.getByRole("button", { name: "Components" }).click();
  const selector = page.getByRole("group", { name: "Preview component" });
  const renderedTypes = () => page.locator("jb-form-builder").evaluate(element => Array.from(
    element.shadowRoot?.querySelectorAll<HTMLElement>("[data-element-type]") ?? [],
    item => item.dataset.elementType,
  ));
  const choose = async (label: string) => {
    await selector.scrollIntoViewIfNeeded();
    await selector.getByRole("button", { name: label, exact: true }).click();
  };

  await choose("Choices");
  await expect.poll(renderedTypes).toEqual(["jb-select", "jb-checkbox"]);
  await choose("Buttons");
  await expect.poll(renderedTypes).toEqual(["jb-button"]);
  await choose("Inputs");
  await expect.poll(renderedTypes).toEqual(["jb-input", "jb-input"]);
  await choose("All form controls");
  await expect.poll(renderedTypes).toEqual(["jb-input", "jb-select", "jb-input", "jb-checkbox", "jb-button"]);
});

test("flushes a pending autosave before returning to the theme library", async ({ page }) => {
  await openDesigner(page);
  await page.locator("[class*=presetRow]").getByRole("button", { name: "Academic", exact: true }).click();
  await page.getByRole("button", { name: "Back to themes" }).click();
  await expect(page.getByRole("heading", { name: "Your themes" })).toBeVisible();

  const card = page.locator("article").filter({ hasText: "Academic" }).first();
  await card.getByRole("button", { name: "Edit" }).click();
  await page.getByRole("button", { name: "Export theme" }).click();
  const exported = JSON.parse(await page.getByRole("dialog").locator("pre").textContent() ?? "{}");
  expect(exported.global?.["--jb-primary"]).toBe("#3156B8");
});

test("applies a bound theme to the standalone preview without nesting its background", async ({ page }) => {
  await openDesigner(page);
  await page.evaluate(async () => {
    const timestamp = "2026-08-30T00:00:00.000Z";
    const form = {
      recordVersion: 1,
      builderVersion: "e2e",
      id: "7cdd7fc4-8f29-4ff2-960d-74fc0dc8fc4d",
      slug: "themed-preview",
      revision: 1,
      createdAt: timestamp,
      updatedAt: timestamp,
      document: {
        $schema: "https://javadbat.github.io/schemas/jb-form/v1.json",
        schemaVersion: 1,
        id: "7cdd7fc4-8f29-4ff2-960d-74fc0dc8fc4d",
        slug: "themed-preview",
        metadata: { name: { translations: { en: "Themed preview" } }, createdAt: timestamp, updatedAt: timestamp },
        localization: { defaultLocale: "en", locales: { en: { direction: "ltr" } } },
        elements: [],
        theme: null,
      },
    };
    const theme = {
      recordVersion: 1,
      builderVersion: "e2e",
      id: "academic-theme",
      slug: "academic-theme",
      revision: 1,
      createdAt: timestamp,
      updatedAt: timestamp,
      config: {
        schemaVersion: 1,
        name: "Academic",
        global: { "--jb-primary": "#3156B8", "--jb-text-primary": "#101B48" },
        background: {
          type: "pattern",
          patternId: "academic-waves",
          color: "#F8FAFF",
          foregroundColor: "#3156B8",
          opacity: 25,
          scale: 100,
        },
      },
    };
    await new Promise<void>((resolve, reject) => {
      const request = indexedDB.open("jb-form-builder", 1);
      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        const database = request.result;
        const transaction = database.transaction(["forms", "themes", "themeSettings"], "readwrite");
        transaction.objectStore("forms").put(form);
        transaction.objectStore("themes").put(theme);
        transaction.objectStore("themeSettings").put({
          key: "current",
          recordVersion: 1,
          builderVersion: "e2e",
          defaultThemeId: null,
          bindings: { "themed-preview": theme.id },
          updatedAt: timestamp,
        });
        transaction.oncomplete = () => {
          database.close();
          resolve();
        };
        transaction.onerror = () => reject(transaction.error);
      };
    });
  });

  await page.goto("/form/preview?form=themed-preview");
  await expect(page.getByRole("heading", { name: "Themed preview" })).toBeVisible();
  const themedPage = page.locator('[data-theme-background="pattern"]');
  await expect(themedPage).toBeVisible();
  expect(await page.locator("[class*=themePageBackdrop]").evaluate(element => getComputedStyle(element).backgroundImage)).not.toBe("none");
  expect(await page.locator("jb-form-builder").evaluate(element => {
    const form = element.shadowRoot?.querySelector<HTMLElement>('[part~="form"]');
    return {
      background: form?.dataset.themeBackground ?? null,
      primary: form?.style.getPropertyValue("--jb-primary"),
    };
  })).toEqual({ background: null, primary: "#3156B8" });
});

test("creates a named blank theme and finds it through library search", async ({ page }) => {
  await openDesigner(page);
  await page.getByRole("button", { name: "Back to themes" }).click();
  await expect(page.getByRole("heading", { name: "Your themes" })).toBeVisible();

  await page.getByRole("button", { name: "Create theme" }).click();
  const dialog = page.getByRole("dialog", { name: "Create theme" });
  await dialog.getByLabel("Theme name").fill("Minimal Ocean");
  await dialog.getByLabel("Description (optional)").fill("A clean local theme");
  await dialog.getByRole("button", { name: "Create theme" }).click();

  await expect(page.getByRole("button", { name: "Export theme" })).toBeVisible();
  await expect(page.getByRole("button", { name: /Minimal Ocean/ })).toBeVisible();
  await page.getByRole("button", { name: "Back to themes" }).click();
  await page.getByLabel("Search themes").fill("ocean");
  const card = page.locator("article").filter({ hasText: "Minimal Ocean" });
  await expect(card.getByRole("button", { name: /Minimal Ocean/ })).toBeVisible();
  await card.getByRole("button", { name: "Set default" }).click();
  await expect(card.getByRole("button", { name: "Default", exact: true })).toBeDisabled();
  await expect(page.getByText("Minimal Ocean is now the default theme.")).toBeVisible();

  const downloadPromise = page.waitForEvent("download");
  await card.getByRole("button", { name: "Export theme" }).click();
  const download = await downloadPromise;
  expect(download.suggestedFilename()).toBe("minimal-ocean.jb-theme.json");

  await page.getByLabel("Search themes").fill("");
  const builtInCard = page.locator("article").filter({ hasText: "Original JB styling" });
  await builtInCard.getByRole("button", { name: "Set default" }).click();
  await expect(builtInCard.getByRole("button", { name: "Default", exact: true })).toBeDisabled();
  await expect(page.getByText("Built-in Default is now the default theme.")).toBeVisible();

  await page.getByLabel("Search themes").fill("academic");
  await expect(page.getByRole("button", { name: /Academic/ })).toBeVisible();
  await expect(builtInCard).toBeHidden();
  await page.getByLabel("Search themes").fill("missing theme");
  await expect(page.getByText("No themes match your search.")).toBeVisible();
});

test("shows inherited JB defaults without saving overrides and uses consistent radius controls", async ({ page }) => {
  await openDesigner(page);
  await page.getByRole("button", { name: "Back to themes" }).click();
  await page.getByRole("button", { name: "Create theme" }).click();
  const dialog = page.getByRole("dialog", { name: "Create theme" });
  await dialog.getByLabel("Theme name").fill("Inherited defaults");
  await dialog.getByRole("button", { name: "Create theme" }).click();

  await page.getByRole("button", { name: "Colors" }).click();
  const inheritedGreen = page.locator('jb-color-input[label="Green"]');
  await expect(inheritedGreen).toBeVisible();
  expect(await inheritedGreen.evaluate(element => (element as HTMLElement & { value: string }).value)).not.toBe("");
  await expect(inheritedGreen).toHaveAttribute("message", /will not be saved/i);
  const inheritedColors = page.locator('jb-color-input[message*="will not be saved"]');
  await expect(inheritedColors).toHaveCount(23);
  expect(await inheritedColors.evaluateAll(elements => elements
    .filter(element => !(element as HTMLElement & { value: string }).value)
    .map(element => element.getAttribute("label")))).toEqual([]);

  await page.getByRole("button", { name: "Export theme" }).click();
  const exported = JSON.parse(await page.getByRole("dialog").locator("pre").textContent() ?? "{}");
  expect(exported.global?.["--jb-green"]).toBeUndefined();
  await page.getByRole("button", { name: "Close" }).click();

  await page.getByRole("button", { name: "Size & spacing" }).click();
  const controlHeights = page.locator('jb-input[message*="Used by controls set to"]');
  await expect(controlHeights).toHaveCount(5);
  expect(await controlHeights.evaluateAll(elements => elements.map(element => (element as HTMLElement & { value: string }).value))).toEqual([
    "24px",
    "32px",
    "40px",
    "48px",
    "64px",
  ]);

  await page.getByRole("button", { name: "Shape" }).click();
  const radiusControls = [
    ["Medium element corner radius", 1],
    ["Extra small element corner radius", 0.5],
    ["Small element corner radius", 0.75],
    ["Large element corner radius", 1.25],
    ["Extra large element corner radius", 1.5],
  ];
  for (const [label, expectedValue] of radiusControls) {
    const range = page.locator(`jb-range-input[aria-label="${label}"]`);
    await expect(range).toBeVisible();
    await expect(range).toHaveAttribute("message", new RegExp(`set to ${String(label).replace(" element corner radius", "")}`, "i"));
    expect(await range.evaluate(element => (element as HTMLElement & { value: number }).value)).toBe(expectedValue);
  }
  const radiusLayout = await page.locator('jb-range-input[aria-label="Medium element corner radius"]').evaluate(element => {
    const setting = element.parentElement!;
    const label = setting.querySelector(":scope > span")!;
    const number = setting.querySelector("jb-number-input")!;
    const labelBox = label.getBoundingClientRect();
    const rangeBox = element.getBoundingClientRect();
    const numberBox = number.getBoundingClientRect();
    return {
      labelAboveControls: labelBox.bottom <= Math.min(rangeBox.top, numberBox.top),
      valueBesideRange: rangeBox.right <= numberBox.left,
    };
  });
  expect(radiusLayout).toEqual({ labelAboveControls: true, valueBesideRange: true });
});

test("keeps English Designer chrome LTR while a saved Persian form previews RTL", async ({ page }) => {
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
      const request = indexedDB.open("jb-form-builder", 1);
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

test("switches Designer chrome to persistent Persian RTL without changing the English preview", async ({ page }) => {
  await openDesigner(page);

  const language = page.locator("[class*=languageSelect]").first();
  await language.getByRole("button", { name: "Toggle options" }).click();
  await page.locator("jb-option").filter({ hasText: "FA", visible: true }).click();

  const designer = page.locator("[class*=designer]").first();
  const preview = page.locator("[class*=formPreview]").first();
  const renderer = page.locator("jb-form-builder");
  await expect(designer).toHaveAttribute("dir", "rtl");
  await expect(page.getByRole("button", { name: "خروجی پوسته" })).toBeVisible();
  await expect(renderer).toHaveAttribute("locale", "en");
  await expect(renderer).toHaveAttribute("dir", "ltr");
  expect(await preview.evaluate(element => getComputedStyle(element).direction)).toBe("ltr");
  expect(await page.evaluate(() => localStorage.getItem("jb-form:locale"))).toBe("fa");

  await page.getByRole("button", { name: "شکل" }).click();
  await expect(page.locator('jb-range-input[aria-label="گردی گوشه عنصر خیلی کوچک"]')).toBeVisible();
  await expect(page.locator('jb-range-input[aria-label="گردی گوشه عنصر متوسط"]')).toBeVisible();
  await expect(page.locator('jb-range-input[aria-label="گردی گوشه عنصر خیلی بزرگ"]')).toBeVisible();
  await page.getByRole("button", { name: "اندازه و فاصله" }).click();
  await expect(page.locator('jb-input[label="ارتفاع کنترل خیلی کوچک"]')).toBeVisible();
  await expect(page.locator('jb-input[label="ارتفاع کنترل متوسط"]')).toBeVisible();
  await expect(page.locator('jb-input[label="ارتفاع کنترل خیلی بزرگ"]')).toBeVisible();

  await page.reload();
  await expect(page.locator("[class*=designer]").first()).toHaveAttribute("dir", "rtl");
  await expect(page.getByRole("button", { name: "خروجی پوسته" })).toBeVisible();
});
