import { lazy, Suspense, useEffect } from "react";
import { observer } from "mobx-react-lite";
import { getCurrentFormSlug } from "../../application/form-page-url";
import { useFormLocale } from "../../i18n/locale-adapter";
import { BuilderHeader } from "../BuilderHeader/BuilderHeader";
import { BuilderStatusScreen } from "../BuilderStatusScreen/BuilderStatusScreen";
import { BuilderStoreProvider, useBuilderStore } from "../store/BuilderStoreContext";
import { BuilderWorkspace } from "../BuilderWorkspace/BuilderWorkspace";
import { ModalLoadingFallback } from "../../shell/ModalLoadingFallback";
import { useBuilderLifecycle } from "./useBuilderLifecycle";
import { useBuilderAppActions, useHistoryShortcuts } from "./useBuilderAppActions";
import styles from "./BuilderApp.module.css";

const FormSettingsModal = lazy(() => import("../FormSettingsModal/FormSettingsModal").then(module => ({ default: module.FormSettingsModal })));
const ImportJsonModal = lazy(() => import("../ImportJsonModal/ImportJsonModal").then(module => ({ default: module.ImportJsonModal })));
const ExportJsonModal = lazy(() => import("../ExportJsonModal/ExportJsonModal").then(module => ({ default: module.ExportJsonModal })));

const BuilderAppContent = observer(function BuilderAppContent() {
  const store = useBuilderStore();
  const { locale, direction, setLocale, messages } = useFormLocale("en");
  const slug = getCurrentFormSlug();
  const actions = useBuilderAppActions();
  const editingAppLocale = store.editingLocale.toLowerCase().split("-")[0] === "fa" ? "fa" : "en";

  useBuilderLifecycle(slug);
  useHistoryShortcuts();

  useEffect(() => {
    if (store.status === "loading" || locale === editingAppLocale) return;
    setLocale(editingAppLocale);
  }, [editingAppLocale, locale, setLocale, store.status]);

  if (store.status === "loading" || store.status === "load-error") {
    return <BuilderStatusScreen messages={messages} slug={slug} />;
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

      {actions.settingsOpen ? (
        <Suspense fallback={<ModalLoadingFallback label={messages.loadingModal} />}>
          <FormSettingsModal isOpen focusFormName={actions.focusFormName} messages={messages} onClose={actions.closeSettings} />
        </Suspense>
      ) : null}
      {actions.importOpen ? (
        <Suspense fallback={<ModalLoadingFallback label={messages.loadingModal} />}>
          <ImportJsonModal isOpen messages={messages} onClose={actions.closeImport} />
        </Suspense>
      ) : null}
      {actions.exportDocument ? (
        <Suspense fallback={<ModalLoadingFallback label={messages.loadingModal} />}>
          <ExportJsonModal document={actions.exportDocument} isOpen={actions.exportOpen} messages={messages} onClose={actions.closeExport} />
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
