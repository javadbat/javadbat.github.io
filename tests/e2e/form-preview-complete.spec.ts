import { expect, test, type Page } from "@playwright/test";
import {
  createDefaultElement,
  formElementRegistry,
} from "../../packages/jb-form-builder/src/registry/form-element-registry";
import type {
  JBFormDocumentV1,
  JBFormElementV1,
  JBFormLeafElementV1,
} from "../../packages/jb-form-builder/src/contract/form-document";

const FORM_SLUG = "complete-preview-acceptance";
const FORM_NAME = "Complete component preview";

function localized(value: string) {
  return { translations: { en: value } };
}

function buildCompleteDocument(): JBFormDocumentV1 {
  const byType = (type: string, name: string) => {
    const entry = formElementRegistry.find(candidate => candidate.type === type);
    if (!entry) throw new Error(`Missing registry entry for ${type}`);
    return createDefaultElement(entry, name) as JBFormElementV1;
  };

  const leaf = (type: string, name: string): JBFormLeafElementV1 => byType(type, name) as JBFormLeafElementV1;
  const elements = formElementRegistry.map((entry, index) => byType(entry.type, `preview_${entry.type.replaceAll("-", "_")}_${index + 1}`));

  const text = elements.find(element => element.type === "text")!;
  text.props.content = localized("Configured text content");
  const image = elements.find(element => element.type === "image")!;
  image.props.url = "data:image/gif;base64,R0lGODlhAQABAAD/ACwAAAAAAQABAAACADs=";
  image.props.alt = localized("Configured preview image");
  const voice = elements.find(element => element.type === "voice")!;
  voice.props.url = "data:audio/wav;base64,UklGRg==";
  const link = elements.find(element => element.type === "link")!;
  link.props.content = localized("Configured preview link");
  link.props.url = "https://example.com/complete-preview";

  const input = elements.find(element => element.type === "jb-input")!;
  input.initialValue = "Initial configured value";
  input.label = localized("Configured text input");
  input.placeholder = localized("Type a configured value");
  const number = elements.find(element => element.type === "jb-number-input")!;
  number.initialValue = "7";
  const range = elements.find(element => element.type === "jb-range-input")!;
  range.initialValue = 6;
  const select = elements.find(element => element.type === "jb-select")!;
  select.initialValue = "option_1";
  select.props.options = [
    { id: "option_1", value: "option_1", label: localized("Configured option"), disabled: false },
    { id: "option_2", value: "option_2", label: localized("Second option"), disabled: false },
  ];
  const listbox = elements.find(element => element.type === "jb-listbox")!;
  listbox.props.options = [
    { id: "option_1", value: "option_1", label: localized("Configured list option"), disabled: false },
  ];
  const checkbox = elements.find(element => element.type === "jb-checkbox")!;
  checkbox.initialValue = true;
  const switchElement = elements.find(element => element.type === "jb-switch")!;
  switchElement.initialValue = true;
  const button = elements.find(element => element.type === "jb-button")!;
  button.props.content = localized("Configured action");

  const tabs = elements.find(element => element.type === "jb-tab");
  if (tabs?.type === "jb-tab") {
    tabs.tabs[0].children.push(leaf("jb-input", "tab_input"));
    tabs.tabs[1].children.push(leaf("jb-textarea", "tab_textarea"));
  }
  const condition = elements.find(element => element.type === "jb-condition");
  if (condition?.type === "jb-condition") {
    condition.conditions.rules.push({
      id: "c2d3e4f5-6071-489a-b2c3-d4e5f6071829",
      fieldName: input.name,
      operator: "equals",
      value: input.initialValue ?? "",
    });
    condition.children.push(leaf("jb-input", "conditional_input"));
  }
  const wizard = elements.find(element => element.type === "jb-form-wizard");
  if (wizard?.type === "jb-form-wizard") {
    wizard.steps[0].children.push(leaf("jb-input", "wizard_input"));
    wizard.steps[1].children.push(leaf("jb-checkbox", "wizard_checkbox"));
  }
  const repeatable = elements.find(element => element.type === "jb-repeatable-group");
  if (repeatable?.type === "jb-repeatable-group") {
    repeatable.props.repeatCount = 1;
    repeatable.children.push(leaf("jb-input", "repeatable_input"));
  }

  const timestamp = "2026-09-01T00:00:00.000Z";
  return {
    $schema: "https://javadbat.github.io/schemas/jb-form/v1.json",
    schemaVersion: 1,
    id: "b1f8a9c0-1d2e-4f30-8a41-5263748596a7",
    slug: FORM_SLUG,
    metadata: { name: localized(FORM_NAME), createdAt: timestamp, updatedAt: timestamp },
    localization: { defaultLocale: "en", locales: { en: { direction: "ltr" } } },
    elements,
    theme: null,
  };
}

async function seedForm(page: Page, document: JBFormDocumentV1): Promise<void> {
  await page.goto("/form/designer");
  await expect(page.getByRole("button", { name: "Export theme" })).toBeVisible();
  await page.evaluate(async (payload: unknown) => {
    const formDocument = (payload as { document: JBFormDocumentV1 }).document;
    await new Promise<void>((resolve, reject) => {
      const request = indexedDB.open("jb-form-builder", 1);
      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        const database = request.result;
        const transaction = database.transaction("forms", "readwrite");
        transaction.objectStore("forms").put({
          recordVersion: 1,
          builderVersion: "e2e",
          id: formDocument.id,
          slug: formDocument.slug,
          revision: 1,
          createdAt: formDocument.metadata.createdAt,
          updatedAt: formDocument.metadata.updatedAt,
          document: formDocument,
        });
        transaction.oncomplete = () => { database.close(); resolve(); };
        transaction.onerror = () => reject(transaction.error);
      };
    });
  }, { document: document as unknown });
  const stored = await page.evaluate(slug => new Promise<unknown>((resolve, reject) => {
    const request = indexedDB.open("jb-form-builder", 1);
    request.onerror = () => reject(request.error);
    request.onsuccess = () => {
      const getRequest = request.result.transaction("forms", "readonly").objectStore("forms").index("slug").get(slug);
      getRequest.onsuccess = () => resolve(getRequest.result ?? null);
      getRequest.onerror = () => reject(getRequest.error);
    };
  }), FORM_SLUG);
  if (!stored) throw new Error("Complete preview fixture was not persisted to IndexedDB.");
}

test("renders every registered element, configured props, and container content in standalone preview", async ({ page }) => {
  const document = buildCompleteDocument();
  await seedForm(page, document);
  await page.goto(`/form/preview?form=${FORM_SLUG}`);

  await expect(page.getByRole("heading", { name: FORM_NAME })).toBeVisible({ timeout: 20_000 });
  const renderer = page.locator("jb-form-builder");
  await expect(renderer).toHaveAttribute("data-state", "ready");

  const rendered = await renderer.evaluate(element => {
    const root = element.shadowRoot!;
    return {
      types: Array.from(root.querySelectorAll<HTMLElement>("[data-element-type]"), item => item.dataset.elementType),
      text: root.textContent ?? "",
      inputValue: (root.querySelector<HTMLElement>('jb-input[name="preview_jb_input_7"]') as HTMLElement & { value?: unknown })?.value ?? "",
      options: root.querySelectorAll("jb-option").length,
      imageAlt: root.querySelector("img")?.getAttribute("alt"),
      link: root.querySelector("a")?.getAttribute("href"),
      audio: root.querySelector("audio")?.getAttribute("src"),
      conditionMatched: (root.querySelector<HTMLElement>("jb-condition") as HTMLElement & { matched?: boolean })?.matched,
    };
  });

  expect(new Set(rendered.types)).toEqual(new Set(formElementRegistry.map(entry => entry.type)));
  expect(rendered.text).toContain("Configured text content");
  expect(rendered.text).toContain("Configured action");
  expect(rendered.text).toContain("Configured preview link");
  expect(rendered.inputValue).toBe("Initial configured value");
  expect(rendered.options).toBeGreaterThanOrEqual(3);
  expect(rendered.imageAlt).toBe("Configured preview image");
  expect(rendered.link).toBe("https://example.com/complete-preview");
  expect(rendered.audio).toContain("data:audio/wav");
  expect(rendered.conditionMatched).toBe(true);

  for (const entry of formElementRegistry) {
    await expect.poll(() => renderer.locator(`[data-element-type="${entry.type}"]`).count()).toBeGreaterThan(0);
  }
});

test("preserves complete preview values through reset and submits the seeded form", async ({ page }) => {
  await seedForm(page, buildCompleteDocument());
  await page.goto(`/form/preview?form=${FORM_SLUG}`);
  const renderer = page.locator("jb-form-builder");
  await expect(renderer).toBeVisible({ timeout: 20_000 });

  const input = renderer.locator('jb-input[name="preview_jb_input_7"]');
  await input.evaluate(element => { (element as HTMLElement & { value: string }).value = "Changed value"; });
  await page.getByRole("button", { name: "Reset form" }).click();
  await expect.poll(() => input.evaluate(element => (element as HTMLElement & { value: string }).value)).toBe("Initial configured value");

  await page.getByRole("button", { name: "Submit", exact: true }).click();
  await expect(page.getByLabel("Submitted form values in JSON")).toContainText("Initial configured value");
});
