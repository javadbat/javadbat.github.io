import { memo, useState } from "react";
import { JBButton } from "jb-button/react";
import type { FormMessages } from "../i18n/locale-adapter";
import { ComponentCatalog } from "./ComponentCatalog";
import { ConfigurationPanel } from "./ConfigurationPanel";
import { FormCanvas } from "./FormCanvas";
import styles from "./BuilderApp.module.css";

type CompactPanel = "catalog" | "properties";
type MobilePanel = "catalog" | "canvas" | "properties";

interface BuilderWorkspaceProps {
  messages: FormMessages;
}

/**
 * Keeps the compact-layout tab choice local because no other builder section
 * consumes it. Shared form data continues to live in the MobX builder store.
 */
export const BuilderWorkspace = memo(function BuilderWorkspace({ messages }: BuilderWorkspaceProps) {
  const [compactPanel, setCompactPanel] = useState<CompactPanel>("catalog");
  const [mobilePanel, setMobilePanel] = useState<MobilePanel>("canvas");

  return (
    <div className={styles.builderShell}>
      <nav className={styles.compactTabs} aria-label="Side panels">
        <JBButton size="sm" variant={compactPanel === "catalog" ? "solid" : "ghost"} onClick={() => setCompactPanel("catalog")}>
          {messages.componentCatalog}
        </JBButton>
        <JBButton size="sm" variant={compactPanel === "properties" ? "solid" : "ghost"} onClick={() => setCompactPanel("properties")}>
          {messages.properties}
        </JBButton>
      </nav>
      <nav className={styles.mobileTabs} aria-label="Mobile workspace panels">
        <JBButton size="sm" variant={mobilePanel === "catalog" ? "solid" : "ghost"} aria-pressed={mobilePanel === "catalog" ? "true" : "false"} onClick={() => setMobilePanel("catalog")}>
          {messages.componentCatalog}
        </JBButton>
        <JBButton size="sm" variant={mobilePanel === "canvas" ? "solid" : "ghost"} aria-pressed={mobilePanel === "canvas" ? "true" : "false"} onClick={() => setMobilePanel("canvas")}>
          {messages.formCanvas}
        </JBButton>
        <JBButton size="sm" variant={mobilePanel === "properties" ? "solid" : "ghost"} aria-pressed={mobilePanel === "properties" ? "true" : "false"} onClick={() => setMobilePanel("properties")}>
          {messages.properties}
        </JBButton>
      </nav>
      <div className={styles.workspace} data-side-panel={compactPanel} data-mobile-panel={mobilePanel}>
        <ComponentCatalog messages={messages} onElementAdded={() => setMobilePanel("canvas")} />
        <FormCanvas messages={messages} onConfigureElement={() => setMobilePanel("properties")} />
        <ConfigurationPanel messages={messages} />
      </div>
    </div>
  );
});
