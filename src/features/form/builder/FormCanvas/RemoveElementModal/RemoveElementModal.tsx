import { useTranslation } from "react-i18next";
import { JBButton } from "jb-button/react";
import modalStyles from "../../../shell/FormModal.module.css";
import styles from "./RemoveElementModal.module.css";
import { JBModal } from "jb-modal/react";
import { ModalCloseButton } from "@react-components/modal/ModalCloseButton";

interface RemoveElementModalProps {
  isOpen: boolean;
  elementLabel: string;

  onCancel: () => void;
  onConfirm: () => void;
}

export function RemoveElementModal({ isOpen, elementLabel, onCancel, onConfirm }: RemoveElementModalProps) {
  const { t: tCommon } = useTranslation("common");
  const { t } = useTranslation("removeElementModal");
  return (
    <JBModal className={modalStyles.formModal} isOpen={isOpen} label={t("confirmRemoveTitle")} autoCloseOnEscape autoCloseOnBackgroundClick onClose={onCancel}>
      <div slot="header">
        <div className={styles.modalHeading}>
          <p className={styles.eyebrow}>{elementLabel}</p>
          <h2>{t("confirmRemoveTitle")}</h2>
        </div>
        <ModalCloseButton label={tCommon("close")} onClick={onCancel} />
      </div>
      <div slot="content" className={styles.modalContent}>
        <p className={styles.modalDescription}>{t("confirmRemoveDescription")}</p>
      </div>
      <div slot="footer" className={styles.modalActions}>
        <JBButton variant="ghost" onClick={onCancel}>
          {tCommon("cancel")}
        </JBButton>
        <JBButton color="danger" onClick={onConfirm}>
          {t("confirmRemove")}
        </JBButton>
      </div>
    </JBModal>
  );
}
