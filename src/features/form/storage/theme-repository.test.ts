import { IDBFactory } from "fake-indexeddb";
import { afterEach, describe, expect, it } from "vitest";
import type { ThemeConfigV1 } from "jb-form-builder/contract/theme";
import { migrateDatabaseToV1 } from "./migrations/v1";
import { IndexedDbThemeRepository } from "./theme-repository";
import { FORM_STORES } from "./storage-types";

const repositories: IndexedDbThemeRepository[] = [];

function config(name: string): ThemeConfigV1 {
  return {
    schemaVersion: 1,
    name,
    global: { "--jb-primary": "#2455e8" },
    defaults: { controlSize: "lg" },
  };
}

function createRepository(options: { factory?: IDBFactory; name?: string; now?: () => Date; createId?: () => string } = {}) {
  const repository = new IndexedDbThemeRepository({
    name: options.name ?? `jb-theme-test-${crypto.randomUUID()}`,
    factory: options.factory ?? new IDBFactory(),
    now: options.now,
    createId: options.createId,
  });
  repositories.push(repository);
  return repository;
}

afterEach(() => repositories.splice(0).forEach(repository => repository.close()));

describe("IndexedDbThemeRepository", () => {
  it("upgrades an existing form database without changing its v1 stores", async () => {
    const factory = new IDBFactory();
    const name = `jb-theme-migration-${crypto.randomUUID()}`;
    await new Promise<void>((resolve, reject) => {
      const request = factory.open(name, 1);
      request.onupgradeneeded = () => migrateDatabaseToV1(request.result, request.transaction!);
      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        request.result.close();
        resolve();
      };
    });

    const repository = createRepository({ factory, name });
    const opened = await repository.database.open();

    expect(opened.ok).toBe(true);
    if (opened.ok) expect(Array.from(opened.value.objectStoreNames)).toEqual(expect.arrayContaining(Object.values(FORM_STORES)));
  });

  it("creates stable unique slugs and persists canonical configs", async () => {
    let id = 0;
    const repository = createRepository({ createId: () => `theme-${++id}` });

    const first = await repository.create(config("Rose Pop"));
    const second = await repository.create(config("Rose Pop"));

    expect(first.ok && first.value.slug).toBe("rose-pop");
    expect(second.ok && second.value.slug).toBe("rose-pop-2");
    expect(await repository.list()).toEqual({
      ok: true,
      value: expect.arrayContaining([
        expect.objectContaining({ id: "theme-1", slug: "rose-pop" }),
        expect.objectContaining({ id: "theme-2", slug: "rose-pop-2" }),
      ]),
    });
  });

  it("renames without changing slug and rejects stale autosave revisions", async () => {
    const repository = createRepository();
    const created = await repository.create(config("Technical"));
    expect(created.ok).toBe(true);
    if (!created.ok) return;

    const renamed = await repository.save({
      id: created.value.id,
      revision: created.value.revision,
      config: config("Engineering"),
    });

    expect(renamed.ok).toBe(true);
    if (!renamed.ok) return;
    expect(renamed.value.slug).toBe("technical");
    expect(renamed.value.config.name).toBe("Engineering");
    expect(renamed.value.revision).toBe(2);
    const stale = await repository.save({ id: created.value.id, revision: 1, config: config("Stale") });
    expect(stale.ok).toBe(false);
    if (!stale.ok) expect(stale.error.code).toBe("revision-conflict");
  });

  it("stores default selection and form bindings outside portable config", async () => {
    const repository = createRepository();
    const created = await repository.create(config("Default"));
    expect(created.ok).toBe(true);
    if (!created.ok) return;

    expect((await repository.setDefault(created.value.id)).ok).toBe(true);
    const bound = await repository.bindForm("contact-form", created.value.id);

    expect(bound).toEqual({
      ok: true,
      value: expect.objectContaining({
        defaultThemeId: created.value.id,
        bindings: { "contact-form": created.value.id },
      }),
    });
    const loaded = await repository.getBySlug(created.value.slug);
    expect(loaded.ok && loaded.value?.config).not.toHaveProperty("defaultThemeId");
    expect(loaded.ok && loaded.value?.config).not.toHaveProperty("bindings");
  });

  it("rejects missing relationship targets and invalid configs", async () => {
    const repository = createRepository();

    const missing = await repository.setDefault("missing");
    expect(missing.ok).toBe(false);
    if (!missing.ok) expect(missing.error.code).toBe("validation-failed");

    const invalid = await repository.create({ schemaVersion: 1, name: "", global: {} });
    expect(invalid.ok).toBe(false);
    if (!invalid.ok) expect(invalid.error.code).toBe("validation-failed");
  });
});
