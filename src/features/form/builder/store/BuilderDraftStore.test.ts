import { describe, expect, it } from "vitest";
import { createEmptyFormDocument } from "../../domain/form-document";
import { BuilderDraftStore } from "./BuilderDraftStore";

describe("BuilderDraftStore", () => {
  it("owns dirty tracking and document restoration", () => {
    const draft = new BuilderDraftStore(createEmptyFormDocument());
    draft.document.metadata.name.translations.en = "Changed";
    draft.markChanged();

    expect(draft.isDirty).toBe(true);
    expect(draft.history.canUndo).toBe(true);
    expect(draft.undo()).toBe(true);
    expect(draft.document.metadata.name.translations.en).toBe("Untitled form");
    expect(draft.redo()).toBe(true);
    expect(draft.document.metadata.name.translations.en).toBe("Changed");
  });

  it("preserves edits made while an older snapshot is being saved", () => {
    const draft = new BuilderDraftStore(createEmptyFormDocument());
    const savingVersion = draft.version;
    const savedDocument = draft.snapshot();
    savedDocument.slug = "saved-form";

    draft.document.metadata.name.translations.en = "Concurrent edit";
    draft.markChanged();
    draft.commitSaved(savedDocument, savingVersion);

    expect(draft.document.metadata.name.translations.en).toBe("Concurrent edit");
    expect(draft.document.slug).toBe("saved-form");
    expect(draft.isDirty).toBe(true);
  });
});
