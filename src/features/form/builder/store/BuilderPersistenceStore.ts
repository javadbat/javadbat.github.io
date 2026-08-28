import { makeAutoObservable, runInAction } from "mobx";
import { formRepository } from "../../storage/form-repository";
import type { FormRepository, LinkedFormReference, StorageIssue } from "../../storage/storage-types";
import type { BuilderDraftStore } from "./BuilderDraftStore";

/** Builder lifecycle states that drive loading, editing, saving, and recovery UI. */
export type BuilderStatus = "loading" | "ready" | "load-error" | "saving" | "save-error";

/** Owns repository I/O and persistence-related UI state. */
export class BuilderPersistenceStore {
  /** Current persistence lifecycle state rendered by the builder shell. */
  status: BuilderStatus = "loading";
  /** Developer-readable persistence messages available to status UI. */
  issues: string[] = [];
  /** Named-form revision edited by the active draft, used for conflict detection. */
  linkedRecord: LinkedFormReference | null = null;
  /** Whether a current-draft record exists after load or save. */
  hasSavedDraft = false;
  /** Structured latest storage failure used for localized recovery decisions. */
  storageIssue: StorageIssue | null = null;
  /** Persistence boundary shared with other form workflows. */
  readonly repository: FormRepository;
  /** Editable draft hydrated or committed by persistence outcomes. */
  private readonly draft: BuilderDraftStore;

  /** Connects one draft to an injectable form repository. */
  constructor(draft: BuilderDraftStore, repository: FormRepository = formRepository) {
    this.draft = draft;
    this.repository = repository;
    makeAutoObservable<this, "draft">(this, { draft: false, repository: false }, { autoBind: true });
  }

  /** Returns the builder to an interactive state and clears previous failures. */
  setReady(): void {
    this.status = "ready";
    this.storageIssue = null;
    this.issues = [];
  }

  /** Keeps the builder editable in memory when browser persistence cannot be used. */
  setMemoryOnly(issue: StorageIssue): void {
    this.status = "ready";
    this.storageIssue = issue;
    this.issues = [issue.message];
  }

  /** Marks an unrecoverable load failure with diagnostic copy. */
  setLoadError(message: string): void {
    this.status = "load-error";
    this.issues = [message];
  }

  /** Deletes a corrupt or incompatible source record so the user can restart safely. */
  async deleteCorruptRecord(slug?: string): Promise<boolean> {
    if (this.storageIssue?.code !== "corrupt-record" && this.storageIssue?.code !== "incompatible-record") return false;
    /** Deletion outcome for either the named source record or current draft. */
    const result = slug ? await this.repository.deleteNamedFormBySlug(slug) : await this.repository.deleteCurrentDraft();
    if (!result.ok) {
      runInAction(() => this.setStorageError(result.error, "load-error"));
      return false;
    }
    runInAction(() => {
      this.draft.hydrate(null);
      this.linkedRecord = null;
      this.hasSavedDraft = false;
      this.setReady();
    });
    return true;
  }

  /** Loads a named form or current draft and establishes its revision linkage. */
  async initialize(slug?: string): Promise<boolean> {
    this.status = "loading";
    this.storageIssue = null;
    this.issues = [];
    /** Repository outcome selected from route identity. */
    const loaded = slug ? await this.repository.getBySlug(slug) : await this.repository.getCurrentDraft();
    if (!loaded.ok) {
      if (loaded.error.code === "storage-unavailable" || loaded.error.code === "storage-blocked") {
        runInAction(() => {
          this.draft.hydrate(null);
          this.linkedRecord = null;
          this.hasSavedDraft = false;
          this.setMemoryOnly(loaded.error);
        });
        return true;
      }
      runInAction(() => this.setStorageError(loaded.error, "load-error"));
      return false;
    }
    if (slug && loaded.value === null) {
      runInAction(() => this.setLoadError(`No saved form was found for “${slug}”.`));
      return false;
    }

    runInAction(() => {
      this.draft.hydrate(loaded.value?.document ?? null);
      if (loaded.value && "revision" in loaded.value) {
        this.linkedRecord = { id: loaded.value.id, slug: loaded.value.slug, revision: loaded.value.revision };
      } else if (loaded.value?.linkedFormId && loaded.value.linkedSlug && loaded.value.linkedRevision) {
        this.linkedRecord = { id: loaded.value.linkedFormId, slug: loaded.value.linkedSlug, revision: loaded.value.linkedRevision };
      } else {
        this.linkedRecord = null;
      }
      this.hasSavedDraft = loaded.value !== null;
      this.setReady();
    });
    return true;
  }

  /** Clears saved-form linkage after import so imported JSON cannot overwrite its source implicitly. */
  resetForImport(): void {
    this.linkedRecord = null;
    this.hasSavedDraft = false;
    this.setReady();
  }

  /** Saves a stable draft snapshot while preserving edits made during the asynchronous operation. */
  async save(options: { slug?: string; saveAs?: boolean } = {}): Promise<boolean> {
    if (this.status === "saving") return false;
    /** Edit version used to detect newer local changes when persistence completes. */
    const savingVersion = this.draft.version;
    /** Detached document representing the exact save request. */
    const snapshot = this.draft.snapshot();
    this.status = "saving";
    this.storageIssue = null;
    this.issues = [];
    /** Atomic repository save outcome. */
    const result = await this.repository.save({
      document: snapshot,
      linkedRecord: options.saveAs ? null : this.linkedRecord,
      slug: options.slug,
      saveAs: options.saveAs,
    });
    if (!result.ok) {
      runInAction(() => this.setStorageError(result.error, "save-error"));
      return false;
    }

    runInAction(() => {
      this.linkedRecord = result.value.namedForm
        ? { id: result.value.namedForm.id, slug: result.value.namedForm.slug, revision: result.value.namedForm.revision }
        : null;
      this.hasSavedDraft = true;
      this.draft.commitSaved(result.value.document, savingVersion);
      this.status = "ready";
    });
    return true;
  }

  /** Applies a structured storage failure to builder lifecycle and status copy. */
  private setStorageError(issue: StorageIssue, status: "load-error" | "save-error"): void {
    this.storageIssue = issue;
    this.status = status;
    this.issues = [issue.message];
  }
}
