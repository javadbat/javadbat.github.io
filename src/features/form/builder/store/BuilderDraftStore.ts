import { makeAutoObservable, toJS } from "mobx";
import type { JBFormDocumentV1, JBFormElementV1 } from "../../domain/form-document";
import { BuilderHistoryStore } from "./BuilderHistoryStore";

/** Owns the editable document, dirty state, versioning, and history restoration. */
export class BuilderDraftStore {
  document: JBFormDocumentV1;
  isDirty = false;
  readonly history: BuilderHistoryStore;
  private changeVersion = 0;
  private persistedDocument: JBFormDocumentV1 | null = null;

  constructor(document: JBFormDocumentV1) {
    this.document = document;
    this.history = new BuilderHistoryStore(this.clone(document));
    makeAutoObservable<this, "persistedDocument">(
      this,
      { history: false, persistedDocument: false },
      { autoBind: true },
    );
  }

  get version(): number {
    return this.changeVersion;
  }

  snapshot(): JBFormDocumentV1 {
    return toJS(this.document) as JBFormDocumentV1;
  }

  clone(document: JBFormDocumentV1): JBFormDocumentV1 {
    return structuredClone(toJS(document)) as JBFormDocumentV1;
  }

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

  import(document: JBFormDocumentV1): void {
    this.document = this.clone(document);
    this.persistedDocument = null;
    this.isDirty = true;
    this.changeVersion += 1;
    this.history.reset(this.snapshot());
  }

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

  replaceForEdit(document: JBFormDocumentV1): void {
    this.document = document;
    this.markChanged();
  }

  createElementInsertSnapshot(element: JBFormElementV1, insertionIndex: number): JBFormDocumentV1 {
    return {
      ...this.history.current,
      elements: [...this.history.current.elements.slice(0, insertionIndex), toJS(element) as JBFormElementV1, ...this.history.current.elements.slice(insertionIndex)],
    };
  }

  undo(): boolean {
    const previous = this.history.undo();
    if (!previous) return false;
    this.restore(previous);
    return true;
  }

  redo(): boolean {
    const next = this.history.redo();
    if (!next) return false;
    this.restore(next);
    return true;
  }

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

  private restore(document: JBFormDocumentV1): void {
    this.document = this.clone(document);
    const current = this.snapshot();
    this.isDirty = this.persistedDocument ? JSON.stringify(current) !== JSON.stringify(this.persistedDocument) : true;
    this.changeVersion += 1;
  }
}
