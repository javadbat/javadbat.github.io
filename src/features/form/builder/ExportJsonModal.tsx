import { JBButton } from "jb-button/react";
import { ClientJBModal } from "../../../components/react/components/modal/ClientJBModal";
import { CodeViewer } from "../../../components/react/components/code-viewer/CodeViewer";
import type { JBFormDocumentV1 } from "../domain/form-document";
import { downloadFormExport, prepareFormExport } from "../export/form-export";
import type { FormMessages } from "../i18n/locale-adapter";
import styles from "./BuilderApp.module.css";

interface ExportJsonModalProps {
  document: JBFormDocumentV1;
  messages: FormMessages;
  onClose: () => void;
}

/**
 * The export surface lives in its own lazy-loaded component because Mantine
 * and Shiki are useful here but should not increase the Builder's initial
 * editing bundle or initialization work.
 */
export function ExportJsonModal({ document, messages, onClose }: ExportJsonModalProps) {
  const exportResult = prepareFormExport(document);

  return (
    <ClientJBModal isOpen label={messages.exportJson} autoCloseOnEscape autoCloseOnBackgroundClick onClose={onClose}>
      <div className={styles.exportModalContent}>
        <div className={styles.exportModalHeading}>
          <div>
            <p className={styles.eyebrow}>{messages.portableFormDocument}</p>
            <h2>{messages.exportJson}</h2>
          </div>
          {exportResult.valid ? <code className={styles.exportFileName}>{exportResult.fileName}</code> : null}
        </div>

        {exportResult.valid ? (
          <>
            <p className={styles.modalDescription}>{messages.exportDescription}</p>
            <div className={styles.exportCodeViewer}>
              <CodeViewer code={exportResult.json} language="json" ariaLabel={messages.exportCodeLabel} copyLabel={messages.copyCode} copiedLabel={messages.copiedCode} />
            </div>
            <div className={styles.modalActions}>
              <JBButton variant="ghost" onClick={onClose}>
                {messages.close}
              </JBButton>
              <JBButton color="primary" onClick={() => downloadFormExport(exportResult)}>
                {messages.downloadJson}
              </JBButton>
            </div>
          </>
        ) : (
          <>
            <p className={styles.exportError} role="alert">
              {messages.exportInvalidDescription}
            </p>
            <ul className={styles.exportIssueList}>
              {exportResult.issues.map(issue => (
                <li key={`${issue.path}:${issue.code}`}>
                  <code>{issue.path}</code>
                  <span>{issue.message}</span>
                </li>
              ))}
            </ul>
            <div className={styles.modalActions}>
              <JBButton color="primary" onClick={onClose}>
                {messages.close}
              </JBButton>
            </div>
          </>
        )}
      </div>
    </ClientJBModal>
  );
}
