import { JBButton } from "jb-button/react";
import { JBTooltip } from "@jbui/tooltip/react";
import { JBOption } from "jb-select/option/react";
import { JBSelect } from "jb-select/react";
import "jb-icons/eye";
import "jb-icons/react";
import { observer } from "mobx-react-lite";
import { formRouteHref } from "../../application/form-route";
import { inferLocaleDirection } from "../../domain/form-document";
import { getStorageIssueMessage, type FormMessages } from "../../i18n/locale-adapter";
import { useBuilderStore } from "../store/BuilderStoreContext";
import { CatalogIcon } from "../CatalogIcon/CatalogIcon";
import styles from "./BuilderHeader.module.css";
import DesignIcon from './design.svg?react'
import SaveIcon from './save.svg?react'
export type BuilderNavigationTarget = "designer" | "preview";

interface BuilderHeaderProps {
  messages: FormMessages;
  onOpenSettings: () => void;
  onNavigate: (target: BuilderNavigationTarget) => void;
  onImport: () => void;
  onUndo: () => boolean;
  onRedo: () => boolean;
  onExport: () => void;
}

function SettingsIcon() {
  return (
    <svg className={styles.settingsIcon} viewBox="0 0 24 24" aria-hidden="true">
      <g transform="translate(3.5 2.5)">
        <path d="M2.5 0A2.5 2.5 0 1 1 0 2.5 2.5 2.5 0 0 1 2.5 0Z" transform="translate(6 7)" />
        <path d="M16.668 4.75a2.464 2.464 0 0 0-3.379-.912 1.543 1.543 0 0 1-2.314-1.346A2.484 2.484 0 0 0 8.5 0a2.484 2.484 0 0 0-2.475 2.492 1.543 1.543 0 0 1-2.313 1.347 2.465 2.465 0 0 0-3.38.912 2.5 2.5 0 0 0 .906 3.4 1.56 1.56 0 0 1 0 2.692 2.5 2.5 0 0 0-.906 3.4 2.465 2.465 0 0 0 3.379.913 1.542 1.542 0 0 1 2.313 1.345A2.484 2.484 0 0 0 8.5 19a2.484 2.484 0 0 0 2.474-2.492 1.543 1.543 0 0 1 2.314-1.345 2.465 2.465 0 0 0 3.379-.913 2.5 2.5 0 0 0-.905-3.4 1.56 1.56 0 0 1 0-2.692 2.5 2.5 0 0 0 .906-3.408Z" />
      </g>
    </svg>
  );
}

function HistoryActionIcon({ action }: { action: "undo" | "redo" }) {
  return (
    <svg className={styles.historyIcon} data-action={action} viewBox="0 0 24 24" aria-hidden="true">
      <path d="M9 7 4.5 11.5 9 16" />
      <path d="M5 11.5h8.25a6.25 6.25 0 0 1 6.25 6.25V19" />
    </svg>
  );
}

/**
 * Owns document identity, locale selection, and primary builder actions.
 *
 * The component observes the store directly so save-state changes update only
 * the header and the builder sections that actually consume those values.
 */
export const BuilderHeader = observer(function BuilderHeader({ messages, onOpenSettings, onNavigate, onImport, onUndo, onRedo, onExport }: BuilderHeaderProps) {
  const store = useBuilderStore();
  const selectableLocales = [...new Set(["en", "fa", ...Object.keys(store.document.localization.locales)])];
  const selectLocale = (nextLocale: string) => {
    if (!store.document.localization.locales[nextLocale]) {
      store.setFormLocalization({
        ...store.document.localization,
        locales: {
          ...store.document.localization.locales,
          [nextLocale]: { direction: inferLocaleDirection(nextLocale) },
        },
      });
    }
    store.setEditingLocale(nextLocale);
  };

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
        <JBTooltip content={messages.formSettings} positionArea="bottom" tail>
          <button type="button" className={styles.settingsButton} aria-label={messages.formSettings} onClick={onOpenSettings}>
            <SettingsIcon />
          </button>
        </JBTooltip>
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
        <div className={styles.documentActions}>
          <JBButton variant="ghost" size="sm" onClick={onImport}>
            {messages.importJson}
          </JBButton>
          <JBButton variant="ghost" size="sm" onClick={onExport}>
            {messages.exportJson}
          </JBButton>
        </div>
        <div className={styles.historyActions}>
          <JBTooltip content={messages.undo} positionArea="bottom" tail>
            <JBButton square variant="ghost" size="sm" aria-label={messages.undo} disabled={!store.canUndo} onClick={onUndo}>
              <HistoryActionIcon action="undo" />
            </JBButton>
          </JBTooltip>
          <JBTooltip content={messages.redo} positionArea="bottom" tail>
            <JBButton square variant="ghost" size="sm" aria-label={messages.redo} disabled={!store.canRedo} onClick={onRedo}>
              <HistoryActionIcon action="redo" />
            </JBButton>
          </JBTooltip>
        </div>
        <JBButton variant="outline" size="sm" onClick={() => onNavigate("preview")}>
          <jb-icon-eye open size="sm" />
          {messages.preview}
        </JBButton>
        <JBButton variant="outline" size="sm" onClick={() => onNavigate("designer")}>
          <DesignIcon/>
          {messages.designer}
        </JBButton>
        <div className={styles.localeControls}>
          <CatalogIcon iconId="language" />
          <JBSelect<string>
            name="contentLocale"
            aria-label={messages.contentLocale}
            size="sm"
            value={store.editingLocale}
            hideClear
            onChange={event => selectLocale(event.target.value)}
          >
            {selectableLocales.map(contentLocale => (
              <JBOption key={contentLocale} value={contentLocale}>
                {contentLocale.toUpperCase()}
              </JBOption>
            ))}
          </JBSelect>
        </div>
        <JBButton color="primary" size="sm" disabled={store.status === "saving"} onClick={() => void store.save()}>
          <SaveIcon/>
          {store.status === "saving" ? messages.saving : messages.save}
        </JBButton>
      </nav>
    </header>
  );
});
