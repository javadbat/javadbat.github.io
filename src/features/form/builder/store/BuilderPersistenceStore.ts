import { makeAutoObservable, runInAction } from "mobx";
import { formRepository } from "../../storage/form-repository";
import type { FormRepository, LinkedFormReference, StorageIssue } from "../../storage/storage-types";
import type { BuilderDraftStore } from "./BuilderDraftStore";

export type BuilderStatus = "loading" | "ready" | "load-error" | "saving" | "save-error";

/** Owns repository I/O and persistence-related UI state. */
export class BuilderPersistenceStore {
  status: BuilderStatus = "loading";
  issues: string[] = [];
  linkedRecord: LinkedFormReference | null = null;
  hasSavedDraft = false;
  storageIssue: StorageIssue | null = null;
  readonly repository: FormRepository;
  private readonly draft: BuilderDraftStore;

  constructor(draft: BuilderDraftStore, repository: FormRepository = formRepository) {
    this.draft = draft;
    this.repository = repository;
    makeAutoObservable<this, "draft">(this, { draft: false, repository: false }, { autoBind: true });
  }

  setReady(): void {
    this.status = "ready";
    this.storageIssue = null;
    this.issues = [];
  }

  setMemoryOnly(issue: StorageIssue): void {
    this.status = "ready";
    this.storageIssue = issue;
    this.issues = [issue.message];
  }

  setLoadError(message: string): void {
    this.status = "load-error";
    this.issues = [message];
  }

  async deleteCorruptRecord(slug?: string): Promise<boolean> {
    if (this.storageIssue?.code !== "corrupt-record" && this.storageIssue?.code !== "incompatible-record") return false;
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

  async initialize(slug?: string): Promise<boolean> {
    this.status = "loading";
    this.storageIssue = null;
    this.issues = [];
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

  resetForImport(): void {
    this.linkedRecord = null;
    this.hasSavedDraft = false;
    this.setReady();
  }

  async save(options: { slug?: string; saveAs?: boolean } = {}): Promise<boolean> {
    if (this.status === "saving") return false;
    const savingVersion = this.draft.version;
    const snapshot = this.draft.snapshot();
    this.status = "saving";
    this.storageIssue = null;
    this.issues = [];
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

  private setStorageError(issue: StorageIssue, status: "load-error" | "save-error"): void {
    this.storageIssue = issue;
    this.status = status;
    this.issues = [issue.message];
  }
}
