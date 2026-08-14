import { JBButton } from "jb-button/react";
import { JBOption } from "jb-select/option/react";
import { JBSelect } from "jb-select/react";
import "jb-icons/arrow-tailed";
import "jb-icons/eye";
import "jb-icons/react";
import { observer } from "mobx-react-lite";
import { formRouteHref } from "../../application/form-route";
import { inferLocaleDirection } from "../../domain/form-document";
import { getStorageIssueMessage, type FormMessages } from "../../i18n/locale-adapter";
import { useBuilderStore } from "../BuilderStoreContext";
import { CatalogIcon } from "../CatalogIcon/CatalogIcon";
import { BuilderTooltip } from "../BuilderTooltip";
import styles from "./BuilderHeader.module.css";

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
        <BuilderTooltip content={messages.formSettings} positionArea="bottom">
          <button type="button" className={styles.settingsButton} aria-label={messages.formSettings} onClick={onOpenSettings}>
            <CatalogIcon iconId="settings" />
          </button>
        </BuilderTooltip>
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
          <BuilderTooltip content={messages.undo} positionArea="bottom">
            <JBButton square variant="ghost" size="sm" aria-label={messages.undo} disabled={!store.canUndo} onClick={onUndo}>
              <jb-icon-arrow-tailed direction="inline-start" size="sm" />
            </JBButton>
          </BuilderTooltip>
          <BuilderTooltip content={messages.redo} positionArea="bottom">
            <JBButton square variant="ghost" size="sm" aria-label={messages.redo} disabled={!store.canRedo} onClick={onRedo}>
              <jb-icon-arrow-tailed direction="inline-end" size="sm" />
            </JBButton>
          </BuilderTooltip>
        </div>
        <JBButton variant="outline" size="sm" onClick={() => onNavigate("preview")}>
          <jb-icon-eye open size="sm" />
          {messages.preview}
        </JBButton>
        <JBButton variant="outline" size="sm" onClick={() => onNavigate("designer")}>
          <span className={styles.artboardIcon} aria-hidden="true" />
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
          {store.status === "saving" ? messages.saving : messages.save}
        </JBButton>
      </nav>
    </header>
  );
});
