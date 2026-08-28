import { makeAutoObservable } from "mobx";
import type { JBFormDocumentV1 } from "../../domain/form-document";

/** Owns detached document snapshots and undo/redo stack transitions. */
export class BuilderHistoryStore {
  /** Snapshot corresponding to the document currently shown in the builder. */
  private currentDocument: JBFormDocumentV1;
  /** Earlier snapshots available to undo in chronological order. */
  private undoHistory: JBFormDocumentV1[] = [];
  /** Reverted snapshots available to redo until the next new edit. */
  private redoHistory: JBFormDocumentV1[] = [];

  /** Starts history from the initial detached document state. */
  constructor(initialDocument: JBFormDocumentV1) {
    this.currentDocument = initialDocument;
    makeAutoObservable(this, {}, { autoBind: true, deep: false });
  }

  /** Whether the user can step back to an earlier document state. */
  get canUndo(): boolean {
    return this.undoHistory.length > 0;
  }

  /** Whether the user can reapply a previously undone document state. */
  get canRedo(): boolean {
    return this.redoHistory.length > 0;
  }

  /** Document snapshot against which the next edit is recorded. */
  get current(): JBFormDocumentV1 {
    return this.currentDocument;
  }

  /** Records a completed business edit and invalidates the redo branch. */
  record(nextDocument: JBFormDocumentV1): void {
    this.undoHistory = [...this.undoHistory, this.currentDocument];
    this.redoHistory = [];
    this.currentDocument = nextDocument;
  }

  /** Moves one snapshot backward and makes the displaced state redoable. */
  undo(): JBFormDocumentV1 | null {
    /** Most recent earlier document, or absence when history begins. */
    const previous = this.undoHistory.at(-1);
    if (!previous) return null;
    this.undoHistory = this.undoHistory.slice(0, -1);
    this.redoHistory = [...this.redoHistory, this.currentDocument];
    this.currentDocument = previous;
    return previous;
  }

  /** Moves one snapshot forward and makes the displaced state undoable. */
  redo(): JBFormDocumentV1 | null {
    /** Most recently undone document, or absence when no redo branch exists. */
    const next = this.redoHistory.at(-1);
    if (!next) return null;
    this.redoHistory = this.redoHistory.slice(0, -1);
    this.undoHistory = [...this.undoHistory, this.currentDocument];
    this.currentDocument = next;
    return next;
  }

  /** Reconciles the current snapshot after persistence changes server-owned identity fields. */
  replaceCurrent(document: JBFormDocumentV1): void {
    this.currentDocument = document;
  }

  /** Starts a new history timeline after load or import. */
  reset(document: JBFormDocumentV1): void {
    this.currentDocument = document;
    this.undoHistory = [];
    this.redoHistory = [];
  }
}
