import { useTranslation } from "react-i18next";
import { JBButton } from "jb-button/react";
import { JBLoading } from "jb-loading/react";
import { useState } from "react";
import { observer } from "mobx-react-lite";
import { getStorageIssueMessage } from "../../i18n/storage-issue-message";
import { useBuilderStore } from "../store/BuilderStoreContext";
import styles from "./BuilderStatusScreen.module.css";

interface BuilderStatusScreenProps {

  slug?: string;
}

export const BuilderStatusScreen = observer(function BuilderStatusScreen({ slug }: BuilderStatusScreenProps) {
  const { t } = useTranslation("builderStatusScreen");
  const { t: tCommon } = useTranslation("common");
  const store = useBuilderStore();
  const [busy, setBusy] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const canDeleteCorruptRecord = store.storageIssue?.code === "corrupt-record" || store.storageIssue?.code === "incompatible-record";

  if (store.status === "loading") {
    return (
      <output className={styles.stateScreen}>
        <JBLoading />
        <p>{t("loading")}</p>
      </output>
    );
  }

  return (
    <div className={styles.stateScreen} role="alert">
      {busy ? <JBLoading /> : null}
      <h1>{busy ? t("loading") : "Builder unavailable"}</h1>
      <p>{busy ? t("loading") : getStorageIssueMessage(tCommon, store.storageIssue)}</p>
      {actionError ? <p role="status">{actionError}</p> : null}
      <div className={styles.actions}>
        <JBButton
          disabled={busy}
          onClick={() => {
            setBusy(true);
            void store.initialize(slug).finally(() => setBusy(false));
          }}
        >
          {t("retry")}
        </JBButton>
        {canDeleteCorruptRecord ? (
          <JBButton
            disabled={busy}
            variant="outline"
            onClick={() => {
              if (!window.confirm(t("deleteCorruptFormConfirm"))) return;
              setActionError(null);
              setBusy(true);
              void store.deleteCorruptRecord(slug).then(deleted => {
                if (deleted) {
                  window.location.assign("/form");
                  return;
                }
                setActionError(getStorageIssueMessage(tCommon, store.storageIssue));
              }).catch(() => {
                setActionError(tCommon("storageUnavailable"));
              }).finally(() => setBusy(false));
            }}
          >
            {t("deleteCorruptForm")}
          </JBButton>
        ) : null}
        <JBButton disabled={busy} variant="ghost" onClick={() => window.location.assign("/form")}>
          {tCommon("backToForms")}
        </JBButton>
      </div>
    </div>
  );
});
