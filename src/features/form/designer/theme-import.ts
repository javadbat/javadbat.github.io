import { canonicalizeThemeConfig, getThemeDataImageBytes, validateThemeConfig, type ThemeConfigIssue, type ThemeConfigV1 } from "jb-form-builder/contract/theme";
import { normalizeFormSlug } from "../application/form-slug";
import type { StoredThemeRecordV1 } from "../storage/storage-types";

export type ThemeImportResult =
  | { valid: false; issues: ThemeConfigIssue[] }
  | {
      valid: true;
      config: ThemeConfigV1;
      generatedSlug: string;
      conflicts: { name: boolean; slug: boolean };
      warnings: string[];
      omittedIssues: ThemeConfigIssue[];
    };

export interface ThemeImportOptions {
  supportedValuesOnly?: boolean;
}

const requiredImportPaths = new Set(["/", "/schemaVersion", "/name"]);

function removalPathForIssue(issue: ThemeConfigIssue): string | null {
  if (requiredImportPaths.has(issue.path)) return null;
  if (["/background/type", "/background/color", "/background/patternId", "/background/source"].includes(issue.path)) return "/background";
  if (/^\/components\/[^/]+\/tokens$/.test(issue.path)) return issue.path.replace(/\/tokens$/, "");
  return issue.path;
}

function removeJsonPointer(value: unknown, pointer: string): boolean {
  if (!value || typeof value !== "object" || pointer === "/") return false;
  const segments = pointer.slice(1).split("/").map(segment => segment.replace(/~1/g, "/").replace(/~0/g, "~"));
  let parent = value as Record<string, unknown>;
  for (const segment of segments.slice(0, -1)) {
    const next = parent[segment];
    if (!next || typeof next !== "object" || Array.isArray(next)) return false;
    parent = next as Record<string, unknown>;
  }
  return delete parent[segments.at(-1)!];
}

function retainSupportedValues(value: unknown): { value: unknown; omittedIssues: ThemeConfigIssue[] } | null {
  const candidate = structuredClone(value);
  const omittedIssues: ThemeConfigIssue[] = [];

  for (let pass = 0; pass < 4; pass += 1) {
    const validation = validateThemeConfig(candidate);
    if (validation.valid) return { value: candidate, omittedIssues };
    if (validation.issues.some(issue => requiredImportPaths.has(issue.path))) return null;

    let changed = false;
    for (const issue of validation.issues) {
      const removalPath = removalPathForIssue(issue);
      if (removalPath && removeJsonPointer(candidate, removalPath)) changed = true;
      if (!omittedIssues.some(item => item.path === issue.path && item.message === issue.message)) omittedIssues.push(issue);
    }
    if (!changed) return null;
  }
  return null;
}

/** Parses and strictly validates an import without mutating editor or storage state. */
export function prepareThemeImport(json: string, existing: readonly StoredThemeRecordV1[], options: ThemeImportOptions = {}): ThemeImportResult {
  let value: unknown;
  try {
    value = JSON.parse(json);
  } catch (cause) {
    return {
      valid: false,
      issues: [{ path: "/", message: cause instanceof Error ? cause.message : "Theme JSON could not be parsed." }],
    };
  }

  let omittedIssues: ThemeConfigIssue[] = [];
  if (options.supportedValuesOnly) {
    const retained = retainSupportedValues(value);
    if (retained) {
      value = retained.value;
      omittedIssues = retained.omittedIssues;
    }
  }

  const validation = validateThemeConfig(value);
  if (!validation.valid || !validation.config) return { valid: false, issues: validation.issues };
  const config = canonicalizeThemeConfig(validation.config);
  const generatedSlug = normalizeFormSlug(config.name) || "theme";
  const normalizedName = config.name.toLowerCase();
  const imageBytes = config.background?.type === "image" ? getThemeDataImageBytes(config.background.source) : null;
  return {
    valid: true,
    config,
    generatedSlug,
    conflicts: {
      name: existing.some(record => record.config.name.toLowerCase() === normalizedName),
      slug: existing.some(record => record.slug === generatedSlug),
    },
    warnings: imageBytes !== null && imageBytes > 400 * 1024
      ? ["The embedded background image is above 400 KB and will make this theme expensive to store and share."]
      : [],
    omittedIssues,
  };
}
