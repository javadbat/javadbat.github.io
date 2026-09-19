import { useTranslation } from "react-i18next";
import { JBButton } from "jb-button/react";
import { observer } from "mobx-react-lite";
import { useDesignerUiStore } from "../state/DesignerUiStore";
import styles from "./ExportThemeDialog.module.css";

export interface ExportThemeDialogProps {
  themeName: string;
  json: string;
  onClipboardUnavailable: () => void;
}

export const ExportThemeDialog = observer(function ExportThemeDialog({ themeName, json, onClipboardUnavailable }: ExportThemeDialogProps) {
  const { t } = useTranslation("exportThemeDialog");
  const { t: tDesignerCommon } = useTranslation("designerCommon");
  const ui = useDesignerUiStore();
  if (!ui.exportOpen) return null;

  return (
    <div className={styles.modalBackdrop} role="presentation" onMouseDown={event => {
      if (event.target === event.currentTarget) ui.closeExport();
    }}>
      <section className={styles.exportModal} role="dialog" aria-modal="true" aria-labelledby="export-title">
        <h2 id="export-title">{tDesignerCommon("designerExportTheme")}: {themeName}</h2>
        <p>{t("designerExportDescription")}</p>
        <pre>{json}</pre>
        <div>
          <JBButton variant="ghost" onClick={ui.closeExport}>{t("designerClose")}</JBButton>
          <JBButton color="primary" onClick={async () => {
            try {
              await navigator.clipboard.writeText(json);
              ui.markExportCopied();
            } catch {
              onClipboardUnavailable();
            }
          }}>
            {ui.exportCopied ? t("designerCopied") : t("designerCopyJson")}
          </JBButton>
        </div>
      </section>
    </div>
  );
});
