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

  it("duplicates into a new identity and collision-safe slug", async () => {
    let id = 0;
    const repository = createRepository({ createId: () => `theme-${++id}` });
    const source = await repository.create(config("Calm"));
    expect(source.ok).toBe(true);
    if (!source.ok) return;

    const duplicate = await repository.duplicate(source.value.id);

    expect(duplicate.ok).toBe(true);
    if (duplicate.ok) {
      expect(duplicate.value.id).toBe("theme-2");
      expect(duplicate.value.slug).toBe("calm-copy");
      expect(duplicate.value.config.name).toBe("Calm copy");
      expect(duplicate.value.config.global).toEqual(source.value.config.global);
    }
  });

  it("atomically replaces default and form references before deletion", async () => {
    const repository = createRepository();
    const source = await repository.create(config("Source"));
    const replacement = await repository.create(config("Replacement"));
    expect(source.ok && replacement.ok).toBe(true);
    if (!source.ok || !replacement.ok) return;
    await repository.setDefault(source.value.id);
    await repository.bindForm("contact-form", source.value.id);
    await repository.bindForm("survey", source.value.id);

    const deleted = await repository.delete(source.value.id, replacement.value.id);

    expect(deleted).toEqual({
      ok: true,
      value: expect.objectContaining({
        defaultThemeId: replacement.value.id,
        bindings: { "contact-form": replacement.value.id, survey: replacement.value.id },
      }),
    });
    expect(await repository.getById(source.value.id)).toEqual({ ok: true, value: null });
    expect((await repository.getById(replacement.value.id)).ok).toBe(true);
  });

  it("rolls back deletion when the replacement is missing", async () => {
    const repository = createRepository();
    const source = await repository.create(config("Keep me"));
    expect(source.ok).toBe(true);
    if (!source.ok) return;
    await repository.setDefault(source.value.id);

    const deleted = await repository.delete(source.value.id, "missing");

    expect(deleted.ok).toBe(false);
    expect((await repository.getById(source.value.id)).ok).toBe(true);
    expect(await repository.getSettings()).toEqual({
      ok: true,
      value: expect.objectContaining({ defaultThemeId: source.value.id }),
    });
  });

  it("removes references when deletion falls back to the built-in Default", async () => {
    const repository = createRepository();
    const source = await repository.create(config("Remove"));
    expect(source.ok).toBe(true);
    if (!source.ok) return;
    await repository.setDefault(source.value.id);
    await repository.bindForm("contact-form", source.value.id);

    const deleted = await repository.delete(source.value.id, null);

    expect(deleted).toEqual({
      ok: true,
      value: expect.objectContaining({ defaultThemeId: null, bindings: {} }),
    });
  });
});
