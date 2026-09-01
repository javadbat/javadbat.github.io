import { JBButton } from "jb-button/react";
import { observer } from "mobx-react-lite";
import type { FormMessages } from "../../i18n/locale-adapter";
import { useDesignerUiStore } from "../state/DesignerUiStore";
import styles from "./ExportThemeDialog.module.css";

export interface ExportThemeDialogProps {
  themeName: string;
  json: string;
  messages: FormMessages;
  onClipboardUnavailable: () => void;
}

export const ExportThemeDialog = observer(function ExportThemeDialog({ themeName, json, messages, onClipboardUnavailable }: ExportThemeDialogProps) {
  const ui = useDesignerUiStore();
  if (!ui.exportOpen) return null;

  return (
    <div className={styles.modalBackdrop} role="presentation" onMouseDown={event => {
      if (event.target === event.currentTarget) ui.closeExport();
    }}>
      <section className={styles.exportModal} role="dialog" aria-modal="true" aria-labelledby="export-title">
        <h2 id="export-title">{messages.designerExportTheme}: {themeName}</h2>
        <p>{messages.designerExportDescription}</p>
        <pre>{json}</pre>
        <div>
          <JBButton variant="ghost" onClick={ui.closeExport}>{messages.designerClose}</JBButton>
          <JBButton color="primary" onClick={async () => {
            try {
              await navigator.clipboard.writeText(json);
              ui.markExportCopied();
            } catch {
              onClipboardUnavailable();
            }
          }}>
            {ui.exportCopied ? messages.designerCopied : messages.designerCopyJson}
          </JBButton>
        </div>
      </section>
    </div>
  );
});
