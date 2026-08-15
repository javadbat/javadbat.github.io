import { makeAutoObservable } from "mobx";
import type { JBFormDocumentV1 } from "../../domain/form-document";

/** Owns detached document snapshots and undo/redo stack transitions. */
export class BuilderHistoryStore {
  private currentDocument: JBFormDocumentV1;
  private undoHistory: JBFormDocumentV1[] = [];
  private redoHistory: JBFormDocumentV1[] = [];

  constructor(initialDocument: JBFormDocumentV1) {
    this.currentDocument = initialDocument;
    makeAutoObservable(this, {}, { autoBind: true, deep: false });
  }

  get canUndo(): boolean {
    return this.undoHistory.length > 0;
  }

  get canRedo(): boolean {
    return this.redoHistory.length > 0;
  }

  get current(): JBFormDocumentV1 {
    return this.currentDocument;
  }

  record(nextDocument: JBFormDocumentV1): void {
    this.undoHistory = [...this.undoHistory, this.currentDocument];
    this.redoHistory = [];
    this.currentDocument = nextDocument;
  }

  undo(): JBFormDocumentV1 | null {
    const previous = this.undoHistory.at(-1);
    if (!previous) return null;
    this.undoHistory = this.undoHistory.slice(0, -1);
    this.redoHistory = [...this.redoHistory, this.currentDocument];
    this.currentDocument = previous;
    return previous;
  }

  redo(): JBFormDocumentV1 | null {
    const next = this.redoHistory.at(-1);
    if (!next) return null;
    this.redoHistory = this.redoHistory.slice(0, -1);
    this.undoHistory = [...this.undoHistory, this.currentDocument];
    this.currentDocument = next;
    return next;
  }

  replaceCurrent(document: JBFormDocumentV1): void {
    this.currentDocument = document;
  }

  reset(document: JBFormDocumentV1): void {
    this.currentDocument = document;
    this.undoHistory = [];
    this.redoHistory = [];
  }
}
