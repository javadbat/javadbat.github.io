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
    expect(state.tabsDisplay).toBe(width <= 1024 ? "block" : "none");
  }
});

test("supports keyboard compact navigation and 44px primary targets", async ({ page }) => {
  await openDesigner(page);
  await page.setViewportSize({ width: 320, height: 900 });
  const workspace = page.locator("main[data-mobile-panel]");
  const mobileTabs = page.locator("[class*=mobileTabs]");
  const mobileHeader = page.locator("[class*=mobileHeaderActions]");
  const design = mobileTabs.locator('jb-tab-trigger[value="design"]');
  const preview = mobileTabs.locator('jb-tab-trigger[value="preview"]');
  const previewRoute = mobileHeader.getByRole("link", { name: "Preview", exact: true });
  const more = mobileHeader.getByRole("button", { name: "More", exact: true });

  await design.focus();
  await design.press("Enter");
  await expect(workspace).toHaveAttribute("data-mobile-panel", "design");
  await preview.focus();
  await preview.press("Enter");
  await expect(workspace).toHaveAttribute("data-mobile-panel", "preview");

  for (const control of [design, preview, previewRoute, more]) {
    const box = await control.boundingBox();
    expect(Math.round(box?.height ?? 0)).toBeGreaterThanOrEqual(44);
  }

  await more.focus();
  await more.press("Enter");
  const actions = page.getByRole("dialog", { name: "Theme actions" });
  await expect(actions.getByRole("link", { name: "Builder" })).toBeVisible();
  const exportTheme = actions.getByRole("button", { name: "Export theme" });
  await expect(exportTheme).toBeVisible();
  expect(Math.round((await exportTheme.boundingBox())?.height ?? 0)).toBeGreaterThanOrEqual(44);
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

test("groups component tokens and filters them by interaction state", async ({ page }) => {
  await openDesigner(page);
  await page.getByRole("button", { name: "Components" }).click();

  const componentSelect = page.locator('jb-select[label="Component to customize"]');
  await componentSelect.getByRole("button", { name: "Toggle options" }).click();
  await page.locator("jb-option").filter({ hasText: "Text input", visible: true }).click();

  const tokenList = page.getByRole("listbox", { name: "Component style properties" });
  await expect(tokenList.getByRole("group", { name: "Colors" })).toBeVisible();
  await expect(tokenList.getByRole("group", { name: "Border & shape" })).toBeVisible();
  await expect.poll(() => tokenList.getByRole("option").count()).toBeGreaterThan(36);

  const stateFilter = page.locator('jb-select[label="State"]');
  await stateFilter.getByRole("button", { name: "Toggle options" }).click();
  await stateFilter.locator("jb-option").filter({ hasText: "Focus", visible: true }).click();
  const focusTokens = await tokenList.getByRole("option").locator("code").allTextContents();
  expect(focusTokens.length).toBeGreaterThan(0);
  expect(focusTokens.every(token => token.includes("focus"))).toBe(true);

  await stateFilter.getByRole("button", { name: "Toggle options" }).click();
  await stateFilter.locator("jb-option").filter({ hasText: "Default", visible: true }).click();
  const defaultTokens = await tokenList.getByRole("option").locator("code").allTextContents();
  expect(defaultTokens.length).toBeGreaterThan(0);
  expect(defaultTokens.every(token => !/(?:hover|focus|active|pressed|disabled)/.test(token))).toBe(true);
});

test("forces an interaction state in the isolated component preview", async ({ page }) => {
  await openDesigner(page);
  await page.getByRole("button", { name: "Components" }).click();

  const componentSelect = page.locator('jb-select[label="Component to customize"]');
  await componentSelect.getByRole("button", { name: "Toggle options" }).click();
  await page.locator("jb-option").filter({ hasText: "Text input", visible: true }).click();
  await page.getByLabel("Search style properties").fill("border color focus");
  await page.getByRole("listbox", { name: "Component style properties" })
    .getByRole("option").filter({ hasText: "--jb-input-border-color-focus" }).click();
  await page.getByLabel("Border color focus override").fill("#123456");
  await page.getByLabel("Border color focus override").press("Enter");

  const previewState = page.locator('jb-select[label="Preview state"]');
  const chooseState = async (state: string) => {
    await previewState.getByRole("button", { name: "Toggle options" }).click();
    await previewState.locator("jb-option").filter({ hasText: state, visible: true }).click();
  };
  const previewBorderColor = () => page.locator("jb-form-builder").evaluate(element => {
    const input = element.shadowRoot?.querySelector<HTMLElement>("jb-input");
    const inputBox = input?.shadowRoot?.querySelector<HTMLElement>(".input-box");
    return {
      state: input?.getAttribute("data-designer-preview-state") ?? "",
      borderColor: inputBox ? getComputedStyle(inputBox).borderColor : "",
      hasForcedStyle: Boolean(input?.shadowRoot?.querySelector("style[data-designer-preview-state-style]")),
    };
  });

  await chooseState("Focus");
  await expect.poll(previewBorderColor).toEqual({ state: "focus", borderColor: "rgb(18, 52, 86)", hasForcedStyle: true });
  const accessibility = page.getByLabel("Component accessibility diagnostics");
  await expect(accessibility).toContainText(/\d+\.\d{2}:1/);
  await expect(accessibility).toContainText(/Passes AAA|Passes AA|Needs attention/);
  await expect(accessibility).toContainText("Visible change detected");
  await chooseState("Default");
  await expect.poll(previewBorderColor).not.toEqual({ state: "focus", borderColor: "rgb(18, 52, 86)", hasForcedStyle: true });
});

test("audits every component state and jumps to a failing token", async ({ page }) => {
  await openDesigner(page);
  await page.getByRole("button", { name: "Components" }).click();
  const componentSelect = page.locator('jb-select[label="Component to customize"]');
  await componentSelect.getByRole("button", { name: "Toggle options" }).click();
  await page.locator("jb-option").filter({ hasText: "Text input", visible: true }).click();

  const setToken = async (search: string, token: string, label: string, value: string) => {
    await page.getByLabel("Search style properties").fill(search);
    await page.getByRole("listbox", { name: "Component style properties" })
      .getByText(token, { exact: true }).locator("..").click();
    await page.getByLabel(label).fill(value);
    await page.getByLabel(label).press("Enter");
  };
  await setToken("value color", "--jb-input-value-color", "Value color override", "#ffffff");
  await setToken("bg color", "--jb-input-bg-color", "Bg color override", "#ffffff");

  await page.getByRole("button", { name: "Run accessibility audit" }).click();
  const audit = page.getByLabel("Component accessibility audit");
  await expect(audit).toContainText(/Text contrast is 1\.00:1/);
  await expect(audit.locator("code").first()).toContainText("--jb-input-value-color");
  await audit.getByRole("button", { name: "Review" }).first().click();
  await expect(page.getByLabel("Value color override")).toBeVisible();

  await audit.getByRole("button", { name: "Preview fix" }).first().click();
  const fixStatus = audit.getByRole("status");
  await expect(fixStatus).toContainText(/Previewing #[0-9a-f]{6} at [4-9]\.[0-9]{2}:1/);
  await expect(fixStatus).toContainText("The theme has not changed");
  await expect(page.getByLabel("Value color override")).toHaveValue("#ffffff");
  await audit.getByRole("button", { name: "Apply fix" }).click();
  await expect(page.getByLabel("Value color override")).not.toHaveValue("#ffffff");
  await expect(page.getByRole("button", { name: "Undo" })).toBeEnabled();
});

test("edits and removes a validated component token override", async ({ page }) => {
  await openDesigner(page);
  await page.getByRole("button", { name: "Components" }).click();

  const componentSelect = page.locator('jb-select[label="Component to customize"]');
  await componentSelect.getByRole("button", { name: "Toggle options" }).click();
  await page.locator("jb-option").filter({ hasText: "Text input", visible: true }).click();

  await expect.poll(() => page.locator("jb-form-builder").evaluate(element => Array.from(
    element.shadowRoot?.querySelectorAll<HTMLElement>("[data-element-type]") ?? [],
    item => item.dataset.elementType,
  ))).toEqual(["jb-input", "jb-input"]);

  await page.getByLabel("Search style properties").fill("border color");
  const tokenList = page.getByRole("listbox", { name: "Component style properties" });
  await tokenList.getByRole("option").filter({ hasText: "--jb-input-border-color" }).first().click();
  const overrideInput = page.getByLabel("Border color override");
  await overrideInput.fill("#123456");
  await overrideInput.press("Enter");

  const runtimeValue = () => page.locator("jb-form-builder").evaluate(element => (
    element.shadowRoot?.querySelector<HTMLElement>("jb-input")?.style.getPropertyValue("--jb-input-border-color") ?? ""
  ));
  await expect.poll(runtimeValue).toBe("#123456");
  const effectiveValue = page.getByLabel("Effective token value");
  await expect(effectiveValue).toContainText("Component override");
  await expect(effectiveValue).toContainText("#123456");

  const colorPicker = page.getByRole("textbox", { name: "Color picker" });
  await colorPicker.fill("#345678");
  await overrideInput.focus();
  await expect.poll(runtimeValue).toBe("#345678");
  await overrideInput.fill("#123456");
  await overrideInput.press("Enter");

  await overrideInput.fill("red; display: none");
  await overrideInput.press("Enter");
  await expect(page.getByText("Enter a valid CSS value without semicolons or braces.")).toBeVisible();
  await expect.poll(runtimeValue).toBe("#123456");
  await overrideInput.fill("#123456");
  await overrideInput.press("Enter");

  await overrideInput.fill("#234567");
  await page.getByLabel("Search style properties").focus();
  await expect.poll(runtimeValue).toBe("#234567");
  await overrideInput.fill("#123456");
  await overrideInput.press("Enter");

  const overridesOnly = page.locator('jb-checkbox[label="Show overridden properties only"]');
  await overridesOnly.click();
  await expect(tokenList.getByRole("option")).toHaveCount(1);
  await overridesOnly.click();

  await page.getByRole("button", { name: "Export theme" }).click();
  const exported = JSON.parse(await page.getByRole("dialog").locator("pre").textContent() ?? "{}");
  expect(exported.components?.["jb-input"]?.tokens?.["--jb-input-border-color"]).toBe("#123456");
  await page.getByRole("button", { name: "Close" }).click();

  await page.getByRole("button", { name: "Use inherited value" }).click();
  await expect.poll(runtimeValue).toBe("");
  await expect(effectiveValue).toContainText(/Global theme|JB default/);
  await expect(effectiveValue).not.toContainText("#123456");

  await overrideInput.fill("#654321");
  await overrideInput.press("Enter");
  await expect.poll(runtimeValue).toBe("#654321");
  page.once("dialog", dialog => dialog.accept());
  await page.getByRole("button", { name: "Reset component" }).click();
  await expect.poll(runtimeValue).toBe("");
  await expect(page.getByText("0 component overrides")).toBeVisible();
});

test("edits a recognized component length with a value and unit", async ({ page }) => {
  await openDesigner(page);
  await page.getByRole("button", { name: "Components" }).click();

  const componentSelect = page.locator('jb-select[label="Component to customize"]');
  await componentSelect.getByRole("button", { name: "Toggle options" }).click();
  await page.locator("jb-option").filter({ hasText: "Text input", visible: true }).click();

  await page.getByLabel("Search style properties").fill("border radius");
  const tokenList = page.getByRole("listbox", { name: "Component style properties" });
  await tokenList.getByRole("option").filter({ hasText: "--jb-input-border-radius" }).first().click();

  const runtimeValue = () => page.locator("jb-form-builder").evaluate(element => (
    element.shadowRoot?.querySelector<HTMLElement>("jb-input")?.style.getPropertyValue("--jb-input-border-radius") ?? ""
  ));
  const sizeValue = page.getByRole("textbox", { name: "Size value" });
  await sizeValue.fill("12");
  await page.getByLabel("Border radius override").focus();
  await expect.poll(runtimeValue).toBe("12px");

  const unitSelect = page.locator('jb-select[label="Unit"]');
  await unitSelect.getByRole("button", { name: "Toggle options" }).click();
  await unitSelect.locator("jb-option").filter({ hasText: "rem", visible: true }).click();
  await expect.poll(runtimeValue).toBe("12rem");
  await expect(page.getByLabel("Border radius override")).toHaveValue("12rem");

  await page.getByLabel("Border radius override").fill("calc(1rem + 2px)");
  await page.getByLabel("Border radius override").press("Enter");
  await expect.poll(runtimeValue).toBe("calc(1rem + 2px)");
  await expect(sizeValue).toHaveValue("");
});

test("uses suggested values for enumerated component properties", async ({ page }) => {
  await openDesigner(page);
  await page.getByRole("button", { name: "Components" }).click();

  const componentSelect = page.locator('jb-select[label="Component to customize"]');
  await componentSelect.getByRole("button", { name: "Toggle options" }).click();
  await page.locator("jb-option").filter({ hasText: "Text input", visible: true }).click();
  await page.getByLabel("Search style properties").fill("text align");
  await page.getByRole("listbox", { name: "Component style properties" })
    .getByRole("option").filter({ hasText: "--jb-input-input-text-align" }).click();

  const suggestedValue = page.locator('jb-select[label="Suggested value"]');
  await suggestedValue.getByRole("button", { name: "Toggle options" }).click();
  await suggestedValue.locator("jb-option").filter({ hasText: "center", visible: true }).click();

  const runtimeValue = () => page.locator("jb-form-builder").evaluate(element => (
    element.shadowRoot?.querySelector<HTMLElement>("jb-input")?.style.getPropertyValue("--jb-input-input-text-align") ?? ""
  ));
  await expect.poll(runtimeValue).toBe("center");
  await expect(page.getByLabel("Input text align override")).toHaveValue("center");
});

test("edits a component opacity with a bounded typed control", async ({ page }) => {
  await openDesigner(page);
  await page.getByRole("button", { name: "Components" }).click();

  const componentSelect = page.locator('jb-select[label="Component to customize"]');
  await componentSelect.getByRole("button", { name: "Toggle options" }).click();
  await page.locator("jb-option").filter({ hasText: "Switch", visible: true }).click();
  await page.getByLabel("Search style properties").fill("opacity disabled");
  await page.getByRole("listbox", { name: "Component style properties" })
    .getByRole("option").filter({ hasText: "--jb-switch-opacity-disabled" }).click();

  const opacityValue = page.getByRole("textbox", { name: "Opacity value" });
  await opacityValue.fill("0.4");
  await page.getByLabel("Opacity disabled override").focus();

  const runtimeValue = () => page.locator("jb-form-builder").evaluate(element => (
    element.shadowRoot?.querySelector<HTMLElement>("jb-switch")?.style.getPropertyValue("--jb-switch-opacity-disabled") ?? ""
  ));
  await expect.poll(runtimeValue).toBe("0.4");
  await expect(page.getByLabel("Opacity disabled override")).toHaveValue("0.4");
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
  await expect(inheritedColors).toHaveCount(6);
  expect(await inheritedColors.evaluateAll(elements => elements
    .filter(element => !(element as HTMLElement & { value: string }).value)
    .map(element => element.getAttribute("label")))).toEqual([]);

  await page.getByRole("button", { name: "Export theme" }).click();
  const exported = JSON.parse(await page.getByRole("dialog").locator("pre").textContent() ?? "{}");
  expect(exported.global?.["--jb-green"]).toBeUndefined();
  await page.getByRole("button", { name: "Close" }).click();

  await page.getByRole("button", { name: "Size & spacing" }).click();
  const baseControlHeight = page.locator('jb-input[label="Medium control height"]');
  await expect(baseControlHeight).toBeVisible();
  expect(await baseControlHeight.evaluate(element => (element as HTMLElement & { value: string }).value)).toBe("40px");

  await page.getByRole("button", { name: "Customize size scale" }).first().click();
  const advancedSizes = page.getByRole("dialog", { name: "Need precise size control?" });
  const controlHeights = advancedSizes.locator('jb-input[label$="control height"]');
  await expect(controlHeights).toHaveCount(5);
  expect(await controlHeights.evaluateAll(elements => elements.map(element => (element as HTMLElement & { value: string }).value))).toEqual([
    "40px",
    "24px",
    "32px",
    "48px",
    "64px",
  ]);

  const radiusControls = [
    ["Medium element corner radius", 1],
    ["Extra small element corner radius", 0.5],
    ["Small element corner radius", 0.75],
    ["Large element corner radius", 1.25],
    ["Extra large element corner radius", 1.5],
  ];
  for (const [label, expectedValue] of radiusControls) {
    const range = advancedSizes.locator(`jb-range-input[aria-label="${label}"]`);
    await expect(range).toBeVisible();
    expect(await range.evaluate(element => (element as HTMLElement & { value: number }).value)).toBe(expectedValue);
  }
  const radiusLayout = await advancedSizes.locator('jb-range-input[aria-label="Medium element corner radius"]').evaluate(element => {
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
  await advancedSizes.getByRole("button", { name: "Cancel" }).click();

  await page.getByRole("button", { name: "Shape" }).click();
  await expect(page.locator('jb-range-input[aria-label="Medium element corner radius"]')).toBeVisible();
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
  await expect(page.locator('jb-range-input[aria-label="گردی گوشه عنصر متوسط"]')).toBeVisible();
  await page.getByRole("button", { name: "اندازه و فاصله" }).click();
  await expect(page.locator('jb-input[label="ارتفاع کنترل متوسط"]')).toBeVisible();

  await page.reload();
  await expect(page.locator("[class*=designer]").first()).toHaveAttribute("dir", "rtl");
  await expect(page.getByRole("button", { name: "خروجی پوسته" })).toBeVisible();
});
