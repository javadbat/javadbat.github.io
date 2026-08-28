import { makeAutoObservable, toJS } from "mobx";
import type { JBFormDocumentV1, JBFormElementV1 } from "../../domain/form-document";
import { BuilderHistoryStore } from "./BuilderHistoryStore";

/** Owns the editable document, dirty state, versioning, and history restoration. */
export class BuilderDraftStore {
  /** Observable portable document currently edited by the user. */
  document: JBFormDocumentV1;
  /** Whether the visible document differs from its last persisted snapshot. */
  isDirty = false;
  /** Undo and redo timeline for completed document edits. */
  readonly history: BuilderHistoryStore;
  /** Monotonic edit counter used to reconcile saves that finish after newer edits. */
  private changeVersion = 0;
  /** Last persisted document used to calculate dirty state after history restoration. */
  private persistedDocument: JBFormDocumentV1 | null = null;

  /** Creates an editable draft and initializes history from the supplied document. */
  constructor(document: JBFormDocumentV1) {
    this.document = document;
    this.history = new BuilderHistoryStore(this.clone(document));
    makeAutoObservable<this, "persistedDocument">(
      this,
      { history: false, persistedDocument: false },
      { autoBind: true },
    );
  }

  /** Current edit counter captured when asynchronous persistence begins. */
  get version(): number {
    return this.changeVersion;
  }

  /** Produces a plain detached snapshot from MobX-observable document state. */
  snapshot(): JBFormDocumentV1 {
    return toJS(this.document) as JBFormDocumentV1;
  }

  /** Produces a structured clone safe for history, persistence, or replacement. */
  clone(document: JBFormDocumentV1): JBFormDocumentV1 {
    return structuredClone(toJS(document)) as JBFormDocumentV1;
  }

  /** Replaces builder state from persisted data or resets a new unsaved workspace. */
  hydrate(document: JBFormDocumentV1 | null): void {
    if (document) {
      this.document = this.clone(document);
      this.persistedDocument = this.clone(document);
    } else {
      this.persistedDocument = null;
    }
    this.isDirty = false;
    this.changeVersion = 0;
    this.history.reset(this.snapshot());
  }

  /** Replaces the workspace with an imported document and deliberately severs saved-form linkage. */
  import(document: JBFormDocumentV1): void {
    this.document = this.clone(document);
    this.persistedDocument = null;
    this.isDirty = true;
    this.changeVersion += 1;
    this.history.reset(this.snapshot());
  }

  /** Marks one completed business mutation dirty, timestamps it, and records its history snapshot. */
  markChanged(nextHistoryDocument?: JBFormDocumentV1): void {
    this.isDirty = true;
    this.changeVersion += 1;
    this.document.metadata.updatedAt = new Date().toISOString();
    this.history.record(
      nextHistoryDocument
        ? {
            ...nextHistoryDocument,
            metadata: { ...nextHistoryDocument.metadata, updatedAt: this.document.metadata.updatedAt },
          }
        : this.snapshot(),
    );
  }

  /** Replaces the whole document as one undoable edit. */
  replaceForEdit(document: JBFormDocumentV1): void {
    this.document = document;
    this.markChanged();
  }

  /** Builds the correct history snapshot for an element inserted into the visible document. */
  createElementInsertSnapshot(element: JBFormElementV1, insertionIndex: number): JBFormDocumentV1 {
    return {
      ...this.history.current,
      elements: [...this.history.current.elements.slice(0, insertionIndex), toJS(element) as JBFormElementV1, ...this.history.current.elements.slice(insertionIndex)],
    };
  }

  /** Restores the previous document snapshot when available. */
  undo(): boolean {
    /** Previous business state selected by the history timeline. */
    const previous = this.history.undo();
    if (!previous) return false;
    this.restore(previous);
    return true;
  }

  /** Restores the next document snapshot when available. */
  redo(): boolean {
    /** Next business state selected by the history timeline. */
    const next = this.history.redo();
    if (!next) return false;
    this.restore(next);
    return true;
  }

  /** Reconciles a successful save without discarding edits made while that save was in flight. */
  commitSaved(document: JBFormDocumentV1, savingVersion: number): void {
    if (this.changeVersion === savingVersion) {
      this.document = this.clone(document);
      this.persistedDocument = this.clone(document);
      this.isDirty = false;
    } else {
      this.document.id = document.id;
      this.document.metadata.createdAt = document.metadata.createdAt;
      if (document.slug) this.document.slug = document.slug;
      else delete this.document.slug;
      this.persistedDocument = this.clone(document);
      this.isDirty = true;
    }
    this.history.replaceCurrent(this.snapshot());
  }

  /** Restores a history snapshot and recalculates whether it matches persisted state. */
  private restore(document: JBFormDocumentV1): void {
    this.document = this.clone(document);
    /** Restored plain document compared with the last successful persistence snapshot. */
    const current = this.snapshot();
    this.isDirty = this.persistedDocument ? JSON.stringify(current) !== JSON.stringify(this.persistedDocument) : true;
    this.changeVersion += 1;
  }
}
