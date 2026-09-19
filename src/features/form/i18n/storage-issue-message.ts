import type { StorageIssue } from "../storage/storage-types";
import type { TFunction } from "i18next";

/** Maps persistence failures to actionable copy from the caller's common dictionary. */
export function getStorageIssueMessage(t: TFunction<"common">, issue: StorageIssue | null): string {
  if (!issue) return t("storageError");
  switch (issue.code) {
    case "storage-blocked": return t("storageBlocked");
    case "storage-unavailable": return t("storageUnavailable");
    case "quota-exceeded": return t("quotaExceeded");
    case "slug-collision": return t("slugCollision");
    case "revision-conflict": return t("revisionConflict");
    case "validation-failed": return t("invalidForm");
    case "corrupt-record":
    case "incompatible-record": return t("corruptForm");
    default: return t("storageError");
  }
}
