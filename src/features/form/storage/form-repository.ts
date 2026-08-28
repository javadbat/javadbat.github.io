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

/** Injectable time, identity, and database dependencies for repository isolation and deterministic tests. */
export interface IndexedDbFormRepositoryOptions extends FormDatabaseOptions {
  /** Business clock used for record creation, updates, and recovery timestamps. */
  now?: () => Date;
  /** Identity generator used when Save As creates an independent named form. */
  createId?: () => string;
}

/** Wraps a repository value in the shared success outcome. */
function success<T>(value: T): Result<T, StorageIssue> {
  return { ok: true, value };
}

/** Builds a structured repository failure with optional platform and document-validation detail. */
function failure<T = never>(code: StorageIssue["code"], message: string, options: Pick<StorageIssue, "cause" | "formIssues"> = {}): Result<T, StorageIssue> {
  return { ok: false, error: { code, message, ...options } };
}

/** Safely extracts a browser exception name from an unknown rejected value. */
function errorName(cause: unknown): string {
  return (typeof cause === "object" && cause !== null && "name" in cause && typeof (cause as { name?: unknown }).name === "string" ? (cause as { name: string }).name : "") || "";
}

/** Translates IndexedDB exceptions into stable failures understood by form workflows. */
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

/** Creates a detached JSON-only value so callers cannot mutate persisted records by reference. */
function portableClone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

/** Narrows untrusted IndexedDB values to non-array records before inspecting projections. */
function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

/** Lazily loads document validation so routes that only list metadata avoid eager schema cost. */
async function validateDocument(value: unknown) {
  /** Shared portable-document validator loaded at the persistence trust boundary. */
  const { validateFormDocument } = await import("../domain/form-document-validation");
  return validateFormDocument(value);
}

/** Validates a named-form envelope, its document, and duplicated identity projections. */
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
  /** Schema and semantic validation of the untrusted stored document. */
  const validation = await validateDocument(value.document);
  if (!validation.valid || !validation.document) {
    return failure("corrupt-record", "The saved form document failed validation.", { formIssues: validation.issues });
  }
  if (value.id !== validation.document.id || value.slug !== validation.document.slug) {
    return failure("corrupt-record", "Saved form projections do not match the contained document.");
  }
  return success(value as unknown as StoredFormRecordV1);
}

/** Validates the singleton draft envelope and its optional all-or-nothing named-form link. */
async function validateDraftRecord(value: unknown): Promise<Result<CurrentDraftRecordV1, StorageIssue>> {
  if (!isObject(value) || value.key !== CURRENT_DRAFT_KEY || value.recordVersion !== 1 || typeof value.builderVersion !== "string" || typeof value.updatedAt !== "string") {
    return failure(
      isObject(value) && typeof value.recordVersion === "number" && value.recordVersion > 1 ? "incompatible-record" : "corrupt-record",
      "The current draft record is corrupt or incompatible.",
    );
  }
  /** Three projections that together describe which named revision the draft edits. */
  const linkedValues = [value.linkedFormId, value.linkedSlug, value.linkedRevision];
  /** Whether this draft is intentionally independent from any named form. */
  const allNull = linkedValues.every(candidate => candidate === null);
  /** Whether every required named-form projection is present and valid. */
  const allLinked =
    typeof value.linkedFormId === "string" &&
    typeof value.linkedSlug === "string" &&
    typeof value.linkedRevision === "number" &&
    Number.isInteger(value.linkedRevision) &&
    value.linkedRevision > 0;
  if (!allNull && !allLinked) {
    return failure("corrupt-record", "The current draft link metadata is inconsistent.");
  }
  /** Schema and semantic validation of the untrusted draft document. */
  const validation = await validateDocument(value.document);
  if (!validation.valid || !validation.document) {
    return failure("corrupt-record", "The current draft document failed validation.", { formIssues: validation.issues });
  }
  if (allLinked && (value.linkedFormId !== validation.document.id || value.linkedSlug !== validation.document.slug)) {
    return failure("corrupt-record", "Current draft projections do not match the linked document.");
  }
  return success(value as unknown as CurrentDraftRecordV1);
}

/** IndexedDB implementation of the shared form persistence and concurrency contract. */
export class IndexedDbFormRepository implements FormRepository {
  /** Connection and migration boundary used by all operations. */
  readonly database: FormDatabase;
  /** Injectable business clock for stable timestamps. */
  readonly now: () => Date;
  /** Injectable named-form identity source. */
  readonly createId: () => string;

  /** Creates a repository with production browser dependencies unless tests provide substitutes. */
  constructor(options: IndexedDbFormRepositoryOptions = {}) {
    this.database = new FormDatabase(options);
    this.now = options.now ?? (() => new Date());
    this.createId = options.createId ?? (() => crypto.randomUUID());
  }

  /** Initializes persistence and reports migration or availability failures. */
  async open(): Promise<Result<void, StorageIssue>> {
    /** Physical connection outcome reduced to the repository's void initialization contract. */
    const result = await this.database.open();
    return result.ok ? success(undefined) : result;
  }

  /** Releases the shared database connection. */
  close(): void {
    this.database.close();
  }

  /** Loads and validates the current draft, preserving corrupt source data for recovery. */
  async getCurrentDraft(): Promise<Result<CurrentDraftRecordV1 | null, StorageIssue>> {
    /** Open database required for the draft lookup. */
    const connection = await this.database.open();
    if (!connection.ok) {
      return connection;
    }
    try {
      /** Read-only snapshot for a consistent draft lookup. */
      const transaction = connection.value.transaction(FORM_STORES.drafts, "readonly");
      /** Untrusted persisted value at the singleton draft key. */
      const value = await requestToPromise(transaction.objectStore(FORM_STORES.drafts).get(CURRENT_DRAFT_KEY));
      await transactionToPromise(transaction);
      if (value === undefined) {
        return success(null);
      }
      /** Validated draft or a structured corrupt/incompatible result. */
      const record = await validateDraftRecord(value);
      if (!record.ok) {
        await this.preserveRecoveryCopy(connection.value, CURRENT_DRAFT_KEY, value, record.error.code);
      }
      return record.ok ? success(portableClone(record.value)) : record;
    } catch (cause) {
      return mapStorageError(cause);
    }
  }

  /** Loads one named form through its public slug and quarantines invalid source data. */
  async getBySlug(slug: string): Promise<Result<StoredFormRecordV1 | null, StorageIssue>> {
    if (!isValidFormSlug(slug)) {
      return failure("validation-failed", "The form slug is invalid.");
    }
    /** Open database required for the indexed named-form lookup. */
    const connection = await this.database.open();
    if (!connection.ok) {
      return connection;
    }
    try {
      /** Read-only snapshot for the unique-slug query. */
      const transaction = connection.value.transaction(FORM_STORES.forms, "readonly");
      /** Untrusted named-form value returned by the slug index. */
      const value = await requestToPromise(transaction.objectStore(FORM_STORES.forms).index("slug").get(slug));
      await transactionToPromise(transaction);
      if (value === undefined) {
        return success(null);
      }
      /** Validated named record or a structured corrupt/incompatible result. */
      const record = await validateNamedRecord(value);
      if (!record.ok) {
        await this.preserveRecoveryCopy(connection.value, slug, value, record.error.code);
      }
      return record.ok ? success(portableClone(record.value)) : record;
    } catch (cause) {
      return mapStorageError(cause);
    }
  }

  /** Lists all valid named forms newest-first and stops if any stored record is unsafe to consume. */
  async listNamedForms(): Promise<Result<StoredFormRecordV1[], StorageIssue>> {
    /** Open database required for the landing-page listing. */
    const connection = await this.database.open();
    if (!connection.ok) {
      return connection;
    }
    try {
      /** Read-only snapshot ensuring the list comes from one database state. */
      const transaction = connection.value.transaction(FORM_STORES.forms, "readonly");
      /** Untrusted named-form values returned by the update-time index. */
      const values = await requestToPromise(transaction.objectStore(FORM_STORES.forms).index("updatedAt").getAll());
      await transactionToPromise(transaction);
      /** Detached validated records safe to expose to the landing page. */
      const records: StoredFormRecordV1[] = [];
      /** Validation outcomes retained in source order for precise recovery copies. */
      const validatedRecords = await Promise.all(values.map(value => validateNamedRecord(value)));
      for (let index = 0; index < validatedRecords.length; index += 1) {
        /** Validation outcome for the current stored value. */
        const record = validatedRecords[index];
        /** Original stored value preserved if its validation failed. */
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

  /** Deletes a named form and clears the draft only when it edits that same record. */
  async deleteNamedForm(id: string): Promise<Result<void, StorageIssue>> {
    if (!id) return failure("validation-failed", "The saved form id is required.");
    /** Open database required for the atomic form-and-draft deletion. */
    const connection = await this.database.open();
    if (!connection.ok) return connection;
    try {
      /** Atomic transaction preventing a deleted form from retaining a linked active draft. */
      const transaction = connection.value.transaction([FORM_STORES.forms, FORM_STORES.drafts], "readwrite");
      /** Named-form store participating in the deletion. */
      const forms = transaction.objectStore(FORM_STORES.forms);
      /** Existing named record used to reject deletion of an unknown identity. */
      const record = await requestToPromise(forms.get(id));
      if (record === undefined) {
        transaction.abort();
        return failure("validation-failed", "The saved form was not found.");
      }
      forms.delete(id);
      /** Current draft checked for a link to the deleted form. */
      const draft = await requestToPromise(transaction.objectStore(FORM_STORES.drafts).get(CURRENT_DRAFT_KEY));
      if (isObject(draft) && draft.linkedFormId === id) transaction.objectStore(FORM_STORES.drafts).delete(CURRENT_DRAFT_KEY);
      await transactionToPromise(transaction);
      return success(undefined);
    } catch (cause) {
      return mapStorageError(cause);
    }
  }

  /** Resolves and deletes a named form by public slug while maintaining draft-link integrity. */
  async deleteNamedFormBySlug(slug: string): Promise<Result<void, StorageIssue>> {
    if (!isValidFormSlug(slug)) return failure("validation-failed", "The form slug is invalid.");
    /** Open database required for the atomic slug-based deletion. */
    const connection = await this.database.open();
    if (!connection.ok) return connection;
    try {
      /** Atomic transaction preventing a deleted form from retaining a linked active draft. */
      const transaction = connection.value.transaction([FORM_STORES.forms, FORM_STORES.drafts], "readwrite");
      /** Named-form store used for both slug resolution and identity deletion. */
      const forms = transaction.objectStore(FORM_STORES.forms);
      /** Stored form resolved from the unique public slug. */
      const record = await requestToPromise(forms.index("slug").get(slug));
      if (record === undefined || !isObject(record) || typeof record.id !== "string") {
        transaction.abort();
        return failure("validation-failed", "The saved form was not found.");
      }
      forms.delete(record.id);
      /** Current draft checked for a link to the deleted form. */
      const draft = await requestToPromise(transaction.objectStore(FORM_STORES.drafts).get(CURRENT_DRAFT_KEY));
      if (isObject(draft) && draft.linkedFormId === record.id) transaction.objectStore(FORM_STORES.drafts).delete(CURRENT_DRAFT_KEY);
      await transactionToPromise(transaction);
      return success(undefined);
    } catch (cause) {
      return mapStorageError(cause);
    }
  }

  /** Deletes only the autosaved working draft, leaving all named forms intact. */
  async deleteCurrentDraft(): Promise<Result<void, StorageIssue>> {
    /** Open database required for draft deletion. */
    const connection = await this.database.open();
    if (!connection.ok) return connection;
    try {
      /** Atomic transaction removing the singleton current draft. */
      const transaction = connection.value.transaction(FORM_STORES.drafts, "readwrite");
      transaction.objectStore(FORM_STORES.drafts).delete(CURRENT_DRAFT_KEY);
      await transactionToPromise(transaction);
      return success(undefined);
    } catch (cause) {
      return mapStorageError(cause);
    }
  }

  /**
   * Validates and atomically saves the active draft plus an optional named form,
   * enforcing unique slugs, Save As identity, and optimistic revision checks.
   */
  async save(command: SaveFormCommand): Promise<Result<SavedFormResult, StorageIssue>> {
    /** Detached portable working document that can be safely normalized before persistence. */
    let document: JBFormDocumentV1;
    try {
      document = portableClone(command.document);
    } catch (cause) {
      return failure("validation-failed", "The form contains non-portable values.", { cause });
    }

    /** One business timestamp shared across every record written by this save. */
    const timestamp = this.now().toISOString();
    /** Effective named-form slug derived from explicit user intent, the link, or document state. */
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

    /** Final schema and semantic check after identity and timestamp normalization. */
    const validation = await validateDocument(document);
    if (!validation.valid) {
      return failure("validation-failed", "The form must be valid before it can be saved.", { formIssues: validation.issues });
    }

    /** Open database required for the atomic save. */
    const connection = await this.database.open();
    if (!connection.ok) {
      return connection;
    }
    /** Atomic transaction keeping the current draft aligned with its named revision. */
    const transaction = connection.value.transaction([FORM_STORES.forms, FORM_STORES.drafts], "readwrite");
    try {
      /** Named-form store used when the document has an effective slug. */
      const forms = transaction.objectStore(FORM_STORES.forms);
      /** Named record produced by this save, or null for draft-only persistence. */
      let namedForm: StoredFormRecordV1 | null = null;

      if (requestedSlug) {
        /** Existing identity and slug projections used for conflict and uniqueness checks. */
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

      /** Current-draft snapshot linked to the exact named revision written in this transaction. */
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

  /** Preserves unreadable data for future support or repair without masking the original read failure. */
  private async preserveRecoveryCopy(database: IDBDatabase, sourceId: string, value: unknown, reason: string): Promise<void> {
    try {
      /** Best-effort transaction isolated from the failed read operation. */
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

/** Shared production repository used by every form workflow. */
export const formRepository = new IndexedDbFormRepository();
