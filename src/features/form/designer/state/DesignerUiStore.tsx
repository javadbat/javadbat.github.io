import { createContext, useContext, type PropsWithChildren } from "react";
import { makeAutoObservable } from "mobx";

export type PreviewViewport = "desktop" | "tablet" | "mobile";
export type DesignerMobilePanel = "design" | "preview";
export type DesignerPreviewSource = "sample" | "stored";

/** Shared, view-only state used by sibling Designer shell components. */
export class DesignerUiStore {
  viewport: PreviewViewport = "desktop";
  mobilePanel: DesignerMobilePanel = "design";
  previewSource: DesignerPreviewSource = "sample";
  mobileActionsOpen = false;
  exportOpen = false;
  exportCopied = false;

  constructor() {
    makeAutoObservable(this, {}, { autoBind: true });
  }

  setViewport(viewport: PreviewViewport): void {
    this.viewport = viewport;
  }

  setMobilePanel(panel: DesignerMobilePanel): void {
    this.mobilePanel = panel;
  }

  setPreviewSource(source: DesignerPreviewSource): void {
    this.previewSource = source;
  }

  setMobileActionsOpen(open: boolean): void {
    this.mobileActionsOpen = open;
  }

  openExport(): void {
    this.exportCopied = false;
    this.exportOpen = true;
  }

  closeExport(): void {
    this.exportOpen = false;
  }

  markExportCopied(): void {
    this.exportCopied = true;
  }
}

const DesignerUiStoreContext = createContext<DesignerUiStore | null>(null);

export function DesignerUiStoreProvider({ store, children }: PropsWithChildren<{ store: DesignerUiStore }>) {
  return <DesignerUiStoreContext.Provider value={store}>{children}</DesignerUiStoreContext.Provider>;
}

export function useDesignerUiStore(): DesignerUiStore {
  const store = useContext(DesignerUiStoreContext);
  if (!store) throw new Error("useDesignerUiStore must be used inside DesignerUiStoreProvider");
  return store;
}
