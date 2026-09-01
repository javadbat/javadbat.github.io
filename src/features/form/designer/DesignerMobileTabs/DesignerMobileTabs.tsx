import { observer } from "mobx-react-lite";
import type { JBTabChangeEvent } from "jb-tab";
import { JBTab } from "jb-tab/react";
import { JBTabList } from "jb-tab/list/react";
import { JBTabTrigger } from "jb-tab/trigger/react";
import type { FormMessages } from "../../i18n/locale-adapter";
import { useDesignerUiStore, type DesignerMobilePanel } from "../state/DesignerUiStore";
import styles from "./DesignerMobileTabs.module.css";

export const DesignerMobileTabs = observer(function DesignerMobileTabs({ messages }: { messages: FormMessages }) {
  const ui = useDesignerUiStore();

  return (
    <nav className={styles.mobileTabs} aria-label={messages.designerMobilePanels}>
      <JBTab value={ui.mobilePanel} onChange={(event: JBTabChangeEvent) => ui.setMobilePanel(event.detail.value as DesignerMobilePanel)}>
        <JBTabList size="sm" aria-label={messages.designerMobilePanels}>
          <JBTabTrigger value="design" color="primary">{messages.designerDesign}</JBTabTrigger>
          <JBTabTrigger value="preview" color="primary">{messages.designerPreview}</JBTabTrigger>
        </JBTabList>
      </JBTab>
    </nav>
  );
});
