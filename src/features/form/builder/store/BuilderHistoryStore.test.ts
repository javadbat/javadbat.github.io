import { describe, expect, it } from "vitest";
import { createEmptyFormDocument, type JBFormDocumentV1 } from "../../domain/form-document";
import { BuilderHistoryStore } from "./BuilderHistoryStore";

function documentNamed(name: string): JBFormDocumentV1 {
  const document = createEmptyFormDocument();
  document.metadata.name = { translations: { en: name } };
  return document;
}

function documentName(document: JBFormDocumentV1 | null): string | undefined {
  return document?.metadata.name.translations.en;
}

describe("BuilderHistoryStore", () => {
  it("moves snapshots through undo and redo", () => {
    const history = new BuilderHistoryStore(documentNamed("First"));

    history.record(documentNamed("Second"));
    history.record(documentNamed("Third"));

    expect(history.canUndo).toBe(true);
    expect(history.canRedo).toBe(false);
    expect(documentName(history.undo())).toBe("Second");
    expect(documentName(history.undo())).toBe("First");
    expect(history.canUndo).toBe(false);
    expect(history.canRedo).toBe(true);
    expect(documentName(history.redo())).toBe("Second");
    expect(documentName(history.current)).toBe("Second");
  });

  it("clears the redo branch when a new snapshot is recorded", () => {
    const history = new BuilderHistoryStore(documentNamed("First"));
    history.record(documentNamed("Second"));
    history.undo();

    history.record(documentNamed("Replacement"));

    expect(history.canRedo).toBe(false);
    expect(history.redo()).toBeNull();
    expect(documentName(history.current)).toBe("Replacement");
  });

  it("can replace the current snapshot without clearing undo history", () => {
    const history = new BuilderHistoryStore(documentNamed("First"));
    history.record(documentNamed("Second"));

    history.replaceCurrent(documentNamed("Saved second"));

    expect(documentName(history.current)).toBe("Saved second");
    expect(documentName(history.undo())).toBe("First");
    expect(documentName(history.redo())).toBe("Saved second");
  });

  it("resets all history around a new current snapshot", () => {
    const history = new BuilderHistoryStore(documentNamed("First"));
    history.record(documentNamed("Second"));

    history.reset(documentNamed("Imported"));

    expect(documentName(history.current)).toBe("Imported");
    expect(history.canUndo).toBe(false);
    expect(history.canRedo).toBe(false);
    expect(history.undo()).toBeNull();
  });
});
