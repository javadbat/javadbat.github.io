import { JBButton } from "jb-button/react";
import { ClientJBModal } from "../../../components/react/components/modal/ClientJBModal";
import type { FormMessages } from "../i18n/locale-adapter";
import styles from "./BuilderApp.module.css";

interface RemoveElementModalProps {
  isOpen: boolean;
  elementLabel: string;
  messages: FormMessages;
  onCancel: () => void;
  onConfirm: () => void;
}

export function RemoveElementModal({ isOpen, elementLabel, messages, onCancel, onConfirm }: RemoveElementModalProps) {
  return (
    <ClientJBModal isOpen={isOpen} label={messages.confirmRemoveTitle} autoCloseOnEscape autoCloseOnBackgroundClick onClose={onCancel}>
      <div slot="header" className={styles.modalHeading}>
        <p className={styles.eyebrow}>{elementLabel}</p>
        <h2>{messages.confirmRemoveTitle}</h2>
      </div>
      <div slot="content" className={styles.modalContent}>
        <p className={styles.modalDescription}>{messages.confirmRemoveDescription}</p>
      </div>
      <div slot="footer" className={styles.modalActions}>
        <JBButton variant="ghost" onClick={onCancel}>
          {messages.cancel}
        </JBButton>
        <JBButton color="danger" onClick={onConfirm}>
          {messages.confirmRemove}
        </JBButton>
      </div>
    </ClientJBModal>
  );
}
