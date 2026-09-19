import { useTranslation } from "react-i18next";
import { observer } from "mobx-react-lite";
import type { JBTabChangeEvent } from "jb-tab";
import { JBTab } from "jb-tab/react";
import { JBTabList } from "jb-tab/list/react";
import { JBTabTrigger } from "jb-tab/trigger/react";
import { useDesignerUiStore, type DesignerMobilePanel } from "../state/DesignerUiStore";
import styles from "./DesignerMobileTabs.module.css";

export const DesignerMobileTabs = observer(function DesignerMobileTabs() {
  const { t } = useTranslation("designerMobileTabs");
  const { t: tDesignerCommon } = useTranslation("designerCommon");
  const ui = useDesignerUiStore();

  return (
    <nav className={styles.mobileTabs} aria-label={t("designerMobilePanels")}>
      <JBTab value={ui.mobilePanel} onChange={(event: JBTabChangeEvent) => ui.setMobilePanel(event.detail.value as DesignerMobilePanel)}>
        <JBTabList size="sm" aria-label={t("designerMobilePanels")}>
          <JBTabTrigger value="design" color="primary">{t("designerDesign")}</JBTabTrigger>
          <JBTabTrigger value="preview" color="primary">{tDesignerCommon("designerPreview")}</JBTabTrigger>
        </JBTabList>
      </JBTab>
    </nav>
  );
});
