import { canonicalizeThemeConfig, validateThemeConfig, type ThemeConfigV1 } from "jb-form-builder/contract/theme";
import { isValidFormSlug, normalizeFormSlug } from "../application/form-slug";
import { FormDatabase, type FormDatabaseOptions } from "./database";
import { requestToPromise, transactionToPromise } from "./idb-helpers";
import {
  FORM_BUILDER_VERSION,
  FORM_STORES,
  THEME_SETTINGS_KEY,
  type Result,
  type SaveThemeCommand,
  type StorageIssue,
  type StoredThemeRecordV1,
  type ThemeRepository,
  type ThemeSettingsRecordV1,
} from "./storage-types";

export interface IndexedDbThemeRepositoryOptions extends FormDatabaseOptions {
  now?: () => Date;
  createId?: () => string;
}

function success<T>(value: T): Result<T, StorageIssue> {
  return { ok: true, value };
}

function failure<T = never>(code: StorageIssue["code"], message: string, cause?: unknown): Result<T, StorageIssue> {
  return { ok: false, error: { code, message, cause } };
}

function errorName(cause: unknown): string {
  return typeof cause === "object" && cause !== null && "name" in cause && typeof (cause as { name?: unknown }).name === "string"
    ? (cause as { name: string }).name
    : "";
}

function mapStorageError<T>(cause: unknown): Result<T, StorageIssue> {
  switch (errorName(cause)) {
    case "QuotaExceededError": return failure("quota-exceeded", "Browser storage quota was exceeded.", cause);
    case "ConstraintError": return failure("slug-collision", "Another theme already uses this slug.", cause);
    case "AbortError": return failure("transaction-aborted", "The theme storage transaction was aborted.", cause);
    case "VersionError": return failure("incompatible-record", "The form database was created by a newer version.", cause);
    default: return failure("unknown-storage-error", "The theme could not be read or saved.", cause);
  }
}

function portableClone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function validateStoredTheme(value: unknown): Result<StoredThemeRecordV1, StorageIssue> {
  if (
    !isObject(value) ||
    value.recordVersion !== 1 ||
    typeof value.builderVersion !== "string" ||
    typeof value.id !== "string" ||
    typeof value.slug !== "string" ||
    !isValidFormSlug(value.slug) ||
    typeof value.revision !== "number" ||
    !Number.isInteger(value.revision) ||
    value.revision < 1 ||
    typeof value.createdAt !== "string" ||
    typeof value.updatedAt !== "string"
  ) {
    return failure(
      isObject(value) && typeof value.recordVersion === "number" && value.recordVersion > 1 ? "incompatible-record" : "corrupt-record",
      "The saved theme record is corrupt or incompatible.",
    );
  }
  const validation = validateThemeConfig(value.config);
  if (!validation.valid) return failure("corrupt-record", "The saved theme config failed validation.", validation.issues);
  return success(value as unknown as StoredThemeRecordV1);
}

function validateSettings(value: unknown): Result<ThemeSettingsRecordV1, StorageIssue> {
  if (
    !isObject(value) ||
    value.key !== THEME_SETTINGS_KEY ||
    value.recordVersion !== 1 ||
    typeof value.builderVersion !== "string" ||
    !(value.defaultThemeId === null || typeof value.defaultThemeId === "string") ||
    !isObject(value.bindings) ||
    typeof value.updatedAt !== "string" ||
    Object.entries(value.bindings).some(([formSlug, themeId]) => !isValidFormSlug(formSlug) || typeof themeId !== "string" || !themeId)
  ) {
    return failure("corrupt-record", "Theme settings are corrupt or incompatible.");
  }
  return success(value as unknown as ThemeSettingsRecordV1);
}

function canonicalConfig(value: ThemeConfigV1): Result<ThemeConfigV1, StorageIssue> {
  try {
    return success(canonicalizeThemeConfig(value));
  } catch (cause) {
    return failure("validation-failed", "The theme must be valid before it can be saved.", cause);
  }
}

/** IndexedDB persistence for independent themes and their local relationships. */
export class IndexedDbThemeRepository implements ThemeRepository {
  readonly database: FormDatabase;
  readonly now: () => Date;
  readonly createId: () => string;

  constructor(options: IndexedDbThemeRepositoryOptions = {}) {
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

  async create(config: ThemeConfigV1): Promise<Result<StoredThemeRecordV1, StorageIssue>> {
    const canonical = canonicalConfig(config);
    if (!canonical.ok) return canonical;
    const connection = await this.database.open();
    if (!connection.ok) return connection;
    const transaction = connection.value.transaction(FORM_STORES.themes, "readwrite");
    try {
      const store = transaction.objectStore(FORM_STORES.themes);
      const base = normalizeFormSlug(canonical.value.name) || "theme";
      let slug = base;
      let suffix = 2;
      while (await requestToPromise(store.index("slug").getKey(slug)) !== undefined) {
        const suffixText = `-${suffix++}`;
        slug = `${base.slice(0, 80 - suffixText.length).replace(/-+$/g, "")}${suffixText}`;
      }
      const timestamp = this.now().toISOString();
      const record: StoredThemeRecordV1 = {
        recordVersion: 1,
        builderVersion: FORM_BUILDER_VERSION,
        id: this.createId(),
        slug,
        revision: 1,
        createdAt: timestamp,
        updatedAt: timestamp,
        config: portableClone(canonical.value),
      };
      store.add(record);
      await transactionToPromise(transaction);
      return success(portableClone(record));
    } catch (cause) {
      return mapStorageError(cause);
    }
  }

  async save(command: SaveThemeCommand): Promise<Result<StoredThemeRecordV1, StorageIssue>> {
    if (!command.id || !Number.isInteger(command.revision) || command.revision < 1) return failure("validation-failed", "A valid linked theme revision is required.");
    const canonical = canonicalConfig(command.config);
    if (!canonical.ok) return canonical;
    const connection = await this.database.open();
    if (!connection.ok) return connection;
    const transaction = connection.value.transaction(FORM_STORES.themes, "readwrite");
    try {
      const store = transaction.objectStore(FORM_STORES.themes);
      const value = await requestToPromise(store.get(command.id));
      const current = validateStoredTheme(value);
      if (!current.ok || current.value.revision !== command.revision) {
        transaction.abort();
        return failure("revision-conflict", "This theme changed in another tab. Reload it before saving.");
      }
      const record: StoredThemeRecordV1 = {
        ...current.value,
        revision: current.value.revision + 1,
        updatedAt: this.now().toISOString(),
        config: portableClone(canonical.value),
      };
      store.put(record);
      await transactionToPromise(transaction);
      return success(portableClone(record));
    } catch (cause) {
      return mapStorageError(cause);
    }
  }

  async getById(id: string): Promise<Result<StoredThemeRecordV1 | null, StorageIssue>> {
    if (!id) return failure("validation-failed", "Theme id is required.");
    return this.readTheme(store => store.get(id));
  }

  async getBySlug(slug: string): Promise<Result<StoredThemeRecordV1 | null, StorageIssue>> {
    if (!isValidFormSlug(slug)) return failure("validation-failed", "Theme slug is invalid.");
    return this.readTheme(store => store.index("slug").get(slug));
  }

  async list(): Promise<Result<StoredThemeRecordV1[], StorageIssue>> {
    const connection = await this.database.open();
    if (!connection.ok) return connection;
    try {
      const transaction = connection.value.transaction(FORM_STORES.themes, "readonly");
      const values = await requestToPromise(transaction.objectStore(FORM_STORES.themes).index("updatedAt").getAll());
      await transactionToPromise(transaction);
      const records: StoredThemeRecordV1[] = [];
      for (const value of values) {
        const record = validateStoredTheme(value);
        if (!record.ok) return record;
        records.push(portableClone(record.value));
      }
      records.sort((left, right) => right.updatedAt.localeCompare(left.updatedAt));
      return success(records);
    } catch (cause) {
      return mapStorageError(cause);
    }
  }

  async getSettings(): Promise<Result<ThemeSettingsRecordV1, StorageIssue>> {
    const connection = await this.database.open();
    if (!connection.ok) return connection;
    try {
      const transaction = connection.value.transaction(FORM_STORES.themeSettings, "readonly");
      const value = await requestToPromise(transaction.objectStore(FORM_STORES.themeSettings).get(THEME_SETTINGS_KEY));
      await transactionToPromise(transaction);
      const settings = validateSettings(value);
      return settings.ok ? success(portableClone(settings.value)) : settings;
    } catch (cause) {
      return mapStorageError(cause);
    }
  }

  async setDefault(themeId: string | null): Promise<Result<ThemeSettingsRecordV1, StorageIssue>> {
    return this.updateSettings(themeId, undefined);
  }

  async bindForm(formSlug: string, themeId: string | null): Promise<Result<ThemeSettingsRecordV1, StorageIssue>> {
    if (!isValidFormSlug(formSlug)) return failure("validation-failed", "Form slug is invalid.");
    return this.updateSettings(undefined, { formSlug, themeId });
  }

  async duplicate(id: string): Promise<Result<StoredThemeRecordV1, StorageIssue>> {
    const source = await this.getById(id);
    if (!source.ok) return source;
    if (!source.value) return failure("validation-failed", "The theme to duplicate was not found.");
    return this.create({
      ...source.value.config,
      name: `${source.value.config.name} copy`,
    });
  }

  async delete(id: string, replacementThemeId: string | null): Promise<Result<ThemeSettingsRecordV1, StorageIssue>> {
    if (!id) return failure("validation-failed", "Theme id is required.");
    if (replacementThemeId === id) return failure("validation-failed", "A deleted theme cannot replace itself.");
    const connection = await this.database.open();
    if (!connection.ok) return connection;
    const transaction = connection.value.transaction([FORM_STORES.themes, FORM_STORES.themeSettings], "readwrite");
    try {
      const themes = transaction.objectStore(FORM_STORES.themes);
      if (await requestToPromise(themes.getKey(id)) === undefined) {
        transaction.abort();
        return failure("validation-failed", "The theme to delete was not found.");
      }
      if (replacementThemeId && await requestToPromise(themes.getKey(replacementThemeId)) === undefined) {
        transaction.abort();
        return failure("validation-failed", "The replacement theme was not found.");
      }

      const settingsStore = transaction.objectStore(FORM_STORES.themeSettings);
      const current = validateSettings(await requestToPromise(settingsStore.get(THEME_SETTINGS_KEY)));
      if (!current.ok) {
        transaction.abort();
        return current;
      }
      const next = portableClone(current.value);
      if (next.defaultThemeId === id) next.defaultThemeId = replacementThemeId;
      for (const [formSlug, themeId] of Object.entries(next.bindings)) {
        if (themeId !== id) continue;
        if (replacementThemeId) next.bindings[formSlug] = replacementThemeId;
        else delete next.bindings[formSlug];
      }
      next.updatedAt = this.now().toISOString();
      next.builderVersion = FORM_BUILDER_VERSION;
      settingsStore.put(next);
      themes.delete(id);
      await transactionToPromise(transaction);
      return success(portableClone(next));
    } catch (cause) {
      return mapStorageError(cause);
    }
  }

  private async readTheme(request: (store: IDBObjectStore) => IDBRequest): Promise<Result<StoredThemeRecordV1 | null, StorageIssue>> {
    const connection = await this.database.open();
    if (!connection.ok) return connection;
    try {
      const transaction = connection.value.transaction(FORM_STORES.themes, "readonly");
      const value = await requestToPromise(request(transaction.objectStore(FORM_STORES.themes)));
      await transactionToPromise(transaction);
      if (value === undefined) return success(null);
      const record = validateStoredTheme(value);
      return record.ok ? success(portableClone(record.value)) : record;
    } catch (cause) {
      return mapStorageError(cause);
    }
  }

  private async updateSettings(defaultThemeId: string | null | undefined, binding: { formSlug: string; themeId: string | null } | undefined): Promise<Result<ThemeSettingsRecordV1, StorageIssue>> {
    const connection = await this.database.open();
    if (!connection.ok) return connection;
    const transaction = connection.value.transaction([FORM_STORES.themes, FORM_STORES.themeSettings], "readwrite");
    try {
      const targetId = defaultThemeId !== undefined ? defaultThemeId : binding?.themeId;
      if (targetId && await requestToPromise(transaction.objectStore(FORM_STORES.themes).getKey(targetId)) === undefined) {
        transaction.abort();
        return failure("validation-failed", "The selected theme was not found.");
      }
      const settingsStore = transaction.objectStore(FORM_STORES.themeSettings);
      const current = validateSettings(await requestToPromise(settingsStore.get(THEME_SETTINGS_KEY)));
      if (!current.ok) {
        transaction.abort();
        return current;
      }
      const next = portableClone(current.value);
      if (defaultThemeId !== undefined) next.defaultThemeId = defaultThemeId;
      if (binding) {
        if (binding.themeId) next.bindings[binding.formSlug] = binding.themeId;
        else delete next.bindings[binding.formSlug];
      }
      next.updatedAt = this.now().toISOString();
      next.builderVersion = FORM_BUILDER_VERSION;
      settingsStore.put(next);
      await transactionToPromise(transaction);
      return success(portableClone(next));
    } catch (cause) {
      return mapStorageError(cause);
    }
  }
}

export const themeRepository = new IndexedDbThemeRepository();
