import { useTranslation } from "react-i18next";
import { JBButton } from "jb-button/react";
import { JBModal } from "jb-modal/react";
import { ModalCloseButton } from "../../../components/react/components/modal/ModalCloseButton";
import type { FormValues } from "jb-form-builder/types";
import modalStyles from "../shell/FormModal.module.css";
import styles from "../shell/RouteShell.module.css";

interface FormResultModalProps {
  values: FormValues;
  onClose: () => void;
}

function downloadFormResult(values: FormValues): void {
  const blob = new Blob([`${JSON.stringify(values, null, 2)}\n`], {
    type: "application/json;charset=utf-8",
  });
  const objectUrl = URL.createObjectURL(blob);
  const link = window.document.createElement("a");
  link.href = objectUrl;
  link.download = "form-result.json";
  link.hidden = true;
  window.document.body.append(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(objectUrl);
}

export function FormResultModal({ values, onClose }: FormResultModalProps) {
  const { t: tCommon } = useTranslation("common");
  const { t } = useTranslation("formResultModal");
  return (
    <JBModal
      className={modalStyles.formModal}
      isOpen
      label={t("formResult")}
      description={t("formResultDescription")}
      autoCloseOnEscape
      autoCloseOnBackgroundClick
      onClose={onClose}
    >
      <div slot="header" className={styles.resultModalHeader}>
        <div>
          <p className={styles.eyebrow}>{t("submissionSuccessful")}</p>
          <h2>{t("formResult")}</h2>
        </div>
        <ModalCloseButton label={tCommon("close")} onClick={onClose} />
      </div>
      <div slot="content" className={styles.resultModalContent}>
        <p>{t("formResultDescription")}</p>
        <pre aria-label={t("formResultJson")} tabIndex={0}>
          <code>{JSON.stringify(values, null, 2)}</code>
        </pre>
      </div>
      <div slot="footer" className={styles.resultModalActions}>
        <JBButton variant="ghost" onClick={onClose}>
          {tCommon("close")}
        </JBButton>
        <JBButton color="primary" onClick={() => downloadFormResult(values)}>
          {tCommon("downloadJson")}
        </JBButton>
      </div>
    </JBModal>
  );
}
