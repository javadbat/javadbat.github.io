import type { Dispatch, SetStateAction } from "react";
import { JBButton } from "jb-button/react";
import { JBOption, JBSelect } from "jb-select/react";
import { observer } from "mobx-react-lite";
import { formRouteHref } from "../application/form-route";
import { getStorageIssueMessage, type FormAppLocale, type FormMessages } from "../i18n/locale-adapter";
import { useBuilderStore } from "./BuilderStoreContext";
import { CatalogIcon } from "./CatalogIcon";
import styles from "./BuilderApp.module.css";

export type BuilderNavigationTarget = "designer" | "preview";

interface BuilderHeaderProps {
  locale: FormAppLocale;
  messages: FormMessages;
  setLocale: Dispatch<SetStateAction<FormAppLocale>>;
  onOpenSettings: () => void;
  onNavigate: (target: BuilderNavigationTarget) => void;
  onExport: () => void;
}

/**
 * Owns document identity, locale selection, and primary builder actions.
 *
 * The component observes the store directly so save-state changes update only
 * the header and the builder sections that actually consume those values.
 */
export const BuilderHeader = observer(function BuilderHeader({ locale, messages, setLocale, onOpenSettings, onNavigate, onExport }: BuilderHeaderProps) {
  const store = useBuilderStore();

  return (
    <header className={styles.header}>
      <a className={styles.brand} href={formRouteHref("landing")}>
        <span className={styles.brandMark}>JB</span>
        <span>
          <strong>{messages.productName}</strong>
          <small>{messages.editorReady}</small>
        </span>
      </a>

      <div className={styles.documentIdentity}>
        <span className={styles.documentName}>{store.formName}</span>
        <button type="button" className={styles.settingsButton} aria-label={messages.formSettings} onClick={onOpenSettings}>
          <CatalogIcon iconId="settings" />
        </button>
        <span className={styles.identityBadge}>{store.linkedRecord ? messages.linkedNamedForm : messages.currentDraft}</span>
        <output
          className={styles.saveState}
          data-dirty={store.isDirty || store.status === "save-error"}
          title={store.status === "save-error" ? getStorageIssueMessage(messages, store.storageIssue) : undefined}
        >
          <i />
          {store.status === "saving"
            ? messages.saving
            : store.status === "save-error"
              ? messages.saveFailed
              : store.isDirty
                ? messages.unsavedChanges
                : store.hasSavedDraft
                  ? messages.saved
                  : messages.currentDraft}
        </output>
      </div>

      <nav className={styles.headerActions} aria-label="Form actions">
        <JBSelect<FormAppLocale>
          name="builderLocale"
          aria-label={messages.locale}
          size="sm"
          value={locale}
          hideClear
          onChange={event => setLocale(event.target.value === "fa" ? "fa" : "en")}
        >
          <JBOption value="en">EN</JBOption>
          <JBOption value="fa">FA</JBOption>
        </JBSelect>
        <JBButton variant="ghost" size="sm" onClick={() => onNavigate("designer")}>
          {messages.designer}
        </JBButton>
        <JBButton variant="outline" size="sm" onClick={() => onNavigate("preview")}>
          {messages.preview}
        </JBButton>
        <JBButton variant="ghost" size="sm" onClick={onExport}>
          {messages.exportJson}
        </JBButton>
        <JBButton color="primary" size="sm" disabled={store.status === "saving"} onClick={() => void store.save()}>
          {store.status === "saving" ? messages.saving : messages.save}
        </JBButton>
      </nav>
    </header>
  );
});
