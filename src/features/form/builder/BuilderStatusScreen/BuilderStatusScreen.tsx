import { JBButton } from "jb-button/react";
import { JBLoading } from "jb-loading/react";
import { observer } from "mobx-react-lite";
import type { FormMessages } from "../../i18n/locale-adapter";
import { getStorageIssueMessage } from "../../i18n/locale-adapter";
import { useBuilderStore } from "../BuilderStoreContext";
import styles from "./BuilderStatusScreen.module.css";

interface BuilderStatusScreenProps {
  messages: FormMessages;
  slug?: string;
}

export const BuilderStatusScreen = observer(function BuilderStatusScreen({ messages, slug }: BuilderStatusScreenProps) {
  const store = useBuilderStore();

  if (store.status === "loading") {
    return (
      <output className={styles.stateScreen}>
        <JBLoading />
        <p>{messages.loading}</p>
      </output>
    );
  }

  return (
    <div className={styles.stateScreen} role="alert">
      <h1>Builder unavailable</h1>
      <p>{getStorageIssueMessage(messages, store.storageIssue)}</p>
      <JBButton onClick={() => void store.initialize(slug)}>{messages.retry}</JBButton>
    </div>
  );
});
