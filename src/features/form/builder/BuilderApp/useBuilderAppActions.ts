import { useCallback, useEffect, useState } from "react";
import type { JBFormDocumentV1 } from "../../domain/form-document";
import { formPageHref } from "../../application/form-page-url";
import type { BuilderNavigationTarget } from "../BuilderHeader/BuilderHeader";
import { useBuilderStore } from "../store/BuilderStoreContext";

const EXPORT_MODAL_EXIT_DURATION_MS = 300;

export function useBuilderAppActions() {
  const store = useBuilderStore();
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [focusFormName, setFocusFormName] = useState(false);
  const [importOpen, setImportOpen] = useState(false);
  const [exportDocument, setExportDocument] = useState<JBFormDocumentV1 | null>(null);
  const [exportOpen, setExportOpen] = useState(false);

  const openSettings = useCallback(() => {
    setFocusFormName(false);
    setSettingsOpen(true);
  }, []);
  const openSettingsForFormName = useCallback(() => {
    setFocusFormName(true);
    setSettingsOpen(true);
  }, []);
  const closeSettings = useCallback(() => {
    setSettingsOpen(false);
    setFocusFormName(false);
  }, []);
  const navigate = useCallback(
    (target: BuilderNavigationTarget) => {
      if (store.isDirty || !store.hasSavedDraft) {
        openSettings();
        return;
      }
      window.location.assign(formPageHref(target, store.linkedRecord?.slug));
    },
    [openSettings, store],
  );
  const openExport = useCallback(() => {
    setExportDocument(store.createDocumentSnapshot());
    setExportOpen(true);
  }, [store]);
  const closeExport = useCallback(() => setExportOpen(false), []);
  const openImport = useCallback(() => setImportOpen(true), []);
  const closeImport = useCallback(() => setImportOpen(false), []);

  useEffect(() => {
    if (exportOpen || exportDocument === null) return;
    const cleanupTimer = window.setTimeout(
      () => setExportDocument(null),
      EXPORT_MODAL_EXIT_DURATION_MS,
    );
    return () => window.clearTimeout(cleanupTimer);
  }, [exportDocument, exportOpen]);

  return {
    settingsOpen,
    focusFormName,
    importOpen,
    exportDocument,
    exportOpen,
    navigate,
    openSettings,
    openSettingsForFormName,
    closeSettings,
    openExport,
    closeExport,
    openImport,
    closeImport,
  };
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
