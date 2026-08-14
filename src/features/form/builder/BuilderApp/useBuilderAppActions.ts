import { useCallback, useEffect, useRef, useState, type ChangeEvent } from "react";
import type { JBFormDocumentV1 } from "../../domain/form-document";
import { prepareFormImportFile } from "../../import/form-import";
import type { FormMessages } from "../../i18n/locale-adapter";
import { formRouteHref } from "../../application/form-route";
import type { BuilderNavigationTarget } from "../BuilderHeader/BuilderHeader";
import { useBuilderStore } from "../BuilderStoreContext";

export function useBuilderAppActions(messages: FormMessages) {
  const store = useBuilderStore();
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [exportDocument, setExportDocument] = useState<JBFormDocumentV1 | null>(null);
  const [importIssues, setImportIssues] = useState<string[]>([]);
  const importInputRef = useRef<HTMLInputElement>(null);

  const openSettings = useCallback(() => setSettingsOpen(true), []);
  const navigate = useCallback(
    (target: BuilderNavigationTarget) => {
      if (store.isDirty || !store.hasSavedDraft) {
        openSettings();
        return;
      }
      window.location.assign(formRouteHref(target, store.linkedRecord?.slug));
    },
    [openSettings, store],
  );
  const openExport = useCallback(() => setExportDocument(store.createDocumentSnapshot()), [store]);
  const closeExport = useCallback(() => setExportDocument(null), []);
  const openImport = useCallback(() => {
    setImportIssues([]);
    importInputRef.current?.click();
  }, []);
  const handleImport = useCallback(
    async (event: ChangeEvent<HTMLInputElement>) => {
      const file = event.currentTarget.files?.[0];
      event.currentTarget.value = "";
      if (!file) return;
      const result = await prepareFormImportFile(file);
      if (!result.valid) {
        setImportIssues(result.issues.map(issue => `${issue.path}: ${issue.message}`));
      } else if (store.importDocument(result.document)) {
        setImportIssues([]);
        store.announce(messages.importSuccess);
      }
    },
    [messages.importSuccess, store],
  );

  return { settingsOpen, setSettingsOpen, exportDocument, importIssues, importInputRef, navigate, openSettings, openExport, closeExport, openImport, handleImport };
}

export function useHistoryShortcuts(): void {
  const store = useBuilderStore();
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (!(event.ctrlKey || event.metaKey) || event.altKey) return;
      const target = event.target;
      if (target instanceof HTMLElement && (target.isContentEditable || ["INPUT", "TEXTAREA", "SELECT"].includes(target.tagName))) return;
      const key = event.key.toLowerCase();
      if (key === "z" && event.shiftKey) {
        event.preventDefault();
        store.redo();
      } else if (key === "z") {
        event.preventDefault();
        store.undo();
      } else if (key === "y") {
        event.preventDefault();
        store.redo();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [store]);
}
