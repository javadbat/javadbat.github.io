import type { JBFormDocumentV1 } from "./contract/form-document";
import type { FormIssue } from "./contract/form-issue";

export interface PreparedDocument {
  document?: JBFormDocumentV1;
  issues: FormIssue[];
}

function cloneIssue(error: unknown): FormIssue {
  return {
    source: "renderer",
    code: "document_clone_failed",
    path: "/",
    messageKey: "form.renderer.documentCloneFailed",
    message: error instanceof Error ? `The form document could not be cloned: ${error.message}` : "The form document could not be cloned.",
  };
}

/**
 * Clone on assignment so a caller cannot mutate a document while an async
 * dependency load is in flight. The renderer never silently repairs or writes
 * into the caller's object.
 */
export function cloneFormDocument(value: JBFormDocumentV1): PreparedDocument {
  try {
    return { document: structuredClone(value), issues: [] };
  } catch (error) {
    return { issues: [cloneIssue(error)] };
  }
}

export async function prepareFormDocument(value: JBFormDocumentV1): Promise<PreparedDocument> {
  const cloned = cloneFormDocument(value);
  if (!cloned.document) {
    return cloned;
  }

  // Ajv is intentionally deferred until a document exists. Empty custom
  // elements therefore do not pull schema compilation into their startup work.
  const { validateFormDocument } = await import("./contract/form-document-validation");
  const validation = validateFormDocument(cloned.document);
  return validation.valid && validation.document ? { document: validation.document, issues: [] } : { issues: validation.issues };
}
