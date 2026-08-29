import { FORM_BUILDER_VERSION, FORM_DATABASE_VERSION, FORM_STORES, THEME_SETTINGS_KEY, type StorageMetaRecord, type ThemeSettingsRecordV1 } from "../storage-types";

/** Adds reusable themes and local theme relationships without changing form records. */
export function migrateDatabaseToV2(database: IDBDatabase, transaction: IDBTransaction): void {
  const themes = database.createObjectStore(FORM_STORES.themes, { keyPath: "id" });
  themes.createIndex("slug", "slug", { unique: true });
  themes.createIndex("updatedAt", "updatedAt", { unique: false });

  const settings = database.createObjectStore(FORM_STORES.themeSettings, { keyPath: "key" });
  const timestamp = new Date().toISOString();
  settings.put({
    key: THEME_SETTINGS_KEY,
    recordVersion: 1,
    builderVersion: FORM_BUILDER_VERSION,
    defaultThemeId: null,
    bindings: {},
    updatedAt: timestamp,
  } satisfies ThemeSettingsRecordV1);

  transaction.objectStore(FORM_STORES.meta).put({
    key: "database",
    databaseVersion: FORM_DATABASE_VERSION,
    builderVersion: FORM_BUILDER_VERSION,
    updatedAt: timestamp,
  } satisfies StorageMetaRecord);
}
