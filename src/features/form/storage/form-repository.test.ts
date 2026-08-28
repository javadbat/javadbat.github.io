import { IDBFactory } from "fake-indexeddb";
import { afterEach, describe, expect, it } from "vitest";
import { createEmptyFormDocument, localizedText } from "../domain/form-document";
import { formElementRegistry } from "jb-form-builder/registry/form-element-registry";
import { createDefaultElement } from "jb-form-builder/registry/form-element-registry";
import { IndexedDbFormRepository } from "./form-repository";
import { FORM_STORES, type LinkedFormReference } from "./storage-types";

const repositories: IndexedDbFormRepository[] = [];

function createRepository(options: { now?: () => Date; createId?: () => string } = {}) {
  const repository = new IndexedDbFormRepository({
    name: `jb-form-test-${crypto.randomUUID()}`,
    factory: new IDBFactory(),
    ...options,
  });
  repositories.push(repository);
  return repository;
}

function namedDocument(name: string, slug?: string) {
  const document = createEmptyFormDocument();
  document.metadata.name = localizedText(name);
  if (slug) {
    document.slug = slug;
  }
  return document;
}

afterEach(() => {
  repositories.splice(0).forEach(repository => {
    repository.close();
  });
});

describe("IndexedDbFormRepository", () => {
  it("creates the approved stores and indexes in migration v1", async () => {
    const repository = createRepository();
    const result = await repository.database.open();

    expect(result.ok).toBe(true);
    if (!result.ok) {
      return;
    }
    expect(Array.from(result.value.objectStoreNames)).toEqual(expect.arrayContaining(Object.values(FORM_STORES)));
    const transaction = result.value.transaction([FORM_STORES.forms, FORM_STORES.recovery], "readonly");
    expect(Array.from(transaction.objectStore(FORM_STORES.forms).indexNames)).toEqual(expect.arrayContaining(["slug", "updatedAt"]));
    expect(Array.from(transaction.objectStore(FORM_STORES.recovery).indexNames)).toEqual(expect.arrayContaining(["sourceId", "createdAt"]));
  });

  it("persists only an explicit unnamed current-draft save", async () => {
    const repository = createRepository();
    const beforeSave = await repository.getCurrentDraft();
    expect(beforeSave).toEqual({ ok: true, value: null });

    const document = namedDocument("Draft only");
    const saved = await repository.save({
      document,
      linkedRecord: null,
    });
    expect(saved.ok).toBe(true);

    const loaded = await repository.getCurrentDraft();
    expect(loaded.ok).toBe(true);
    if (loaded.ok) {
      expect(loaded.value?.document.metadata.name).toEqual(localizedText("Draft only"));
      expect(loaded.value?.linkedFormId).toBeNull();
    }
    expect(await repository.listNamedForms()).toEqual({
      ok: true,
      value: [],
    });
  });

  it("restores data through a new repository connection", async () => {
    const factory = new IDBFactory();
    const name = `jb-form-reopen-${crypto.randomUUID()}`;
    const firstRepository = new IndexedDbFormRepository({ name, factory });
    repositories.push(firstRepository);
    await firstRepository.save({
      document: namedDocument("Across restart"),
      linkedRecord: null,
    });
    firstRepository.close();

    const reopenedRepository = new IndexedDbFormRepository({ name, factory });
    repositories.push(reopenedRepository);
    const restored = await reopenedRepository.getCurrentDraft();

    expect(restored.ok).toBe(true);
    if (restored.ok) {
      expect(restored.value?.document.metadata.name).toEqual(localizedText("Across restart"));
    }
  });

  it("saves a named form and draft atomically, then increments revision", async () => {
    let clock = 0;
    const repository = createRepository({
      now: () => new Date(Date.UTC(2026, 6, 30, 10, 0, clock++)),
    });
    const document = namedDocument("Contact", "contact");
    const first = await repository.save({
      document,
      linkedRecord: null,
      slug: "contact",
    });
    expect(first.ok).toBe(true);
    if (!first.ok || !first.value.namedForm) {
      return;
    }
    expect(first.value.namedForm.revision).toBe(1);
    const link: LinkedFormReference = {
      id: first.value.namedForm.id,
      slug: first.value.namedForm.slug,
      revision: first.value.namedForm.revision,
    };

    first.value.document.metadata.name = localizedText("Contact updated");
    const second = await repository.save({
      document: first.value.document,
      linkedRecord: link,
    });
    expect(second.ok).toBe(true);
    if (second.ok) {
      expect(second.value.namedForm?.revision).toBe(2);
      expect(second.value.draft.linkedRevision).toBe(2);
    }
    const loaded = await repository.getBySlug("contact");
    expect(loaded.ok && loaded.value?.revision).toBe(2);
  });

  it("rejects stale revisions and slug collisions without replacing records", async () => {
    const repository = createRepository();
    const first = await repository.save({
      document: namedDocument("First", "shared"),
      linkedRecord: null,
      slug: "shared",
    });
    expect(first.ok).toBe(true);
    if (!first.ok || !first.value.namedForm) {
      return;
    }

    const collision = await repository.save({
      document: namedDocument("Second", "shared"),
      linkedRecord: null,
      slug: "shared",
    });
    expect(collision.ok).toBe(false);
    if (!collision.ok) {
      expect(collision.error.code).toBe("slug-collision");
    }

    const stale = await repository.save({
      document: first.value.document,
      linkedRecord: {
        id: first.value.namedForm.id,
        slug: "shared",
        revision: 99,
      },
    });
    expect(stale.ok).toBe(false);
    if (!stale.ok) {
      expect(stale.error.code).toBe("revision-conflict");
    }
    const loaded = await repository.getBySlug("shared");
    expect(loaded.ok && loaded.value?.revision).toBe(1);
  });

  it("Save As creates a new form id while preserving element ids", async () => {
    const nextId = "22222222-2222-4222-8222-222222222222";
    const repository = createRepository({ createId: () => nextId });
    const document = namedDocument("Original", "original");
    document.elements.push(createDefaultElement(formElementRegistry[0], "contactName"));
    const elementId = document.elements[0].id;

    const saved = await repository.save({
      document,
      linkedRecord: null,
      slug: "copy",
      saveAs: true,
    });

    expect(saved.ok).toBe(true);
    if (saved.ok) {
      expect(saved.value.document.id).toBe(nextId);
      expect(saved.value.document.slug).toBe("copy");
      expect(saved.value.document.elements[0].id).toBe(elementId);
    }
  });

  it("lists named forms newest first", async () => {
    let minute = 0;
    const repository = createRepository({
      now: () => new Date(Date.UTC(2026, 6, 30, 10, minute++, 0)),
    });
    await repository.save({
      document: namedDocument("First", "first"),
      linkedRecord: null,
      slug: "first",
    });
    await repository.save({
      document: namedDocument("Second", "second"),
      linkedRecord: null,
      slug: "second",
    });

    const result = await repository.listNamedForms();
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.map(record => record.slug)).toEqual(["second", "first"]);
    }
  });

  it("deletes a named form and its linked current draft", async () => {
    const repository = createRepository();
    const saved = await repository.save({
      document: namedDocument("Delete me", "delete-me"),
      linkedRecord: null,
      slug: "delete-me",
    });
    expect(saved.ok).toBe(true);
    if (!saved.ok || !saved.value.namedForm) return;

    const deleted = await repository.deleteNamedForm(saved.value.namedForm.id);

    expect(deleted).toEqual({ ok: true, value: undefined });
    expect(await repository.getBySlug("delete-me")).toEqual({ ok: true, value: null });
    expect(await repository.getCurrentDraft()).toEqual({ ok: true, value: null });
  });

  it("returns typed validation and corrupt-record failures", async () => {
    const repository = createRepository();
    const invalid = namedDocument("Invalid");
    invalid.elements.push(createDefaultElement(formElementRegistry[0], "invalid"));
    invalid.elements[0].name = "";

    const invalidSave = await repository.save({
      document: invalid,
      linkedRecord: null,
    });
    expect(invalidSave.ok).toBe(false);
    if (!invalidSave.ok) {
      expect(invalidSave.error.code).toBe("validation-failed");
      expect(invalidSave.error.formIssues?.length).toBeGreaterThan(0);
    }

    const connection = await repository.database.open();
    expect(connection.ok).toBe(true);
    if (!connection.ok) {
      return;
    }
    const transaction = connection.value.transaction(FORM_STORES.drafts, "readwrite");
    transaction.objectStore(FORM_STORES.drafts).put({
      key: "current",
      recordVersion: 1,
      builderVersion: "0.0.1",
      linkedFormId: null,
      linkedSlug: null,
      linkedRevision: null,
      updatedAt: new Date().toISOString(),
      document: { broken: true },
    });
    await new Promise<void>(resolve => {
      transaction.oncomplete = () => resolve();
    });

    const corrupt = await repository.getCurrentDraft();
    expect(corrupt.ok).toBe(false);
    if (!corrupt.ok) {
      expect(corrupt.error.code).toBe("corrupt-record");
    }

    const recoveryTransaction = connection.value.transaction(FORM_STORES.recovery, "readonly");
    const recoveryRequest = recoveryTransaction.objectStore(FORM_STORES.recovery).getAll();
    const recoveryRecords = await new Promise<unknown[]>((resolve, reject) => {
      recoveryRequest.onsuccess = () => resolve(recoveryRequest.result);
      recoveryRequest.onerror = () => reject(recoveryRequest.error);
    });
    expect(recoveryRecords).toEqual([
      expect.objectContaining({
        sourceId: "current",
        reason: "corrupt-record",
      }),
    ]);
  });
});
