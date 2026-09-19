import { useTranslation } from "react-i18next";
import { memo, useState } from "react";
import type { JBTabChangeEvent } from "jb-tab";
import { JBTab } from "jb-tab/react";
import { JBTabList } from "jb-tab/list/react";
import { JBTabTrigger } from "jb-tab/trigger/react";
import layoutStyles from "../../layout/FormRouteLayout.module.css";
import { ComponentCatalog } from "../ComponentCatalog/ComponentCatalog";
import { ConfigurationPanel } from "../ConfigurationPanel/ConfigurationPanel";
import { FormCanvas } from "../FormCanvas/FormCanvas";
import styles from "./BuilderWorkspace.module.css";

type CompactPanel = "catalog" | "properties";
type MobilePanel = "catalog" | "canvas" | "properties";

interface BuilderWorkspaceProps {

  onOpenFormNameSettings?: () => void;
}

/**
 * Provides the breakpoint-specific compact and mobile workspace views. Their
 * active-panel choices stay local because no other builder section consumes
 * them; shared form data continues to live in the MobX builder store.
 */
export const BuilderWorkspace = memo(function BuilderWorkspace({ onOpenFormNameSettings }: BuilderWorkspaceProps) {
  const { t } = useTranslation("builderWorkspace");
  const { t: tCommon } = useTranslation("common");
  const [compactPanel, setCompactPanel] = useState<CompactPanel>("catalog");
  const [mobilePanel, setMobilePanel] = useState<MobilePanel>("canvas");

  return (
    <div className={styles.builderShell}>
      <nav className={styles.compactTabs} aria-label="Side panels">
        <JBTab
          value={compactPanel}
          onChange={(event: JBTabChangeEvent) => setCompactPanel(event.detail.value as CompactPanel)}
        >
          <JBTabList aria-label="Side panels">
            <JBTabTrigger value="catalog" color="primary">
              {tCommon("componentCatalog")}
            </JBTabTrigger>
            <JBTabTrigger value="properties" color="primary">
              {tCommon("properties")}
            </JBTabTrigger>
          </JBTabList>
        </JBTab>
      </nav>
      <nav className={styles.mobileTabs} aria-label="Mobile workspace panels">
        <JBTab
          value={mobilePanel}
          onChange={(event: JBTabChangeEvent) => setMobilePanel(event.detail.value as MobilePanel)}
        >
          <JBTabList aria-label="Mobile workspace panels" size="sm">
            <JBTabTrigger value="catalog" color="dark">
              {tCommon("componentCatalog")}
            </JBTabTrigger>
            <JBTabTrigger value="canvas" color="secondary-subtle">
              {t("formCanvas")}
            </JBTabTrigger>
            <JBTabTrigger value="properties" color="positive-subtle">
              {tCommon("properties")}
            </JBTabTrigger>
          </JBTabList>
        </JBTab>
      </nav>
      <div className={`${layoutStyles.workspace} ${styles.workspace}`} data-side-panel={compactPanel} data-mobile-panel={mobilePanel}>
        <ComponentCatalog onElementAdded={() => setMobilePanel("canvas")} />
        <FormCanvas
          onOpenFormNameSettings={onOpenFormNameSettings}
          onSelectElement={() => {
            setCompactPanel("properties");
          }}
          onConfigureElement={() => {
            setCompactPanel("properties");
            setMobilePanel("properties");
          }}
        />
        <ConfigurationPanel />
      </div>
    </div>
  );
});
