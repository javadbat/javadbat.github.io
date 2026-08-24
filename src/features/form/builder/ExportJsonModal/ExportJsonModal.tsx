import { JBButton } from "jb-button/react";
import { ModalCloseButton } from "../../../../components/react/components/modal/ModalCloseButton";
import { CodeViewer } from "../../../../components/react/components/code-viewer/CodeViewer";
import type { JBFormDocumentV1 } from "../../domain/form-document";
import { downloadFormExport, prepareFormExport } from "../../export/form-export";
import type { FormMessages } from "../../i18n/locale-adapter";
import modalStyles from "../../shell/FormModal.module.css";
import styles from "./ExportJsonModal.module.css";
import { JBModal } from "jb-modal/react";

interface ExportJsonModalProps {
  document: JBFormDocumentV1;
  isOpen: boolean;
  messages: FormMessages;
  onClose: () => void;
}

/**
 * The export surface lives in its own lazy-loaded component because Mantine
 * and Shiki are useful here but should not increase the Builder's initial
 * editing bundle or initialization work.
 */
export function ExportJsonModal({ document, isOpen, messages, onClose }: ExportJsonModalProps) {
  const exportResult = prepareFormExport(document);

  return (
    <JBModal className={modalStyles.formModal} isOpen={isOpen} label={messages.exportJson} autoCloseOnEscape autoCloseOnBackgroundClick onClose={onClose}>
      <div slot="header">
        <div className={styles.modalHeading}>
          <p className={styles.eyebrow}>{messages.portableFormDocument}</p>
          <h2>{messages.exportJson}</h2>
        </div>
        <div className={styles.exportModalHeaderActions}>
          {exportResult.valid ? <code className={styles.exportFileName}>{exportResult.fileName}</code> : null}
          <ModalCloseButton label={messages.close} onClick={onClose} />
        </div>
      </div>

      <div slot="content" className={styles.exportModalContent}>
        {exportResult.valid ? (
          <>
            <p className={styles.modalDescription}>{messages.exportDescription}</p>
            <div className={styles.exportCodeViewer}>
              <CodeViewer code={exportResult.json} language="json" ariaLabel={messages.exportCodeLabel} copyLabel={messages.copyCode} copiedLabel={messages.copiedCode} />
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
          </>
        )}
      </div>

      <div slot="footer" className={styles.modalActions}>
        {exportResult.valid ? (
          <>
            <JBButton variant="ghost" onClick={onClose}>
              {messages.close}
            </JBButton>
            <JBButton color="primary" onClick={() => downloadFormExport(exportResult)}>
              {messages.downloadJson}
            </JBButton>
          </>
        ) : (
          <JBButton color="primary" onClick={onClose}>
            {messages.close}
          </JBButton>
        )}
      </div>
    </JBModal>
  );
}
