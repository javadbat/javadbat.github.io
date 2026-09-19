import { useTranslation } from "react-i18next";
import { JBButton } from "jb-button/react";
import { ModalCloseButton } from "../../../../components/react/components/modal/ModalCloseButton";
import { CodeViewer } from "../../../../components/react/components/code-viewer/CodeViewer";
import type { JBFormDocumentV1 } from "../../domain/form-document";
import { downloadFormExport, prepareFormExport } from "./form-export";
import modalStyles from "../../shell/FormModal.module.css";
import styles from "./ExportJsonModal.module.css";
import { JBModal } from "jb-modal/react";

interface ExportJsonModalProps {
  document: JBFormDocumentV1;
  isOpen: boolean;

  onClose: () => void;
}

/**
 * The export surface lives in its own lazy-loaded component because Mantine
 * and Shiki are useful here but should not increase the Builder's initial
 * editing bundle or initialization work.
 */
export function ExportJsonModal({ document, isOpen, onClose }: ExportJsonModalProps) {
  const { t: tCommon } = useTranslation("common");
  const { t } = useTranslation("exportJsonModal");
  const exportResult = prepareFormExport(document);

  return (
    <JBModal className={modalStyles.formModal} isOpen={isOpen} label={tCommon("exportJson")} autoCloseOnEscape autoCloseOnBackgroundClick onClose={onClose}>
      <div slot="header">
        <div className={styles.modalHeading}>
          <p className={styles.eyebrow}>{tCommon("portableFormDocument")}</p>
          <h2>{tCommon("exportJson")}</h2>
        </div>
        <div className={styles.exportModalHeaderActions}>
          {exportResult.valid ? <code className={styles.exportFileName}>{exportResult.fileName}</code> : null}
          <ModalCloseButton label={tCommon("close")} onClick={onClose} />
        </div>
      </div>

      <div slot="content" className={styles.exportModalContent}>
        {exportResult.valid ? (
          <>
            <p className={styles.modalDescription}>{t("exportDescription")}</p>
            <div className={styles.exportCodeViewer}>
              <CodeViewer code={exportResult.json} language="json" ariaLabel={t("exportCodeLabel")} copyLabel={t("copyCode")} copiedLabel={t("copiedCode")} />
            </div>
          </>
        ) : (
          <>
            <p className={styles.exportError} role="alert">
              {t("exportInvalidDescription")}
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
              {tCommon("close")}
            </JBButton>
            <JBButton color="primary" onClick={() => downloadFormExport(exportResult)}>
              {tCommon("downloadJson")}
            </JBButton>
          </>
        ) : (
          <JBButton color="primary" onClick={onClose}>
            {tCommon("close")}
          </JBButton>
        )}
      </div>
    </JBModal>
  );
}
