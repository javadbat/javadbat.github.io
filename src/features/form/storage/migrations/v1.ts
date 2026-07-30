import { FORM_BUILDER_VERSION, FORM_DATABASE_VERSION, FORM_STORES, type StorageMetaRecord } from "../storage-types";

export function migrateDatabaseToV1(database: IDBDatabase, transaction: IDBTransaction): void {
  const forms = database.createObjectStore(FORM_STORES.forms, {
    keyPath: "id",
  });
  forms.createIndex("slug", "slug", { unique: true });
  forms.createIndex("updatedAt", "updatedAt", { unique: false });

  database.createObjectStore(FORM_STORES.drafts, { keyPath: "key" });

  const recovery = database.createObjectStore(FORM_STORES.recovery, {
    keyPath: "id",
    autoIncrement: true,
  });
  recovery.createIndex("sourceId", "sourceId", { unique: false });
  recovery.createIndex("createdAt", "createdAt", { unique: false });

  const meta = database.createObjectStore(FORM_STORES.meta, {
    keyPath: "key",
  });
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
