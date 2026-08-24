import { JBButton } from "jb-button/react";
import { JBModal } from "jb-modal/react";
import { ModalCloseButton } from "../../../components/react/components/modal/ModalCloseButton";
import type { FormValues } from "jb-form-builder/types";
import type { FormMessages } from "../i18n/locale-adapter";
import modalStyles from "../shell/FormModal.module.css";
import styles from "../shell/RouteShell.module.css";

interface FormResultModalProps {
  messages: FormMessages;
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

export function FormResultModal({ messages, values, onClose }: FormResultModalProps) {
  return (
    <JBModal
      className={modalStyles.formModal}
      isOpen
      label={messages.formResult}
      description={messages.formResultDescription}
      autoCloseOnEscape
      autoCloseOnBackgroundClick
      onClose={onClose}
    >
      <div slot="header" className={styles.resultModalHeader}>
        <div>
          <p className={styles.eyebrow}>{messages.submissionSuccessful}</p>
          <h2>{messages.formResult}</h2>
        </div>
        <ModalCloseButton label={messages.close} onClick={onClose} />
      </div>
      <div slot="content" className={styles.resultModalContent}>
        <p>{messages.formResultDescription}</p>
        <pre aria-label={messages.formResultJson} tabIndex={0}>
          <code>{JSON.stringify(values, null, 2)}</code>
        </pre>
      </div>
      <div slot="footer" className={styles.resultModalActions}>
        <JBButton variant="ghost" onClick={onClose}>
          {messages.close}
        </JBButton>
        <JBButton color="primary" onClick={() => downloadFormResult(values)}>
          {messages.downloadJson}
        </JBButton>
      </div>
    </JBModal>
  );
}
