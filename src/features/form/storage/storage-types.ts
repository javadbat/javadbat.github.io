import type { JBFormDocumentV1 } from "../domain/form-document";
import type { FormIssue } from "../domain/form-issue";
import type { ThemeConfigV1 } from "jb-form-builder/contract/theme";

/** Stable IndexedDB database name shared by every `/form` route. */
export const FORM_DATABASE_NAME = "jb-form-builder";
/** Current physical IndexedDB schema version used to trigger migrations. */
export const FORM_DATABASE_VERSION = 2;
/** Application version stamped onto records for support and recovery diagnostics. */
export const FORM_BUILDER_VERSION = "0.0.1";
/** Singleton key identifying the browser's one autosaved working draft. */
export const CURRENT_DRAFT_KEY = "current" as const;
export const THEME_SETTINGS_KEY = "current" as const;

/** Canonical object-store names for saved forms, the active draft, recovery data, and schema metadata. */
export const FORM_STORES = {
  forms: "forms",
  drafts: "drafts",
  recovery: "recovery",
  meta: "meta",
  themes: "themes",
  themeSettings: "themeSettings",
} as const;

/** Business failures that storage callers must distinguish and present to users. */
export type StorageIssueCode =
  | "storage-unavailable"
  | "storage-blocked"
  | "transaction-aborted"
  | "quota-exceeded"
  | "slug-collision"
  | "revision-conflict"
  | "validation-failed"
  | "corrupt-record"
  | "incompatible-record"
  | "unknown-storage-error";

/** Structured persistence failure returned instead of throwing across route and store boundaries. */
export interface StorageIssue {
  /** Stable category used to select recovery behavior and localized user guidance. */
  code: StorageIssueCode;
  /** Developer-readable explanation retained for diagnostics and fallback UI. */
  message: string;
  /** Document-validation details when persistence was rejected for invalid form data. */
  formIssues?: FormIssue[];
  /** Original platform error retained for logging or deeper diagnosis. */
  cause?: unknown;
}

/** Explicit success-or-failure envelope used by all repository operations. */
export type Result<T, E> = { ok: true; value: T } | { ok: false; error: E };

/** Identity and revision of the named form associated with a working draft. */
export interface LinkedFormReference {
  /** Immutable record identity used for updates and deletion. */
  id: string;
  /** Human-readable URL identity protected by a unique database index. */
  slug: string;
  /** Optimistic-concurrency version that prevents silent overwrites. */
  revision: number;
}

/** Version-one persistent record for a user-named form. */
export interface StoredFormRecordV1 {
  /** Record-shape version, independent from both database and document schema versions. */
  recordVersion: 1;
  /** Builder release that last wrote the record. */
  builderVersion: string;
  /** Immutable primary key. */
  id: string;
  /** Unique public identifier used by form routes. */
  slug: string;
  /** Incremented save version used for edit-conflict detection. */
  revision: number;
  /** Creation time retained across updates. */
  createdAt: string;
  /** Most recent successful save time used for ordering and display. */
  updatedAt: string;
  /** Validated portable form content. */
  document: JBFormDocumentV1;
}

/** Version-one autosave record for the browser's active builder work. */
export interface CurrentDraftRecordV1 {
  /** Singleton object-store key. */
  key: typeof CURRENT_DRAFT_KEY;
  /** Record-shape version used during compatibility checks. */
  recordVersion: 1;
  /** Builder release that last updated the draft. */
  builderVersion: string;
  /** Named-form identity when the draft edits a saved record. */
  linkedFormId: string | null;
  /** Named-form URL identity captured with the linked revision. */
  linkedSlug: string | null;
  /** Saved revision from which this draft originated. */
  linkedRevision: number | null;
  /** Most recent autosave time. */
  updatedAt: string;
  /** Validated portable working document. */
  document: JBFormDocumentV1;
}

/** Quarantined legacy or corrupt value retained so failed migrations do not destroy user data. */
export interface RecoveryRecordV1 {
  /** Auto-generated recovery-store key. */
  id?: number;
  /** Original record identity or store key. */
  sourceId: string;
  /** Time at which the value was quarantined. */
  createdAt: string;
  /** Human-readable reason the application could not safely consume the value. */
  reason: string;
  /** Untouched source value available for future repair tooling. */
  value: unknown;
}

/** Database-level metadata describing the schema and writer version. */
export interface StorageMetaRecord {
  /** Metadata record identity. */
  key: string;
  /** Physical IndexedDB schema version. */
  databaseVersion: number;
  /** Builder release that performed the migration or update. */
  builderVersion: string;
  /** Time this metadata snapshot was written. */
  updatedAt: string;
}

/** Independent reusable theme record stored outside every form document. */
export interface StoredThemeRecordV1 {
  recordVersion: 1;
  builderVersion: string;
  id: string;
  /** Stable URL identity generated at creation and retained across renames. */
  slug: string;
  revision: number;
  createdAt: string;
  updatedAt: string;
  config: ThemeConfigV1;
}

/** Local-only default selection and form bindings; never included in portable JSON. */
export interface ThemeSettingsRecordV1 {
  key: typeof THEME_SETTINGS_KEY;
  recordVersion: 1;
  builderVersion: string;
  defaultThemeId: string | null;
  bindings: Record<string, string>;
  updatedAt: string;
}

export interface SaveThemeCommand {
  id: string;
  revision: number;
  config: ThemeConfigV1;
}

export interface ThemeRepository {
  open(): Promise<Result<void, StorageIssue>>;
  create(config: ThemeConfigV1): Promise<Result<StoredThemeRecordV1, StorageIssue>>;
  save(command: SaveThemeCommand): Promise<Result<StoredThemeRecordV1, StorageIssue>>;
  getById(id: string): Promise<Result<StoredThemeRecordV1 | null, StorageIssue>>;
  getBySlug(slug: string): Promise<Result<StoredThemeRecordV1 | null, StorageIssue>>;
  list(): Promise<Result<StoredThemeRecordV1[], StorageIssue>>;
  getSettings(): Promise<Result<ThemeSettingsRecordV1, StorageIssue>>;
  setDefault(themeId: string | null): Promise<Result<ThemeSettingsRecordV1, StorageIssue>>;
  bindForm(formSlug: string, themeId: string | null): Promise<Result<ThemeSettingsRecordV1, StorageIssue>>;
}

/** User intent supplied to the repository's atomic save workflow. */
export interface SaveFormCommand {
  /** Current portable document to validate and persist. */
  document: JBFormDocumentV1;
  /** Previously loaded named record used for optimistic concurrency. */
  linkedRecord: LinkedFormReference | null;
  /** Requested URL identifier when naming or renaming through Save As. */
  slug?: string;
  /** Requests creation of a distinct named record instead of updating the linked one. */
  saveAs?: boolean;
}

/** Records produced by one successful atomic save. */
export interface SavedFormResult {
  /** Validated clone that became the persisted source of truth. */
  document: JBFormDocumentV1;
  /** Updated current draft linked to the saved revision when applicable. */
  draft: CurrentDraftRecordV1;
  /** Created or updated named form, or null for a draft-only save. */
  namedForm: StoredFormRecordV1 | null;
}

/** Persistence capabilities shared by builder, landing, designer, and preview workflows. */
export interface FormRepository {
  /** Opens storage and runs required schema migrations. */
  open(): Promise<Result<void, StorageIssue>>;
  /** Loads the singleton working draft. */
  getCurrentDraft(): Promise<Result<CurrentDraftRecordV1 | null, StorageIssue>>;
  /** Loads a named form by its public slug. */
  getBySlug(slug: string): Promise<Result<StoredFormRecordV1 | null, StorageIssue>>;
  /** Lists named forms newest-first for the landing page. */
  listNamedForms(): Promise<Result<StoredFormRecordV1[], StorageIssue>>;
  /** Removes a named form by immutable identity. */
  deleteNamedForm(id: string): Promise<Result<void, StorageIssue>>;
  /** Removes a named form resolved from its public slug. */
  deleteNamedFormBySlug(slug: string): Promise<Result<void, StorageIssue>>;
  /** Clears the singleton working draft without deleting named forms. */
  deleteCurrentDraft(): Promise<Result<void, StorageIssue>>;
  /** Validates and atomically persists the requested draft and optional named form. */
  save(command: SaveFormCommand): Promise<Result<SavedFormResult, StorageIssue>>;
}
