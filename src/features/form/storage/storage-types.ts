import type { JBFormDocumentV1 } from "../domain/form-document";
import type { FormIssue } from "../domain/form-issue";

export const FORM_DATABASE_NAME = "jb-form-builder";
export const FORM_DATABASE_VERSION = 1;
export const FORM_BUILDER_VERSION = "0.0.1";
export const CURRENT_DRAFT_KEY = "current" as const;

export const FORM_STORES = {
  forms: "forms",
  drafts: "drafts",
  recovery: "recovery",
  meta: "meta",
} as const;

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

export interface StorageIssue {
  code: StorageIssueCode;
  message: string;
  formIssues?: FormIssue[];
  cause?: unknown;
}

export type Result<T, E> = { ok: true; value: T } | { ok: false; error: E };

export interface LinkedFormReference {
  id: string;
  slug: string;
  revision: number;
}

export interface StoredFormRecordV1 {
  recordVersion: 1;
  builderVersion: string;
  id: string;
  slug: string;
  revision: number;
  createdAt: string;
  updatedAt: string;
  document: JBFormDocumentV1;
}

export interface CurrentDraftRecordV1 {
  key: typeof CURRENT_DRAFT_KEY;
  recordVersion: 1;
  builderVersion: string;
  linkedFormId: string | null;
  linkedSlug: string | null;
  linkedRevision: number | null;
  updatedAt: string;
  document: JBFormDocumentV1;
}

export interface RecoveryRecordV1 {
  id?: number;
  sourceId: string;
  createdAt: string;
  reason: string;
  value: unknown;
}

export interface StorageMetaRecord {
  key: string;
  databaseVersion: number;
  builderVersion: string;
  updatedAt: string;
}

export interface SaveFormCommand {
  document: JBFormDocumentV1;
  linkedRecord: LinkedFormReference | null;
  slug?: string;
  saveAs?: boolean;
}

export interface SavedFormResult {
  document: JBFormDocumentV1;
  draft: CurrentDraftRecordV1;
  namedForm: StoredFormRecordV1 | null;
}

export interface FormRepository {
  open(): Promise<Result<void, StorageIssue>>;
  getCurrentDraft(): Promise<Result<CurrentDraftRecordV1 | null, StorageIssue>>;
  getBySlug(slug: string): Promise<Result<StoredFormRecordV1 | null, StorageIssue>>;
  listNamedForms(): Promise<Result<StoredFormRecordV1[], StorageIssue>>;
  deleteNamedForm(id: string): Promise<Result<void, StorageIssue>>;
  deleteNamedFormBySlug(slug: string): Promise<Result<void, StorageIssue>>;
  deleteCurrentDraft(): Promise<Result<void, StorageIssue>>;
  save(command: SaveFormCommand): Promise<Result<SavedFormResult, StorageIssue>>;
}
