import { migrateDatabaseToV1 } from "./migrations/v1";
import { migrateDatabaseToV2 } from "./migrations/v2";
import { FORM_DATABASE_NAME, FORM_DATABASE_VERSION, type Result, type StorageIssue } from "./storage-types";

/** Injectable database configuration used to isolate production storage and deterministic tests. */
export interface FormDatabaseOptions {
  /** IndexedDB name; defaults to the form product's stable database. */
  name?: string;
  /** IndexedDB implementation; tests provide an isolated in-memory factory. */
  factory?: IDBFactory;
}

/** Creates a repository-facing storage failure without leaking browser exceptions into UI code. */
function storageIssue(code: StorageIssue["code"], message: string, cause?: unknown): StorageIssue {
  return { code, message, cause };
}

/** Owns the shared IndexedDB connection and applies physical schema migrations. */
export class FormDatabase {
  /** Database name used to isolate this form workspace. */
  readonly name: string;
  /** Browser or test IndexedDB factory used to open the database. */
  readonly factory: IDBFactory | undefined;
  /** In-flight or fulfilled connection shared by concurrent repository calls. */
  #connectionPromise: Promise<IDBDatabase> | null = null;
  /** Live connection closed explicitly or when another tab requests a version change. */
  #connection: IDBDatabase | null = null;

  /** Creates a database boundary using production defaults unless dependencies are injected. */
  constructor(options: FormDatabaseOptions = {}) {
    this.name = options.name ?? FORM_DATABASE_NAME;
    this.factory = options.factory ?? (typeof indexedDB === "undefined" ? undefined : indexedDB);
  }

  /** Opens the form database and translates platform failures into storage business outcomes. */
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

  /** Releases the shared connection so tests, upgrades, or teardown can reopen cleanly. */
  close(): void {
    this.#connection?.close();
    this.#connection = null;
    this.#connectionPromise = null;
  }

  /** Opens or reuses the physical connection and performs all required schema upgrades. */
  private connection(): Promise<IDBDatabase> {
    if (this.#connectionPromise) {
      return this.#connectionPromise;
    }
    if (!this.factory) {
      return Promise.reject(storageIssue("storage-unavailable", "IndexedDB is unavailable in this browser."));
    }

    this.#connectionPromise = new Promise<IDBDatabase>((resolve, reject) => {
      /** Browser request that opens the current database version or starts its upgrade transaction. */
      const request = this.factory!.open(this.name, FORM_DATABASE_VERSION);
      request.onupgradeneeded = event => {
        try {
          /** Existing schema version used to run each missing migration exactly once. */
          const oldVersion = event.oldVersion;
          /** Browser-owned atomic upgrade transaction in which stores and indexes must be created. */
          const transaction = request.transaction;
          if (!transaction) {
            throw new Error("IndexedDB upgrade transaction is unavailable.");
          }
          if (oldVersion < 1) {
            migrateDatabaseToV1(request.result, transaction);
          }
          if (oldVersion < 2) {
            migrateDatabaseToV2(request.result, transaction);
          }
        } catch (cause) {
          request.transaction?.abort();
          reject(cause);
        }
      };
      request.onblocked = () => reject(storageIssue("storage-blocked", "Close other tabs using JB Form and retry."));
      request.onerror = () => reject(request.error ?? new Error("Could not open the form database."));
      request.onsuccess = () => {
        /** Open connection retained for all repository operations until invalidated. */
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
