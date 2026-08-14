import { lazy, Suspense, useEffect } from "react";
import { observer } from "mobx-react-lite";
import { getCurrentFormRoute } from "../../application/form-route";
import { useFormLocale } from "../../i18n/locale-adapter";
import { BuilderHeader } from "../BuilderHeader/BuilderHeader";
import { BuilderStatusScreen } from "../BuilderStatusScreen/BuilderStatusScreen";
import { BuilderStoreProvider, useBuilderStore } from "../BuilderStoreContext";
import { BuilderWorkspace } from "../BuilderWorkspace/BuilderWorkspace";
import { FormSettingsModal } from "../FormSettingsModal/FormSettingsModal";
import { useBuilderLifecycle } from "../useBuilderLifecycle";
import { useBuilderAppActions, useHistoryShortcuts } from "./useBuilderAppActions";
import styles from "./BuilderApp.module.css";

const ExportJsonModal = lazy(() => import("../ExportJsonModal/ExportJsonModal").then(module => ({ default: module.ExportJsonModal })));

const BuilderAppContent = observer(function BuilderAppContent() {
  const store = useBuilderStore();
  const { direction, setLocale, messages } = useFormLocale("en");
  const route = getCurrentFormRoute();
  const actions = useBuilderAppActions(messages);

  useBuilderLifecycle(route.slug);
  useHistoryShortcuts();

  useEffect(() => {
    // The selected form-content locale is also the builder UI locale. The UI
    // currently has English and Persian dictionaries; other form locales use
    // the English interface while their content remains editable as selected.
    setLocale(store.editingLocale.toLowerCase().split("-")[0] === "fa" ? "fa" : "en");
  }, [setLocale, store.editingLocale]);

  if (store.status === "loading" || store.status === "load-error") {
    return <BuilderStatusScreen messages={messages} slug={route.slug} />;
  }

  return (
    <div className={styles.app} dir={direction}>
      <BuilderHeader
        messages={messages}
        onOpenSettings={actions.openSettings}
        onNavigate={actions.navigate}
        onImport={actions.openImport}
        onUndo={store.undo}
        onRedo={store.redo}
        onExport={actions.openExport}
      />
      <input
        ref={actions.importInputRef}
        className={styles.srOnly}
        type="file"
        accept="application/json,.json"
        aria-label={messages.importJson}
        onChange={event => void actions.handleImport(event)}
      />
      {actions.importIssues.length > 0 ? (
        <div className={styles.importError} role="alert">
          <strong>{messages.importFailure}</strong>
          <ul>
            {actions.importIssues.map(issue => (
              <li key={issue}>{issue}</li>
            ))}
          </ul>
        </div>
      ) : null}
      <BuilderWorkspace messages={messages} />

      <FormSettingsModal isOpen={actions.settingsOpen} messages={messages} onClose={() => actions.setSettingsOpen(false)} />
      {actions.exportDocument ? (
        <Suspense fallback={null}>
          <ExportJsonModal document={actions.exportDocument} messages={messages} onClose={actions.closeExport} />
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
