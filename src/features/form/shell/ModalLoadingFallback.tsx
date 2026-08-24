import { JBLoading } from "jb-loading/react";
import { JBModal } from "jb-modal/react";
import modalStyles from "./FormModal.module.css";

interface ModalLoadingFallbackProps {
  label: string;
}

export function ModalLoadingFallback({ label }: ModalLoadingFallbackProps) {
  return (
    <JBModal className={modalStyles.formModal} isOpen label={label}>
      <div slot="content" className={modalStyles.modalLoading} role="status" aria-busy="true" aria-live="polite">
        <JBLoading />
        <span>{label}</span>
      </div>
    </JBModal>
  );
}
