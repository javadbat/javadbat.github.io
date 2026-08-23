import { JBButton } from "jb-button/react";
import "jb-icons/close";
import "jb-icons/react";

interface ModalCloseButtonProps {
  label: string;
  onClick: () => void;
}

export function ModalCloseButton({ label, onClick }: ModalCloseButtonProps) {
  return (
    <JBButton type="button" variant="ghost" size="sm" square aria-label={label} onClick={onClick} tabIndex={-1}>
      <jb-icon-close size="sm" />
    </JBButton>
  );
}
