import { useEffect, useRef, useState } from "react";
import { JBButton } from "jb-button/react";
import { JBTooltip } from "@jbui/tooltip/react";
import { JBOption } from "jb-select/option/react";
import { JBSelect } from "jb-select/react";
import "jb-icons/eye";
import "jb-icons/react";
import { observer } from "mobx-react-lite";
import { formPageHref } from "../../application/form-page-url";
import { inferLocaleDirection } from "../../domain/form-document";
import { getStorageIssueMessage, type FormMessages } from "../../i18n/locale-adapter";
import { useBuilderStore } from "../store/BuilderStoreContext";
import { CatalogIcon } from "../CatalogIcon/CatalogIcon";
import { FormRouteBrand, FormRouteHeader } from "../../layout/FormRouteHeader";
import styles from "./BuilderHeader.module.css";
import DesignIcon from './design.svg?react'
import SaveIcon from './save.svg?react'
/** Builder destinations available from primary navigation actions. */
export type BuilderNavigationTarget = "designer" | "preview";

/** Primary document and workflow actions owned by the builder header. */
interface BuilderHeaderProps {
  /** Localized builder-interface copy. */
  messages: FormMessages;
  /** Opens document identity and localization settings. */
  onOpenSettings: () => void;
  /** Navigates to another route while retaining selected form identity. */
  onNavigate: (target: BuilderNavigationTarget) => void;
  /** Opens portable JSON import. */
  onImport: () => void;
  /** Restores the previous document state. */
  onUndo: () => boolean;
  /** Reapplies an undone document state. */
  onRedo: () => boolean;
  /** Opens portable JSON export. */
  onExport: () => void;
}

/** Decorative settings glyph for document configuration actions. */
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

/** Decorative undo or redo glyph whose direction follows the requested history action. */
function HistoryActionIcon({ action }: { action: "undo" | "redo" }) {
  return (
    <svg className={styles.historyIcon} data-action={action} viewBox="0 0 24 24" aria-hidden="true">
      <path d="M9 7 4.5 11.5 9 16" />
      <path d="M5 11.5h8.25a6.25 6.25 0 0 1 6.25 6.25V19" />
    </svg>
  );
}

/** Decorative overflow glyph for compact builder actions. */
function OverflowMenuIcon() {
  return (
    <svg className={styles.overflowMenuIcon} viewBox="0 0 24 24" aria-hidden="true">
      <circle cx="12" cy="5" r="1.5" />
      <circle cx="12" cy="12" r="1.5" />
      <circle cx="12" cy="19" r="1.5" />
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
  /** Shared builder state observed for document identity, locale, and save status. */
  const store = useBuilderStore();
  /** Whether compact layout should prioritize preview after the draft is safely saved. */
  const showMobilePreview = store.status === "ready" && store.hasSavedDraft && !store.isDirty;
  /** Visibility of the compact action menu. */
  const [menuOpen, setMenuOpen] = useState(false);
  /** Menu boundary used to detect outside-pointer dismissal. */
  const menuRef = useRef<HTMLDivElement>(null);
  /** Built-in and document-configured locales available for content editing. */
  const selectableLocales = [...new Set(["en", "fa", ...Object.keys(store.document.localization.locales)])];
  /** Adds a locale when necessary, selects it for editing, and closes compact navigation. */
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
    setMenuOpen(false);
  };

  useEffect(() => {
    if (!menuOpen) return;

    /** Closes compact actions when focus intent moves outside the menu. */
    const closeOnOutsideClick = (event: MouseEvent) => {
      if (event.target instanceof Node && !menuRef.current?.contains(event.target)) setMenuOpen(false);
    };
    /** Closes compact actions with the conventional Escape interaction. */
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setMenuOpen(false);
    };

    document.addEventListener("mousedown", closeOnOutsideClick);
    document.addEventListener("keydown", closeOnEscape);
    return () => {
      document.removeEventListener("mousedown", closeOnOutsideClick);
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, [menuOpen]);

  /** Closes compact navigation before executing the selected business action. */
  const runMenuAction = (action: () => void) => {
    setMenuOpen(false);
    action();
  };

  return (
    <FormRouteHeader layout="editor" className={styles.header}>
      <FormRouteBrand href={formPageHref("landing")} title={messages.productName} subtitle={messages.editorReady} />

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
        <div className={styles.overflowMenu} ref={menuRef}>
          <button
            type="button"
            className={styles.overflowMenuToggle}
            aria-label="More form actions"
            aria-expanded={menuOpen}
            aria-controls="builder-mobile-actions"
            onClick={() => setMenuOpen(open => !open)}
          >
            <OverflowMenuIcon />
          </button>
          <div id="builder-mobile-actions" className={styles.overflowMenuPanel} hidden={!menuOpen}>
            <JBTooltip content={messages.formSettings} positionArea="bottom" tail>
              <button type="button" className={styles.menuSettingsButton} onClick={() => runMenuAction(onOpenSettings)}>
                <SettingsIcon />
                {messages.formSettings}
              </button>
            </JBTooltip>
            <div className={styles.documentActions}>
              <JBButton variant="ghost" size="sm" onClick={() => runMenuAction(onImport)}>
                {messages.importJson}
              </JBButton>
              <JBButton variant="ghost" size="sm" onClick={() => runMenuAction(onExport)}>
                {messages.exportJson}
              </JBButton>
            </div>
            <div className={styles.historyActions}>
              <JBTooltip content={messages.undo} positionArea="bottom" tail>
                <JBButton square variant="ghost" size="sm" aria-label={messages.undo} disabled={!store.canUndo} onClick={() => runMenuAction(onUndo)}>
                  <HistoryActionIcon action="undo" />
                </JBButton>
              </JBTooltip>
              <JBTooltip content={messages.redo} positionArea="bottom" tail>
                <JBButton square variant="ghost" size="sm" aria-label={messages.redo} disabled={!store.canRedo} onClick={() => runMenuAction(onRedo)}>
                  <HistoryActionIcon action="redo" />
                </JBButton>
              </JBTooltip>
            </div>
            <JBButton variant="outline" size="sm" onClick={() => runMenuAction(() => onNavigate("preview"))}>
              <jb-icon-eye open size="sm" />
              {messages.preview}
            </JBButton>
            <JBButton variant="outline" size="sm" onClick={() => runMenuAction(() => onNavigate("designer"))}>
              <DesignIcon />
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
          </div>
        </div>
        <JBButton
          className={styles.saveButton}
          data-mobile-hidden={showMobilePreview}
          square
          color="primary"
          size="sm"
          aria-label={messages.save}
          disabled={store.status === "saving"}
          onClick={() => void store.save()}
        >
          <SaveIcon />
          <span className={styles.saveLabel}>{store.status === "saving" ? messages.saving : messages.save}</span>
        </JBButton>
        {showMobilePreview ? (
          <JBButton
            className={styles.mobilePreviewButton}
            square
            color="primary"
            size="sm"
            aria-label={messages.preview}
            onClick={() => onNavigate("preview")}
          >
            <jb-icon-eye open size="sm" />
            <span className={styles.saveLabel}>{messages.preview}</span>
          </JBButton>
        ) : null}
      </nav>
    </FormRouteHeader>
  );
});
