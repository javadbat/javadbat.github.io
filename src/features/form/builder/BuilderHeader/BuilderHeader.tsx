import { useTranslation } from "react-i18next";
import { useEffect, useRef, useState } from "react";
import { JBButton } from "jb-button/react";
import { JBTooltip } from "@jbui/tooltip/react";
import "jb-icons/eye";
import "jb-icons/react";
import { observer } from "mobx-react-lite";
import { formPageHref } from "../../application/form-page-url";
import { inferLocaleDirection } from "../../domain/form-document";
import { getStorageIssueMessage } from "../../i18n/storage-issue-message";
import { useBuilderStore } from "../store/BuilderStoreContext";
import { FormRouteBrand, FormRouteHeader, FormRouteLinkButton } from "../../layout/FormRouteHeader";
import { FormRouteMenu } from "../../layout/FormRouteMenu";
import styles from "./BuilderHeader.module.css";
import SaveIcon from './save.svg?react'
/** Primary document and workflow actions owned by the builder header. */
interface BuilderHeaderProps {
  /** Opens document identity and localization settings. */
  onOpenSettings: () => void;
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
export const BuilderHeader = observer(function BuilderHeader({ onOpenSettings, onImport, onUndo, onRedo, onExport }: BuilderHeaderProps) {
  const { t } = useTranslation("builderHeader");
  const { t: tCommon } = useTranslation("common");
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
  const selectedFormSlug = store.linkedRecord?.slug;
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
      <FormRouteBrand href={formPageHref("landing")} title={tCommon("productName")} subtitle={tCommon("editorReady")} />

      <div className={styles.documentIdentity}>
        <span className={styles.documentName}>{store.formName}</span>
        <JBTooltip content={tCommon("formSettings")} positionArea="bottom" tail>
          <button type="button" className={styles.settingsButton} aria-label={tCommon("formSettings")} onClick={onOpenSettings}>
            <SettingsIcon />
          </button>
        </JBTooltip>
        <span className={styles.identityBadge}>{store.linkedRecord ? tCommon("linkedNamedForm") : tCommon("currentDraft")}</span>
        <output
          className={styles.saveState}
          data-dirty={store.isDirty || store.status === "save-error"}
          title={store.status === "save-error" ? getStorageIssueMessage(tCommon, store.storageIssue) : undefined}
        >
          <i />
          {store.status === "saving"
            ? tCommon("saving")
            : store.status === "save-error"
              ? t("saveFailed")
              : store.isDirty
                ? t("unsavedChanges")
                : store.hasSavedDraft
                  ? t("saved")
                  : tCommon("currentDraft")}
        </output>
      </div>

      <nav className={styles.headerActions} aria-label="Form actions">
        <FormRouteMenu
          currentPage="builder"
          formSlug={selectedFormSlug}
          contentLanguage={store.editingLocale}
          contentLanguageOptions={selectableLocales.map(contentLocale => ({ value: contentLocale, label: contentLocale.toUpperCase() }))}
          onContentLanguageChange={selectLocale}
        />
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
            <JBTooltip content={tCommon("formSettings")} positionArea="bottom" tail>
              <button type="button" className={styles.menuSettingsButton} onClick={() => runMenuAction(onOpenSettings)}>
                <SettingsIcon />
                {tCommon("formSettings")}
              </button>
            </JBTooltip>
            <div className={styles.documentActions}>
              <JBButton variant="ghost" size="sm" onClick={() => runMenuAction(onImport)}>
                {tCommon("importJson")}
              </JBButton>
              <JBButton variant="ghost" size="sm" onClick={() => runMenuAction(onExport)}>
                {tCommon("exportJson")}
              </JBButton>
            </div>
            <div className={styles.historyActions}>
              <JBTooltip content={t("undo")} positionArea="bottom" tail>
                <JBButton square variant="ghost" size="sm" aria-label={t("undo")} disabled={!store.canUndo} onClick={() => runMenuAction(onUndo)}>
                  <HistoryActionIcon action="undo" />
                </JBButton>
              </JBTooltip>
              <JBTooltip content={t("redo")} positionArea="bottom" tail>
                <JBButton square variant="ghost" size="sm" aria-label={t("redo")} disabled={!store.canRedo} onClick={() => runMenuAction(onRedo)}>
                  <HistoryActionIcon action="redo" />
                </JBButton>
              </JBTooltip>
            </div>
            <FormRouteLinkButton href={formPageHref("preview", selectedFormSlug)} variant="outline">
              <jb-icon-eye open size="sm" />
              {tCommon("preview")}
            </FormRouteLinkButton>
          </div>
        </div>
        <JBButton
          className={styles.saveButton}
          data-mobile-hidden={showMobilePreview}
          square
          color="primary"
          size="sm"
          aria-label={tCommon("save")}
          disabled={store.status === "saving"}
          onClick={() => void store.save()}
        >
          <SaveIcon />
          <span className={styles.saveLabel}>{store.status === "saving" ? tCommon("saving") : tCommon("save")}</span>
        </JBButton>
        {showMobilePreview ? (
          <FormRouteLinkButton
            className={styles.mobilePreviewButton}
            square
            variant="solid"
            aria-label={tCommon("preview")}
            href={formPageHref("preview", selectedFormSlug)}
          >
            <jb-icon-eye open size="sm" />
            <span className={styles.saveLabel}>{tCommon("preview")}</span>
          </FormRouteLinkButton>
        ) : null}
      </nav>
    </FormRouteHeader>
  );
});
