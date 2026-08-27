import { isValidFormSlug } from "../application/form-slug";
import type { JBFormDocumentV1 } from "../domain/form-document";
import { FormDatabase, type FormDatabaseOptions } from "./database";
import { requestToPromise, transactionToPromise } from "./idb-helpers";
import {
  CURRENT_DRAFT_KEY,
  FORM_BUILDER_VERSION,
  FORM_STORES,
  type CurrentDraftRecordV1,
  type FormRepository,
  type Result,
  type SaveFormCommand,
  type SavedFormResult,
  type StorageIssue,
  type StoredFormRecordV1,
} from "./storage-types";

export interface IndexedDbFormRepositoryOptions extends FormDatabaseOptions {
  now?: () => Date;
  createId?: () => string;
}

function success<T>(value: T): Result<T, StorageIssue> {
  return { ok: true, value };
}

function failure<T = never>(code: StorageIssue["code"], message: string, options: Pick<StorageIssue, "cause" | "formIssues"> = {}): Result<T, StorageIssue> {
  return { ok: false, error: { code, message, ...options } };
}

function errorName(cause: unknown): string {
  return (typeof cause === "object" && cause !== null && "name" in cause && typeof (cause as { name?: unknown }).name === "string" ? (cause as { name: string }).name : "") || "";
}

function mapStorageError<T>(cause: unknown): Result<T, StorageIssue> {
  switch (errorName(cause)) {
    case "QuotaExceededError":
      return failure("quota-exceeded", "Browser storage quota was exceeded.", { cause });
    case "ConstraintError":
      return failure("slug-collision", "Another saved form already uses this slug.", { cause });
    case "AbortError":
      return failure("transaction-aborted", "The storage transaction was aborted.", { cause });
    case "VersionError":
      return failure("incompatible-record", "The form database was created by a newer version.", { cause });
    default:
      return failure("unknown-storage-error", "The form could not be read or saved.", { cause });
  }
}

function portableClone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

async function validateDocument(value: unknown) {
  const { validateFormDocument } = await import("../domain/form-document-validation");
  return validateFormDocument(value);
}

async function validateNamedRecord(value: unknown): Promise<Result<StoredFormRecordV1, StorageIssue>> {
  if (
    !isObject(value) ||
    value.recordVersion !== 1 ||
    typeof value.builderVersion !== "string" ||
    typeof value.id !== "string" ||
    typeof value.slug !== "string" ||
    typeof value.revision !== "number" ||
    !Number.isInteger(value.revision) ||
    value.revision < 1 ||
    typeof value.createdAt !== "string" ||
    typeof value.updatedAt !== "string"
  ) {
    return failure(
      isObject(value) && typeof value.recordVersion === "number" && value.recordVersion > 1 ? "incompatible-record" : "corrupt-record",
      "The saved form record is corrupt or incompatible.",
    );
  }
  const validation = await validateDocument(value.document);
  if (!validation.valid || !validation.document) {
    return failure("corrupt-record", "The saved form document failed validation.", { formIssues: validation.issues });
  }
  if (value.id !== validation.document.id || value.slug !== validation.document.slug) {
    return failure("corrupt-record", "Saved form projections do not match the contained document.");
  }
  return success(value as unknown as StoredFormRecordV1);
}

async function validateDraftRecord(value: unknown): Promise<Result<CurrentDraftRecordV1, StorageIssue>> {
  if (!isObject(value) || value.key !== CURRENT_DRAFT_KEY || value.recordVersion !== 1 || typeof value.builderVersion !== "string" || typeof value.updatedAt !== "string") {
    return failure(
      isObject(value) && typeof value.recordVersion === "number" && value.recordVersion > 1 ? "incompatible-record" : "corrupt-record",
      "The current draft record is corrupt or incompatible.",
    );
  }
  const linkedValues = [value.linkedFormId, value.linkedSlug, value.linkedRevision];
  const allNull = linkedValues.every(candidate => candidate === null);
  const allLinked =
    typeof value.linkedFormId === "string" &&
    typeof value.linkedSlug === "string" &&
    typeof value.linkedRevision === "number" &&
    Number.isInteger(value.linkedRevision) &&
    value.linkedRevision > 0;
  if (!allNull && !allLinked) {
    return failure("corrupt-record", "The current draft link metadata is inconsistent.");
  }
  const validation = await validateDocument(value.document);
  if (!validation.valid || !validation.document) {
    return failure("corrupt-record", "The current draft document failed validation.", { formIssues: validation.issues });
  }
  if (allLinked && (value.linkedFormId !== validation.document.id || value.linkedSlug !== validation.document.slug)) {
    return failure("corrupt-record", "Current draft projections do not match the linked document.");
  }
  return success(value as unknown as CurrentDraftRecordV1);
}

export class IndexedDbFormRepository implements FormRepository {
  readonly database: FormDatabase;
  readonly now: () => Date;
  readonly createId: () => string;

  constructor(options: IndexedDbFormRepositoryOptions = {}) {
    this.database = new FormDatabase(options);
    this.now = options.now ?? (() => new Date());
    this.createId = options.createId ?? (() => crypto.randomUUID());
  }

  async open(): Promise<Result<void, StorageIssue>> {
    const result = await this.database.open();
    return result.ok ? success(undefined) : result;
  }

  close(): void {
    this.database.close();
  }

  async getCurrentDraft(): Promise<Result<CurrentDraftRecordV1 | null, StorageIssue>> {
    const connection = await this.database.open();
    if (!connection.ok) {
      return connection;
    }
    try {
      const transaction = connection.value.transaction(FORM_STORES.drafts, "readonly");
      const value = await requestToPromise(transaction.objectStore(FORM_STORES.drafts).get(CURRENT_DRAFT_KEY));
      await transactionToPromise(transaction);
      if (value === undefined) {
        return success(null);
      }
      const record = await validateDraftRecord(value);
      if (!record.ok) {
        await this.preserveRecoveryCopy(connection.value, CURRENT_DRAFT_KEY, value, record.error.code);
      }
      return record.ok ? success(portableClone(record.value)) : record;
    } catch (cause) {
      return mapStorageError(cause);
    }
  }

  async getBySlug(slug: string): Promise<Result<StoredFormRecordV1 | null, StorageIssue>> {
    if (!isValidFormSlug(slug)) {
      return failure("validation-failed", "The form slug is invalid.");
    }
    const connection = await this.database.open();
    if (!connection.ok) {
      return connection;
    }
    try {
      const transaction = connection.value.transaction(FORM_STORES.forms, "readonly");
      const value = await requestToPromise(transaction.objectStore(FORM_STORES.forms).index("slug").get(slug));
      await transactionToPromise(transaction);
      if (value === undefined) {
        return success(null);
      }
      const record = await validateNamedRecord(value);
      if (!record.ok) {
        await this.preserveRecoveryCopy(connection.value, slug, value, record.error.code);
      }
      return record.ok ? success(portableClone(record.value)) : record;
    } catch (cause) {
      return mapStorageError(cause);
    }
  }

  async listNamedForms(): Promise<Result<StoredFormRecordV1[], StorageIssue>> {
    const connection = await this.database.open();
    if (!connection.ok) {
      return connection;
    }
    try {
      const transaction = connection.value.transaction(FORM_STORES.forms, "readonly");
      const values = await requestToPromise(transaction.objectStore(FORM_STORES.forms).index("updatedAt").getAll());
      await transactionToPromise(transaction);
      const records: StoredFormRecordV1[] = [];
      const validatedRecords = await Promise.all(values.map(value => validateNamedRecord(value)));
      for (let index = 0; index < validatedRecords.length; index += 1) {
        const record = validatedRecords[index];
        const value = values[index];
        if (!record.ok) {
          await this.preserveRecoveryCopy(connection.value, isObject(value) && typeof value.id === "string" ? value.id : "unknown-form", value, record.error.code);
          return record;
        }
        records.push(portableClone(record.value));
      }
      records.sort((first, second) => second.updatedAt.localeCompare(first.updatedAt));
      return success(records);
    } catch (cause) {
      return mapStorageError(cause);
    }
  }

  async deleteNamedForm(id: string): Promise<Result<void, StorageIssue>> {
    if (!id) return failure("validation-failed", "The saved form id is required.");
    const connection = await this.database.open();
    if (!connection.ok) return connection;
    try {
      const transaction = connection.value.transaction([FORM_STORES.forms, FORM_STORES.drafts], "readwrite");
      const forms = transaction.objectStore(FORM_STORES.forms);
      const record = await requestToPromise(forms.get(id));
      if (record === undefined) {
        transaction.abort();
        return failure("validation-failed", "The saved form was not found.");
      }
      forms.delete(id);
      const draft = await requestToPromise(transaction.objectStore(FORM_STORES.drafts).get(CURRENT_DRAFT_KEY));
      if (isObject(draft) && draft.linkedFormId === id) transaction.objectStore(FORM_STORES.drafts).delete(CURRENT_DRAFT_KEY);
      await transactionToPromise(transaction);
      return success(undefined);
    } catch (cause) {
      return mapStorageError(cause);
    }
  }

  async deleteNamedFormBySlug(slug: string): Promise<Result<void, StorageIssue>> {
    if (!isValidFormSlug(slug)) return failure("validation-failed", "The form slug is invalid.");
    const connection = await this.database.open();
    if (!connection.ok) return connection;
    try {
      const transaction = connection.value.transaction([FORM_STORES.forms, FORM_STORES.drafts], "readwrite");
      const forms = transaction.objectStore(FORM_STORES.forms);
      const record = await requestToPromise(forms.index("slug").get(slug));
      if (record === undefined || !isObject(record) || typeof record.id !== "string") {
        transaction.abort();
        return failure("validation-failed", "The saved form was not found.");
      }
      forms.delete(record.id);
      const draft = await requestToPromise(transaction.objectStore(FORM_STORES.drafts).get(CURRENT_DRAFT_KEY));
      if (isObject(draft) && draft.linkedFormId === record.id) transaction.objectStore(FORM_STORES.drafts).delete(CURRENT_DRAFT_KEY);
      await transactionToPromise(transaction);
      return success(undefined);
    } catch (cause) {
      return mapStorageError(cause);
    }
  }

  async deleteCurrentDraft(): Promise<Result<void, StorageIssue>> {
    const connection = await this.database.open();
    if (!connection.ok) return connection;
    try {
      const transaction = connection.value.transaction(FORM_STORES.drafts, "readwrite");
      transaction.objectStore(FORM_STORES.drafts).delete(CURRENT_DRAFT_KEY);
      await transactionToPromise(transaction);
      return success(undefined);
    } catch (cause) {
      return mapStorageError(cause);
    }
  }

  async save(command: SaveFormCommand): Promise<Result<SavedFormResult, StorageIssue>> {
    let document: JBFormDocumentV1;
    try {
      document = portableClone(command.document);
    } catch (cause) {
      return failure("validation-failed", "The form contains non-portable values.", { cause });
    }

    const timestamp = this.now().toISOString();
    const requestedSlug = command.slug ?? command.linkedRecord?.slug ?? document.slug;
    if (requestedSlug !== undefined && !isValidFormSlug(requestedSlug)) {
      return failure("validation-failed", "The form slug is invalid.");
    }
    if (command.linkedRecord && !command.saveAs && document.id !== command.linkedRecord.id) {
      return failure("validation-failed", "The document id does not match its linked saved form.");
    }

    if (command.saveAs) {
      if (!requestedSlug) {
        return failure("validation-failed", "Save As requires a non-empty slug.");
      }
      document.id = this.createId();
      document.metadata.createdAt = timestamp;
    }
    document.metadata.updatedAt = timestamp;
    if (requestedSlug) {
      document.slug = requestedSlug;
    } else {
      delete document.slug;
    }

    const validation = await validateDocument(document);
    if (!validation.valid) {
      return failure("validation-failed", "The form must be valid before it can be saved.", { formIssues: validation.issues });
    }

    const connection = await this.database.open();
    if (!connection.ok) {
      return connection;
    }
    const transaction = connection.value.transaction([FORM_STORES.forms, FORM_STORES.drafts], "readwrite");
    try {
      const forms = transaction.objectStore(FORM_STORES.forms);
      let namedForm: StoredFormRecordV1 | null = null;

      if (requestedSlug) {
        const [existingById, existingBySlug] = (await Promise.all([requestToPromise(forms.get(document.id)), requestToPromise(forms.index("slug").get(requestedSlug))])) as [
          StoredFormRecordV1 | undefined,
          StoredFormRecordV1 | undefined,
        ];

        if (existingBySlug && existingBySlug.id !== document.id) {
          transaction.abort();
          return failure("slug-collision", "Another saved form already uses this slug.");
        }
        if (command.linkedRecord && !command.saveAs && (!existingById || existingById.revision !== command.linkedRecord.revision)) {
          transaction.abort();
          return failure("revision-conflict", "This form was changed in another tab. Reload it before saving.");
        }
        if (!command.linkedRecord && !command.saveAs && existingById) {
          transaction.abort();
          return failure("revision-conflict", "The saved form link is stale or missing.");
        }

        namedForm = {
          recordVersion: 1,
          builderVersion: FORM_BUILDER_VERSION,
          id: document.id,
          slug: requestedSlug,
          revision: (existingById?.revision ?? 0) + 1,
          createdAt: existingById?.createdAt ?? timestamp,
          updatedAt: timestamp,
          document: portableClone(document),
        };
        forms.put(namedForm);
      }

      const draft: CurrentDraftRecordV1 = {
        key: CURRENT_DRAFT_KEY,
        recordVersion: 1,
        builderVersion: FORM_BUILDER_VERSION,
        linkedFormId: namedForm?.id ?? null,
        linkedSlug: namedForm?.slug ?? null,
        linkedRevision: namedForm?.revision ?? null,
        updatedAt: timestamp,
        document: portableClone(document),
      };
      transaction.objectStore(FORM_STORES.drafts).put(draft);
      await transactionToPromise(transaction);

      return success({
        document: portableClone(document),
        draft: portableClone(draft),
        namedForm: namedForm ? portableClone(namedForm) : null,
      });
    } catch (cause) {
      return mapStorageError(cause);
    }
  }

  private async preserveRecoveryCopy(database: IDBDatabase, sourceId: string, value: unknown, reason: string): Promise<void> {
    try {
      const transaction = database.transaction(FORM_STORES.recovery, "readwrite");
      transaction.objectStore(FORM_STORES.recovery).add({
        sourceId,
        createdAt: this.now().toISOString(),
        reason,
        value: portableClone(value),
      });
      await transactionToPromise(transaction);
    } catch {
      // Recovery is best effort and must not replace the original read error.
    }
  }
}

export const formRepository = new IndexedDbFormRepository();
