import { useEffect, useState } from "react";
import { themeRepository } from "../storage/theme-repository";
import type { StorageIssue, StoredThemeRecordV1 } from "../storage/storage-types";

export type StoredThemeResolution =
  | { status: "loading" }
  | { status: "empty" }
  | { status: "not-found" }
  | { status: "error"; issue: StorageIssue }
  | { status: "ready"; record: StoredThemeRecordV1; source: "query" | "binding" | "default" };

/** Resolves query, form binding, and local default precedence for Designer/Preview routes. */
export function useStoredTheme(themeSlug?: string, formSlug?: string): StoredThemeResolution {
  const [resolution, setResolution] = useState<StoredThemeResolution>({ status: "loading" });

  useEffect(() => {
    let active = true;
    setResolution({ status: "loading" });
    void (async () => {
      if (themeSlug) {
        const result = await themeRepository.getBySlug(themeSlug);
        if (!active) return;
        if (!result.ok) return setResolution({ status: "error", issue: result.error });
        return setResolution(result.value ? { status: "ready", record: result.value, source: "query" } : { status: "not-found" });
      }

      const settings = await themeRepository.getSettings();
      if (!active) return;
      if (!settings.ok) return setResolution({ status: "error", issue: settings.error });
      const boundId = formSlug ? settings.value.bindings[formSlug] : undefined;
      const selectedId = boundId ?? settings.value.defaultThemeId;
      if (!selectedId) return setResolution({ status: "empty" });
      const result = await themeRepository.getById(selectedId);
      if (!active) return;
      if (!result.ok) return setResolution({ status: "error", issue: result.error });
      if (!result.value) return setResolution({ status: "not-found" });
      setResolution({ status: "ready", record: result.value, source: boundId ? "binding" : "default" });
    })();
    return () => { active = false; };
  }, [formSlug, themeSlug]);

  return resolution;
}
