import { JBButton } from "jb-button/react";
import { JBLoading } from "jb-loading/react";
import { useState } from "react";
import { observer } from "mobx-react-lite";
import type { FormMessages } from "../../i18n/locale-adapter";
import { getStorageIssueMessage } from "../../i18n/locale-adapter";
import { useBuilderStore } from "../store/BuilderStoreContext";
import styles from "./BuilderStatusScreen.module.css";

interface BuilderStatusScreenProps {
  messages: FormMessages;
  slug?: string;
}

export const BuilderStatusScreen = observer(function BuilderStatusScreen({ messages, slug }: BuilderStatusScreenProps) {
  const store = useBuilderStore();
  const [busy, setBusy] = useState(false);
  const canDeleteCorruptRecord = store.storageIssue?.code === "corrupt-record" || store.storageIssue?.code === "incompatible-record";

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
      {busy ? <JBLoading /> : null}
      <h1>{busy ? messages.loading : "Builder unavailable"}</h1>
      <p>{busy ? messages.loading : getStorageIssueMessage(messages, store.storageIssue)}</p>
      <div className={styles.actions}>
        <JBButton
          disabled={busy}
          onClick={() => {
            setBusy(true);
            void store.initialize(slug).finally(() => setBusy(false));
          }}
        >
          {messages.retry}
        </JBButton>
        {canDeleteCorruptRecord ? (
          <JBButton
            disabled={busy}
            variant="outline"
            onClick={() => {
              if (!window.confirm(messages.deleteCorruptFormConfirm)) return;
              setBusy(true);
              void store.deleteCorruptRecord(slug)
                .then(deleted => {
                  if (deleted) window.location.assign("/form");
                })
                .finally(() => setBusy(false));
            }}
          >
            {messages.deleteCorruptForm}
          </JBButton>
        ) : null}
        <JBButton disabled={busy} variant="ghost" onClick={() => window.location.assign("/form")}>
          {messages.backToForms}
        </JBButton>
      </div>
    </div>
  );
});
