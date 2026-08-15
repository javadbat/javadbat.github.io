import { lazy, Suspense, useEffect } from "react";
import { observer } from "mobx-react-lite";
import { getCurrentFormRoute } from "../../application/form-route";
import { useFormLocale } from "../../i18n/locale-adapter";
import { BuilderHeader } from "../BuilderHeader/BuilderHeader";
import { BuilderStatusScreen } from "../BuilderStatusScreen/BuilderStatusScreen";
import { BuilderStoreProvider, useBuilderStore } from "../store/BuilderStoreContext";
import { BuilderWorkspace } from "../BuilderWorkspace/BuilderWorkspace";
import { FormSettingsModal } from "../FormSettingsModal/FormSettingsModal";
import { ImportJsonModal } from "../ImportJsonModal/ImportJsonModal";
import { useBuilderLifecycle } from "../useBuilderLifecycle";
import { useBuilderAppActions, useHistoryShortcuts } from "./useBuilderAppActions";
import styles from "./BuilderApp.module.css";

const ExportJsonModal = lazy(() => import("../ExportJsonModal/ExportJsonModal").then(module => ({ default: module.ExportJsonModal })));

const BuilderAppContent = observer(function BuilderAppContent() {
  const store = useBuilderStore();
  const { direction, setLocale, messages } = useFormLocale("en");
  const route = getCurrentFormRoute();
  const actions = useBuilderAppActions();

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
      <BuilderWorkspace messages={messages} onOpenFormNameSettings={actions.openSettingsForFormName} />

      <FormSettingsModal isOpen={actions.settingsOpen} focusFormName={actions.focusFormName} messages={messages} onClose={actions.closeSettings} />
      <ImportJsonModal isOpen={actions.importOpen} messages={messages} onClose={actions.closeImport} />
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
