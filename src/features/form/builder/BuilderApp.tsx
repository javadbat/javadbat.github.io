import { lazy, Suspense, useCallback, useEffect, useRef, useState, type ChangeEvent } from "react";
import { observer } from "mobx-react-lite";
import { formRouteHref, getCurrentFormRoute } from "../application/form-route";
import type { JBFormDocumentV1 } from "../domain/form-document";
import { useFormLocale } from "../i18n/locale-adapter";
import { BuilderHeader, type BuilderNavigationTarget } from "./BuilderHeader";
import { BuilderStatusScreen } from "./BuilderStatusScreen";
import { BuilderStoreProvider, useBuilderStore } from "./BuilderStoreContext";
import { BuilderWorkspace } from "./BuilderWorkspace";
import { FormSettingsModal } from "./FormSettingsModal";
import { useBuilderLifecycle } from "./useBuilderLifecycle";
import { prepareFormImportFile } from "../import/form-import";
import styles from "./BuilderApp.module.css";

const ExportJsonModal = lazy(() => import("./ExportJsonModal").then(module => ({ default: module.ExportJsonModal })));

const BuilderAppContent = observer(function BuilderAppContent() {
  const store = useBuilderStore();
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [exportDocument, setExportDocument] = useState<JBFormDocumentV1 | null>(null);
  const [importIssues, setImportIssues] = useState<string[]>([]);
  const importInputRef = useRef<HTMLInputElement>(null);
  const { direction, setLocale, messages } = useFormLocale("en");
  const route = getCurrentFormRoute();

  useBuilderLifecycle(route.slug);

  useEffect(() => {
    // The selected form-content locale is also the builder UI locale. The UI
    // currently has English and Persian dictionaries; other form locales use
    // the English interface while their content remains editable as selected.
    setLocale(store.editingLocale.toLowerCase().split("-")[0] === "fa" ? "fa" : "en");
  }, [setLocale, store.editingLocale]);

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
  const openExport = useCallback(() => {
    setExportDocument(store.createDocumentSnapshot());
  }, [store]);
  const closeExport = useCallback(() => setExportDocument(null), []);
  const openImport = useCallback(() => {
    setImportIssues([]);
    importInputRef.current?.click();
  }, []);
  const handleImport = useCallback(async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.currentTarget.files?.[0];
    event.currentTarget.value = "";
    if (!file) {
      return;
    }

    const result = await prepareFormImportFile(file);
    if (!result.valid) {
      setImportIssues(result.issues.map(issue => `${issue.path}: ${issue.message}`));
      return;
    }

    if (store.importDocument(result.document)) {
      setImportIssues([]);
      store.announce(messages.importSuccess);
    }
  }, [messages.importSuccess, store]);

  useEffect(() => {
    function handleHistoryShortcut(event: KeyboardEvent): void {
      if (!(event.ctrlKey || event.metaKey) || event.altKey) {
        return;
      }
      const target = event.target;
      if (target instanceof HTMLElement && (target.isContentEditable || ["INPUT", "TEXTAREA", "SELECT"].includes(target.tagName))) {
        return;
      }

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
    }

    window.addEventListener("keydown", handleHistoryShortcut);
    return () => window.removeEventListener("keydown", handleHistoryShortcut);
  }, [store]);

  if (store.status === "loading" || store.status === "load-error") {
    return <BuilderStatusScreen messages={messages} slug={route.slug} />;
  }

  return (
    <div className={styles.app} dir={direction}>
      <BuilderHeader messages={messages} onOpenSettings={openSettings} onNavigate={navigate} onImport={openImport} onUndo={store.undo} onRedo={store.redo} onExport={openExport} />
      <input ref={importInputRef} className={styles.srOnly} type="file" accept="application/json,.json" aria-label={messages.importJson} onChange={event => void handleImport(event)} />
      {importIssues.length > 0 ? (
        <div className={styles.importError} role="alert">
          <strong>{messages.importFailure}</strong>
          <ul>
            {importIssues.map(issue => <li key={issue}>{issue}</li>)}
          </ul>
        </div>
      ) : null}
      <BuilderWorkspace messages={messages} />

      <FormSettingsModal isOpen={settingsOpen} messages={messages} onClose={() => setSettingsOpen(false)} />
      {exportDocument ? (
        <Suspense fallback={null}>
          <ExportJsonModal document={exportDocument} messages={messages} onClose={closeExport} />
        </Suspense>
      ) : null}
    </div>
  );
});

export function BuilderApp() {
  return (
    <BuilderStoreProvider>
      <BuilderAppContent />
    </BuilderStoreProvider>
  );
}
