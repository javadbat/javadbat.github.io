import { memo, useState } from "react";
import { JBButton } from "jb-button/react";
import type { FormMessages } from "../i18n/locale-adapter";
import { ComponentCatalog } from "./ComponentCatalog";
import { ConfigurationPanel } from "./ConfigurationPanel";
import { FormCanvas } from "./FormCanvas";
import styles from "./BuilderApp.module.css";

type CompactPanel = "catalog" | "properties";

interface BuilderWorkspaceProps {
  messages: FormMessages;
}

/**
 * Keeps the compact-layout tab choice local because no other builder section
 * consumes it. Shared form data continues to live in the MobX builder store.
 */
export const BuilderWorkspace = memo(function BuilderWorkspace({ messages }: BuilderWorkspaceProps) {
  const [compactPanel, setCompactPanel] = useState<CompactPanel>("catalog");

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
      <div className={styles.workspace} data-side-panel={compactPanel}>
        <ComponentCatalog messages={messages} />
        <FormCanvas messages={messages} />
        <ConfigurationPanel messages={messages} />
      </div>
    </div>
  );
});
