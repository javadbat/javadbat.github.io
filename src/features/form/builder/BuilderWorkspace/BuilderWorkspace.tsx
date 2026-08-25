import { memo, useState } from "react";
import type { JBTabChangeEvent } from "jb-tab";
import { JBTab } from "jb-tab/react";
import { JBTabList } from "jb-tab/list/react";
import { JBTabTrigger } from "jb-tab/trigger/react";
import type { FormMessages } from "../../i18n/locale-adapter";
import { ComponentCatalog } from "../ComponentCatalog/ComponentCatalog";
import { ConfigurationPanel } from "../ConfigurationPanel/ConfigurationPanel";
import { FormCanvas } from "../FormCanvas/FormCanvas";
import styles from "./BuilderWorkspace.module.css";

type CompactPanel = "catalog" | "properties";
type MobilePanel = "catalog" | "canvas" | "properties";

interface BuilderWorkspaceProps {
  messages: FormMessages;
  onOpenFormNameSettings?: () => void;
}

/**
 * Provides the breakpoint-specific compact and mobile workspace views. Their
 * active-panel choices stay local because no other builder section consumes
 * them; shared form data continues to live in the MobX builder store.
 */
export const BuilderWorkspace = memo(function BuilderWorkspace({ messages, onOpenFormNameSettings }: BuilderWorkspaceProps) {
  const [compactPanel, setCompactPanel] = useState<CompactPanel>("catalog");
  const [mobilePanel, setMobilePanel] = useState<MobilePanel>("canvas");

  return (
    <div className={styles.builderShell}>
      <nav aria-label="Side panels">
        <JBTab value={compactPanel} onChange={(event: JBTabChangeEvent) => setCompactPanel(event.detail.value as CompactPanel)} className={styles.compactTabs}>
          <JBTabList aria-label="Side panels">
            <JBTabTrigger value="catalog" color="primary">{messages.componentCatalog}</JBTabTrigger>
            <JBTabTrigger value="properties" color="primary">{messages.properties}</JBTabTrigger>
          </JBTabList>
        </JBTab>
      </nav>
      <nav aria-label="Mobile workspace panels">
        <JBTab value={mobilePanel} onChange={(event: JBTabChangeEvent) => setMobilePanel(event.detail.value as MobilePanel)} className={styles.mobileTabs}>
          <JBTabList aria-label="Mobile workspace panels" size="sm">
            <JBTabTrigger value="catalog" color="primary">{messages.componentCatalog}</JBTabTrigger>
            <JBTabTrigger value="canvas" color="primary">{messages.formCanvas}</JBTabTrigger>
            <JBTabTrigger value="properties" color="primary">{messages.properties}</JBTabTrigger>
          </JBTabList>
        </JBTab>
      </nav>
      <div className={styles.workspace} data-side-panel={compactPanel} data-mobile-panel={mobilePanel}>
        <ComponentCatalog messages={messages} onElementAdded={() => setMobilePanel("canvas")} />
        <FormCanvas
          messages={messages}
          onOpenFormNameSettings={onOpenFormNameSettings}
          onSelectElement={() => {
            setCompactPanel("properties");
          }}
          onConfigureElement={() => {
            setCompactPanel("properties");
            setMobilePanel("properties");
          }}
        />
        <ConfigurationPanel messages={messages} />
      </div>
    </div>
  );
});
