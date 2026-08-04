import type { FormIssue } from "../domain/form-issue";
import type { JBFormDocumentV1 } from "../domain/form-document";
import { validateFormDocument } from "../domain/form-document-validation";

export interface PreparedFormImport {
  valid: true;
  document: JBFormDocumentV1;
  sourceVersion: number;
  migrated: boolean;
}

export interface RejectedFormImport {
  valid: false;
  issues: FormIssue[];
}

export type FormImportResult = PreparedFormImport | RejectedFormImport;

function importIssue(code: string, message: string, path = "/"): FormIssue {
  return {
    source: "schema",
    code,
    path,
    messageKey: `form.import.${code}`,
    message,
  };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

/**
 * Runs the sequential document migration boundary before validation. Version
 * 1 is already the current application contract, so its migration is an
 * explicit identity clone. Future versions must add a pure step here rather
 * than being silently coerced into an older shape.
 */
function migrateImportedDocument(value: unknown): { value?: unknown; sourceVersion?: number; migrated: boolean; issues: FormIssue[] } {
  if (!isRecord(value) || typeof value.schemaVersion !== "number" || !Number.isInteger(value.schemaVersion)) {
    return {
      migrated: false,
      issues: [importIssue("missing_schema_version", "The imported document must declare an integer schemaVersion.")],
    };
  }

  if (value.schemaVersion !== 1) {
    return {
      sourceVersion: value.schemaVersion,
      migrated: false,
      issues: [importIssue("unsupported_schema_version", `Schema version ${value.schemaVersion} is not supported by this Builder.` , "/schemaVersion")],
    };
  }

  return {
    value: structuredClone(value),
    sourceVersion: 1,
    migrated: false,
    issues: [],
  };
}

export function prepareFormImport(text: string): FormImportResult {
  let parsed: unknown;
  try {
    parsed = JSON.parse(text) as unknown;
  } catch (cause) {
    return {
      valid: false,
      issues: [importIssue("invalid_json", cause instanceof Error ? `The imported file is not valid JSON: ${cause.message}` : "The imported file is not valid JSON.")],
    };
  }

  const migrated = migrateImportedDocument(parsed);
  if (!migrated.value || migrated.issues.length > 0 || migrated.sourceVersion === undefined) {
    return { valid: false, issues: migrated.issues };
  }

  const validation = validateFormDocument(migrated.value);
  if (!validation.valid || !validation.document) {
    return {
      valid: false,
      issues: validation.issues,
    };
  }

  return {
    valid: true,
    document: validation.document,
    sourceVersion: migrated.sourceVersion,
    migrated: migrated.migrated,
  };
}

export async function prepareFormImportFile(file: File): Promise<FormImportResult> {
  try {
    return prepareFormImport(await file.text());
  } catch (cause) {
    return {
      valid: false,
      issues: [importIssue("file_read_failed", cause instanceof Error ? `The imported file could not be read: ${cause.message}` : "The imported file could not be read.")],
    };
  }
}
