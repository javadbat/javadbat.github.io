import type { FormIssue } from "../domain/form-issue";
import type { JBFormDocumentV1, JSONValue } from "../domain/form-document";
import { validateFormDocument } from "../domain/form-document-validation";

export interface PreparedFormExport {
  valid: true;
  document: JBFormDocumentV1;
  json: string;
  fileName: string;
}

export interface RejectedFormExport {
  valid: false;
  issues: FormIssue[];
}

export type FormExportResult = PreparedFormExport | RejectedFormExport;

/**
 * Recursively orders object keys while preserving array order.
 *
 * Object insertion order can differ based on the sequence of Builder edits.
 * Canonical key ordering makes equivalent forms produce byte-for-byte stable,
 * review-friendly JSON without changing the meaningful order of form fields,
 * select options, or validation rules.
 */
function sortJsonKeys(value: JSONValue): JSONValue {
  if (Array.isArray(value)) {
    return value.map(sortJsonKeys);
  }
  if (value !== null && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value)
        // Compare Unicode code points directly instead of using localeCompare.
        // Export bytes must stay identical even when the Builder UI locale or
        // the browser's default collation locale changes.
        .sort(([left], [right]) => (left < right ? -1 : left > right ? 1 : 0))
        .map(([key, child]) => [key, sortJsonKeys(child)]),
    );
  }
  return value;
}

export function serializeFormDocument(document: JBFormDocumentV1): string {
  return `${JSON.stringify(sortJsonKeys(document as unknown as JSONValue), null, 2)}\n`;
}

export function getFormExportFileName(document: JBFormDocumentV1): string {
  return `${document.slug || "untitled-form"}.jb-form.json`;
}

/**
 * Validates a detached document snapshot before producing portable output.
 *
 * The function only accepts the public form-document type. Builder selection,
 * dirty flags, persistence status, and every other editor-only value are
 * structurally outside this export boundary.
 */
export function prepareFormExport(document: JBFormDocumentV1): FormExportResult {
  const snapshot = structuredClone(document);
  const validation = validateFormDocument(snapshot);
  if (!validation.valid || !validation.document) {
    return {
      valid: false,
      issues: validation.issues,
    };
  }

  return {
    valid: true,
    document: validation.document,
    json: serializeFormDocument(validation.document),
    fileName: getFormExportFileName(validation.document),
  };
}

/**
 * Starts a browser download without retaining the temporary object URL.
 *
 * DOM globals are referenced only inside the event-driven function so merely
 * importing this module remains safe in a future server-rendering build.
 */
export function downloadFormExport(exportValue: PreparedFormExport): void {
  const blob = new Blob([exportValue.json], {
    type: "application/json;charset=utf-8",
  });
  const objectUrl = URL.createObjectURL(blob);
  const link = window.document.createElement("a");
  link.href = objectUrl;
  link.download = exportValue.fileName;
  link.hidden = true;
  window.document.body.append(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(objectUrl);
}
