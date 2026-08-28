import { FORM_BUILDER_VERSION, FORM_DATABASE_VERSION, FORM_STORES, type StorageMetaRecord } from "../storage-types";

/** Creates the initial atomic storage schema for named forms, draft autosave, recovery, and metadata. */
export function migrateDatabaseToV1(database: IDBDatabase, transaction: IDBTransaction): void {
  /** Named-form store indexed by public slug and update time. */
  const forms = database.createObjectStore(FORM_STORES.forms, {
    keyPath: "id",
  });
  forms.createIndex("slug", "slug", { unique: true });
  forms.createIndex("updatedAt", "updatedAt", { unique: false });

  database.createObjectStore(FORM_STORES.drafts, { keyPath: "key" });

  /** Quarantine store that preserves unreadable values for later recovery. */
  const recovery = database.createObjectStore(FORM_STORES.recovery, {
    keyPath: "id",
    autoIncrement: true,
  });
  recovery.createIndex("sourceId", "sourceId", { unique: false });
  recovery.createIndex("createdAt", "createdAt", { unique: false });

  /** Schema metadata store used to identify the writer and physical database version. */
  const meta = database.createObjectStore(FORM_STORES.meta, {
    keyPath: "key",
  });
  /** One migration timestamp shared by the metadata record. */
  const timestamp = new Date().toISOString();
  meta.put({
    key: "database",
    databaseVersion: FORM_DATABASE_VERSION,
    builderVersion: FORM_BUILDER_VERSION,
    updatedAt: timestamp,
  } satisfies StorageMetaRecord);

  if (!transaction.objectStoreNames.contains(FORM_STORES.meta)) {
    throw new Error("The metadata store was not created.");
  }
}
