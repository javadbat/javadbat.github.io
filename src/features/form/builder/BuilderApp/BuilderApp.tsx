import { useTranslation } from "react-i18next";
import { lazy, Suspense, useEffect } from "react";
import { observer } from "mobx-react-lite";
import { getCurrentFormSlug } from "../../application/form-page-url";
import { FormI18nProvider } from "../../i18n/FormI18nProvider";
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
  const { t: tCommon, i18n } = useTranslation("common");
  const direction = i18n.dir();
  const slug = getCurrentFormSlug();
  const actions = useBuilderAppActions();

  useBuilderLifecycle(slug);
  useHistoryShortcuts();

  useEffect(() => {
    const locale = i18n.resolvedLanguage ?? i18n.language;
    document.title = locale.toLowerCase().split("-")[0] === "fa" ? "فرم‌ساز JB" : "JB Form Builder";
    store.synchronizeEmptyDocumentLocale(locale);
  }, [i18n.language, i18n.resolvedLanguage, store]);

  if (store.status === "loading" || store.status === "load-error") {
    return <BuilderStatusScreen slug={slug} />;
  }

  return (
    <div className={styles.app} dir={direction}>
      <BuilderHeader
        onOpenSettings={actions.openSettings}
        onImport={actions.openImport}
        onUndo={store.undo}
        onRedo={store.redo}
        onExport={actions.openExport}
      />
      <BuilderWorkspace onOpenFormNameSettings={actions.openSettingsForFormName} />

      {actions.settingsOpen ? (
        <Suspense fallback={<ModalLoadingFallback label={tCommon("loadingModal")} />}>
          <FormSettingsModal isOpen focusFormName={actions.focusFormName} onClose={actions.closeSettings} />
        </Suspense>
      ) : null}
      {actions.importOpen ? (
        <Suspense fallback={<ModalLoadingFallback label={tCommon("loadingModal")} />}>
          <ImportJsonModal isOpen onClose={actions.closeImport} />
        </Suspense>
      ) : null}
      {actions.exportDocument ? (
        <Suspense fallback={<ModalLoadingFallback label={tCommon("loadingModal")} />}>
          <ExportJsonModal document={actions.exportDocument} isOpen={actions.exportOpen} onClose={actions.closeExport} />
        </Suspense>
      ) : null}
    </div>
  );
});

export function BuilderApp() {
  return (
    <FormI18nProvider>
      <BuilderAppStoreRoot />
    </FormI18nProvider>
  );
}

function BuilderAppStoreRoot() {
  const { i18n } = useTranslation();
  return (
    <BuilderStoreProvider initialLocale={i18n.resolvedLanguage ?? i18n.language}>
      <BuilderAppContent />
    </BuilderStoreProvider>
  );
}
