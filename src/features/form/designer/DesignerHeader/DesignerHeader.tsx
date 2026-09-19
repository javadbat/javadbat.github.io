import { useTranslation } from "react-i18next";
import { useState } from "react";
import { observer } from "mobx-react-lite";
import { JBButton } from "jb-button/react";
import { JBInput } from "jb-input/react";
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
  onThemeNameChange: (name: string) => void;
  onOpenLibrary: () => void;
  onUndo: () => void;
  onRedo: () => void;
  onRetrySave: () => void;
  onSetDefault: () => void;
  onBindForm: () => void;
}

export const DesignerHeader = observer(function DesignerHeader(props: DesignerHeaderProps) {
  const { t, i18n } = useTranslation("designerHeader");
  const direction = i18n.dir();
  const { t: tCommon } = useTranslation("common");
  const { t: tDesignerCommon } = useTranslation("designerCommon");
  const ui = useDesignerUiStore();
  const [editingName, setEditingName] = useState(false);
  const {
    formSlug, themeSlug, themeName, saveStatus,
    canUndo, canRedo, canSetDefault, isDefault, canBindForm, isBoundToForm,
    onThemeNameChange, onOpenLibrary, onUndo, onRedo,
    onRetrySave, onSetDefault, onBindForm,
  } = props;

  const closeMobileActions = () => ui.setMobileActionsOpen(false);

  return (
    <FormRouteHeader layout="editor" className={styles.header}>
      <FormRouteBrand className={styles.headerBrand} href={formPageHref("landing")} title={t("designerBrandTitle")} subtitle={t("designerBrandSubtitle")} />
      <div className={styles.themeIdentity}>
        <button type="button" className={styles.backButton} aria-label={t("designerBackThemes")} onClick={onOpenLibrary}>
          <jb-icon-arrow direction={direction === "rtl" ? "right" : "left"} />
          <span>{t("designerBackThemes")}</span>
        </button>
        <span className={styles.headerDivider} />
        {editingName ? (
          <JBInput className={styles.nameInput} size="sm" aria-label={tDesignerCommon("designerThemeName")} value={themeName} onInput={event => onThemeNameChange(valueFromEvent(event))} onBlur={() => setEditingName(false)} />
        ) : (
          <button type="button" className={styles.themeName} onClick={() => setEditingName(true)}>{themeName}<jb-icon-edit /></button>
        )}
        <p className={`${styles.saveState} ${styles[`saveState_${saveStatus}`]}`} aria-live="polite">
          <span aria-hidden="true" />
          {saveStatus === "saving" ? t("designerSaving") : saveStatus === "invalid" ? t("designerFinishEditing") : saveStatus === "error" ? t("designerSaveFailed") : t("designerSaved")}
        </p>
      </div>
      <div className={`${styles.headerActions} ${styles.desktopHeaderActions}`}>
        <FormRouteMenu currentPage="designer" formSlug={formSlug} themeSlug={themeSlug} />
        <FormRouteLinkButton href={formPageHref("preview", formSlug, themeSlug)} variant="outline">{tCommon("preview")}</FormRouteLinkButton>
        <JBButton size="sm" variant="ghost" disabled={!canUndo} aria-label={t("designerUndo")} onClick={onUndo}>{t("designerUndo")}</JBButton>
        <JBButton size="sm" variant="ghost" disabled={!canRedo} aria-label={t("designerRedo")} onClick={onRedo}>{t("designerRedo")}</JBButton>
        {saveStatus === "error" ? <JBButton size="sm" variant="outline" onClick={onRetrySave}>{t("designerRetrySave")}</JBButton> : null}
        <JBButton size="sm" variant="ghost" disabled={!canSetDefault} onClick={onSetDefault}>{isDefault ? tDesignerCommon("designerDefault") : tDesignerCommon("designerSetDefault")}</JBButton>
        {formSlug ? <JBButton size="sm" variant="ghost" disabled={!canBindForm} onClick={onBindForm}>{isBoundToForm ? t("designerUsedForForm") : t("designerUseForForm")}</JBButton> : null}
        <JBButton color="primary" onClick={ui.openExport}>{tDesignerCommon("designerExportTheme")}</JBButton>
      </div>
      <div className={styles.mobileHeaderActions}>
        <FormRouteLinkButton href={formPageHref("preview", formSlug, themeSlug)} variant="outline">{tCommon("preview")}</FormRouteLinkButton>
        <FormRouteMenu currentPage="designer" formSlug={formSlug} themeSlug={themeSlug} />
        <JBButton size="sm" variant="ghost" aria-expanded={ui.mobileActionsOpen} aria-haspopup="dialog" onClick={() => ui.setMobileActionsOpen(!ui.mobileActionsOpen)}>{t("designerMore")}</JBButton>
        {ui.mobileActionsOpen ? (
          <>
            <button className={styles.mobileActionsBackdrop} type="button" aria-label={t("designerCloseActions")} onClick={closeMobileActions} />
            <div className={styles.mobileActionsMenu} role="dialog" aria-label={t("designerActions")} onKeyDown={event => { if (event.key === "Escape") closeMobileActions(); }}>
              <JBButton size="sm" variant="ghost" disabled={!canUndo} onClick={() => { onUndo(); closeMobileActions(); }}>{t("designerUndo")}</JBButton>
              <JBButton size="sm" variant="ghost" disabled={!canRedo} onClick={() => { onRedo(); closeMobileActions(); }}>{t("designerRedo")}</JBButton>
              {saveStatus === "error" ? <JBButton size="sm" variant="outline" onClick={() => { closeMobileActions(); onRetrySave(); }}>{t("designerRetrySave")}</JBButton> : null}
              <JBButton size="sm" variant="ghost" disabled={!canSetDefault} onClick={() => { closeMobileActions(); onSetDefault(); }}>{isDefault ? tDesignerCommon("designerDefault") : tDesignerCommon("designerSetDefault")}</JBButton>
              {formSlug ? <JBButton size="sm" variant="ghost" disabled={!canBindForm} onClick={() => { closeMobileActions(); onBindForm(); }}>{isBoundToForm ? t("designerUsedForForm") : t("designerUseForForm")}</JBButton> : null}
              <JBButton color="primary" onClick={() => { closeMobileActions(); ui.openExport(); }}>{tDesignerCommon("designerExportTheme")}</JBButton>
            </div>
          </>
        ) : null}
      </div>
    </FormRouteHeader>
  );
});
