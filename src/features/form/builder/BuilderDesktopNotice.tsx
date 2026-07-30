import { memo } from "react";
import { JBButton } from "jb-button/react";
import type { FormMessages } from "../i18n/locale-adapter";
import styles from "./BuilderApp.module.css";

interface BuilderDesktopNoticeProps {
  messages: FormMessages;
  onPreview: () => void;
}

export const BuilderDesktopNotice = memo(function BuilderDesktopNotice({ messages, onPreview }: BuilderDesktopNoticeProps) {
  return (
    <div className={styles.desktopNotice}>
      <span className={styles.noticeMark}>JB</span>
      <p className={styles.eyebrow}>{messages.builder}</p>
      <h1>{messages.desktopRequired}</h1>
      <p>{messages.desktopRequiredDescription}</p>
      <JBButton color="primary" onClick={onPreview}>
        {messages.preview}
      </JBButton>
    </div>
  );
});
