import { migrateDatabaseToV1 } from "./migrations/v1";
import { FORM_DATABASE_NAME, FORM_DATABASE_VERSION, type Result, type StorageIssue } from "./storage-types";

export interface FormDatabaseOptions {
  name?: string;
  factory?: IDBFactory;
}

function storageIssue(code: StorageIssue["code"], message: string, cause?: unknown): StorageIssue {
  return { code, message, cause };
}

export class FormDatabase {
  readonly name: string;
  readonly factory: IDBFactory | undefined;
  #connectionPromise: Promise<IDBDatabase> | null = null;
  #connection: IDBDatabase | null = null;

  constructor(options: FormDatabaseOptions = {}) {
    this.name = options.name ?? FORM_DATABASE_NAME;
    this.factory = options.factory ?? (typeof indexedDB === "undefined" ? undefined : indexedDB);
  }

  async open(): Promise<Result<IDBDatabase, StorageIssue>> {
    try {
      return { ok: true, value: await this.connection() };
    } catch (cause) {
      this.#connectionPromise = null;
      if (cause instanceof DOMException && cause.name === "VersionError") {
        return {
          ok: false,
          error: storageIssue("incompatible-record", "A newer incompatible form database is present.", cause),
        };
      }
      if (typeof cause === "object" && cause !== null && "code" in cause && (cause as { code?: unknown }).code === "storage-blocked") {
        return {
          ok: false,
          error: cause as StorageIssue,
        };
      }
      return {
        ok: false,
        error: storageIssue("storage-unavailable", "IndexedDB is unavailable in this browser.", cause),
      };
    }
  }

  close(): void {
    this.#connection?.close();
    this.#connection = null;
    this.#connectionPromise = null;
  }

  private connection(): Promise<IDBDatabase> {
    if (this.#connectionPromise) {
      return this.#connectionPromise;
    }
    if (!this.factory) {
      return Promise.reject(storageIssue("storage-unavailable", "IndexedDB is unavailable in this browser."));
    }

    this.#connectionPromise = new Promise<IDBDatabase>((resolve, reject) => {
      const request = this.factory!.open(this.name, FORM_DATABASE_VERSION);
      request.onupgradeneeded = event => {
        try {
          const oldVersion = event.oldVersion;
          const transaction = request.transaction;
          if (!transaction) {
            throw new Error("IndexedDB upgrade transaction is unavailable.");
          }
          if (oldVersion < 1) {
            migrateDatabaseToV1(request.result, transaction);
          }
        } catch (cause) {
          request.transaction?.abort();
          reject(cause);
        }
      };
      request.onblocked = () => reject(storageIssue("storage-blocked", "Close other tabs using JB Form and retry."));
      request.onerror = () => reject(request.error ?? new Error("Could not open the form database."));
      request.onsuccess = () => {
        const database = request.result;
        this.#connection = database;
        database.onversionchange = () => {
          database.close();
          this.#connection = null;
          this.#connectionPromise = null;
        };
        resolve(database);
      };
    });
    return this.#connectionPromise;
  }
}
