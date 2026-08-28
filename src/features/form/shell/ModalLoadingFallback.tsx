import { JBLoading } from "jb-loading/react";
import { JBModal } from "jb-modal/react";
import modalStyles from "./FormModal.module.css";

/** Copy required to announce which deferred form workflow is loading. */
interface ModalLoadingFallbackProps {
  /** Accessible loading label shown and announced to the user. */
  label: string;
}

/** Shared accessible modal fallback used while lazily loaded form dialogs become available. */
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
