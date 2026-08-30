import {
  FORM_BUILDER_VERSION,
  FORM_STORES,
  THEME_SETTINGS_KEY,
  type StorageMetaRecord,
  type ThemeSettingsRecordV1,
} from "../storage-types";

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
  const themes = database.createObjectStore(FORM_STORES.themes, { keyPath: "id" });
  themes.createIndex("slug", "slug", { unique: true });
  themes.createIndex("updatedAt", "updatedAt", { unique: false });

  const themeSettings = database.createObjectStore(FORM_STORES.themeSettings, { keyPath: "key" });
  /** One migration timestamp shared by the metadata record. */
  const timestamp = new Date().toISOString();
  themeSettings.put({
    key: THEME_SETTINGS_KEY,
    recordVersion: 1,
    builderVersion: FORM_BUILDER_VERSION,
    defaultThemeId: null,
    bindings: {},
    updatedAt: timestamp,
  } satisfies ThemeSettingsRecordV1);
  meta.put({
    key: "database",
    databaseVersion: 1,
    builderVersion: FORM_BUILDER_VERSION,
    updatedAt: timestamp,
  } satisfies StorageMetaRecord);

  if (!transaction.objectStoreNames.contains(FORM_STORES.meta)) {
    throw new Error("The metadata store was not created.");
  }
}
