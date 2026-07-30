import { lazy, Suspense, useCallback, useState } from "react";
import { observer } from "mobx-react-lite";
import { formRouteHref, getCurrentFormRoute } from "../application/form-route";
import type { JBFormDocumentV1 } from "../domain/form-document";
import { useFormLocale } from "../i18n/locale-adapter";
import { BuilderDesktopNotice } from "./BuilderDesktopNotice";
import { BuilderHeader, type BuilderNavigationTarget } from "./BuilderHeader";
import { BuilderStatusScreen } from "./BuilderStatusScreen";
import { BuilderStoreProvider, useBuilderStore } from "./BuilderStoreContext";
import { BuilderWorkspace } from "./BuilderWorkspace";
import { FormSettingsModal } from "./FormSettingsModal";
import { useBuilderLifecycle } from "./useBuilderLifecycle";
import styles from "./BuilderApp.module.css";

const ExportJsonModal = lazy(() => import("./ExportJsonModal").then(module => ({ default: module.ExportJsonModal })));

const BuilderAppContent = observer(function BuilderAppContent() {
  const store = useBuilderStore();
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [exportDocument, setExportDocument] = useState<JBFormDocumentV1 | null>(null);
  const { locale, direction, setLocale, messages } = useFormLocale("en");
  const route = getCurrentFormRoute();

  useBuilderLifecycle(route.slug);

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
  const openPreview = useCallback(() => navigate("preview"), [navigate]);
  const openExport = useCallback(() => {
    setExportDocument(store.createDocumentSnapshot());
  }, [store]);
  const closeExport = useCallback(() => setExportDocument(null), []);

  if (store.status === "loading" || store.status === "load-error") {
    return <BuilderStatusScreen messages={messages} slug={route.slug} />;
  }

  return (
    <div className={styles.app} dir={direction}>
      <BuilderHeader locale={locale} messages={messages} setLocale={setLocale} onOpenSettings={openSettings} onNavigate={navigate} onExport={openExport} />
      <BuilderDesktopNotice messages={messages} onPreview={openPreview} />
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
