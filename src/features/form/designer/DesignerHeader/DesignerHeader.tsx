import { useState } from "react";
import { observer } from "mobx-react-lite";
import { JBButton } from "jb-button/react";
import { JBInput } from "jb-input/react";
import type { FormAppDirection, FormAppLocale, FormMessages } from "../../i18n/locale-adapter";
import { formPageHref } from "../../application/form-page-url";
import { FormRouteBrand, FormRouteHeader, FormRouteLinkButton } from "../../layout/FormRouteHeader";
import { FormRouteMenu } from "../../layout/FormRouteMenu";
import "jb-icons/arrow";
import "jb-icons/edit";
import { useDesignerUiStore } from "../state/DesignerUiStore";
import styles from "./DesignerHeader.module.css";

function valueFromEvent(event: unknown): string {
  const source = event as { detail?: { value?: unknown }; target?: { value?: unknown } };
  return String(source.detail?.value ?? source.target?.value ?? "");
}

export type DesignerSaveStatus = "saving" | "saved" | "invalid" | "error";

export interface DesignerHeaderProps {
  direction: FormAppDirection;
  messages: FormMessages;
  locale: FormAppLocale;
  formSlug?: string;
  themeSlug?: string;
  themeName: string;
  saveStatus: DesignerSaveStatus;
  canUndo: boolean;
  canRedo: boolean;
  canSetDefault: boolean;
  isDefault: boolean;
  canBindForm: boolean;
  isBoundToForm: boolean;
  onLocaleChange: (locale: FormAppLocale) => void;
  onThemeNameChange: (name: string) => void;
  onOpenLibrary: () => void;
  onUndo: () => void;
  onRedo: () => void;
  onRetrySave: () => void;
  onSetDefault: () => void;
  onBindForm: () => void;
}

export const DesignerHeader = observer(function DesignerHeader(props: DesignerHeaderProps) {
  const ui = useDesignerUiStore();
  const [editingName, setEditingName] = useState(false);
  const {
    direction, messages, locale, formSlug, themeSlug, themeName, saveStatus,
    canUndo, canRedo, canSetDefault, isDefault, canBindForm, isBoundToForm,
    onLocaleChange, onThemeNameChange, onOpenLibrary, onUndo, onRedo,
    onRetrySave, onSetDefault, onBindForm,
  } = props;

  const closeMobileActions = () => ui.setMobileActionsOpen(false);

  return (
    <FormRouteHeader layout="editor" className={styles.header}>
      <FormRouteBrand className={styles.headerBrand} href={formPageHref("landing")} title={messages.designerBrandTitle} subtitle={messages.designerBrandSubtitle} />
      <div className={styles.themeIdentity}>
        <button type="button" className={styles.backButton} onClick={onOpenLibrary}>
          <jb-icon-arrow direction={direction === "rtl" ? "right" : "left"} />
          <span>{messages.designerBackThemes}</span>
        </button>
        <span className={styles.headerDivider} />
        {editingName ? (
          <JBInput className={styles.nameInput} size="sm" aria-label={messages.designerThemeName} value={themeName} onInput={event => onThemeNameChange(valueFromEvent(event))} onBlur={() => setEditingName(false)} />
        ) : (
          <button type="button" className={styles.themeName} onClick={() => setEditingName(true)}>{themeName}<jb-icon-edit /></button>
        )}
        <p className={`${styles.saveState} ${styles[`saveState_${saveStatus}`]}`} aria-live="polite">
          <span aria-hidden="true" />
          {saveStatus === "saving" ? messages.designerSaving : saveStatus === "invalid" ? messages.designerFinishEditing : saveStatus === "error" ? messages.designerSaveFailed : messages.designerSaved}
        </p>
      </div>
      <div className={`${styles.headerActions} ${styles.desktopHeaderActions}`}>
        <FormRouteMenu currentPage="designer" messages={messages} formSlug={formSlug} themeSlug={themeSlug} language={locale} onLanguageChange={language => onLocaleChange(language as FormAppLocale)} />
        <FormRouteLinkButton href={formPageHref("preview", formSlug, themeSlug)} variant="outline">{messages.preview}</FormRouteLinkButton>
        <JBButton size="sm" variant="ghost" disabled={!canUndo} aria-label={messages.designerUndo} onClick={onUndo}>{messages.designerUndo}</JBButton>
        <JBButton size="sm" variant="ghost" disabled={!canRedo} aria-label={messages.designerRedo} onClick={onRedo}>{messages.designerRedo}</JBButton>
        {saveStatus === "error" ? <JBButton size="sm" variant="outline" onClick={onRetrySave}>{messages.designerRetrySave}</JBButton> : null}
        <JBButton size="sm" variant="ghost" disabled={!canSetDefault} onClick={onSetDefault}>{isDefault ? messages.designerDefault : messages.designerSetDefault}</JBButton>
        {formSlug ? <JBButton size="sm" variant="ghost" disabled={!canBindForm} onClick={onBindForm}>{isBoundToForm ? messages.designerUsedForForm : messages.designerUseForForm}</JBButton> : null}
        <JBButton color="primary" onClick={ui.openExport}>{messages.designerExportTheme}</JBButton>
      </div>
      <div className={styles.mobileHeaderActions}>
        <FormRouteLinkButton href={formPageHref("preview", formSlug, themeSlug)} variant="outline">{messages.preview}</FormRouteLinkButton>
        <FormRouteMenu currentPage="designer" messages={messages} formSlug={formSlug} themeSlug={themeSlug} language={locale} onLanguageChange={language => onLocaleChange(language as FormAppLocale)} />
        <JBButton size="sm" variant="ghost" aria-expanded={ui.mobileActionsOpen} aria-haspopup="dialog" onClick={() => ui.setMobileActionsOpen(!ui.mobileActionsOpen)}>{messages.designerMore}</JBButton>
        {ui.mobileActionsOpen ? (
          <>
            <button className={styles.mobileActionsBackdrop} type="button" aria-label={messages.designerCloseActions} onClick={closeMobileActions} />
            <div className={styles.mobileActionsMenu} role="dialog" aria-label={messages.designerActions} onKeyDown={event => { if (event.key === "Escape") closeMobileActions(); }}>
              <JBButton size="sm" variant="ghost" disabled={!canUndo} onClick={() => { onUndo(); closeMobileActions(); }}>{messages.designerUndo}</JBButton>
              <JBButton size="sm" variant="ghost" disabled={!canRedo} onClick={() => { onRedo(); closeMobileActions(); }}>{messages.designerRedo}</JBButton>
              {saveStatus === "error" ? <JBButton size="sm" variant="outline" onClick={() => { closeMobileActions(); onRetrySave(); }}>{messages.designerRetrySave}</JBButton> : null}
              <JBButton size="sm" variant="ghost" disabled={!canSetDefault} onClick={() => { closeMobileActions(); onSetDefault(); }}>{isDefault ? messages.designerDefault : messages.designerSetDefault}</JBButton>
              {formSlug ? <JBButton size="sm" variant="ghost" disabled={!canBindForm} onClick={() => { closeMobileActions(); onBindForm(); }}>{isBoundToForm ? messages.designerUsedForForm : messages.designerUseForForm}</JBButton> : null}
              <JBButton color="primary" onClick={() => { closeMobileActions(); ui.openExport(); }}>{messages.designerExportTheme}</JBButton>
            </div>
          </>
        ) : null}
      </div>
    </FormRouteHeader>
  );
});
