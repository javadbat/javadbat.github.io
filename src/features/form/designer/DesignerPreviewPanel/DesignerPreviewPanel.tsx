import { observer } from "mobx-react-lite";
import type { CSSProperties, RefObject } from "react";
import type { JBTabChangeEvent } from "jb-tab";
import { JBTab } from "jb-tab/react";
import { JBTabList } from "jb-tab/list/react";
import { JBTabTrigger } from "jb-tab/trigger/react";
import { JBOption } from "jb-select/option/react";
import { JBSelect } from "jb-select/react";
import { JBFormBuilder } from "jb-form-builder/react";
import { loadDependencies } from "jb-form-builder/dependency-loader";
import type { JBFormBuilderElement } from "jb-form-builder/types";
import type { ThemeConfigV1 } from "jb-form-builder/contract/theme";
import type { FormAppDirection, FormMessages } from "../../i18n/locale-adapter";
import type { JBFormDocumentV1 } from "../../domain/form-document";
import layoutStyles from "../../layout/FormRouteLayout.module.css";
import { useDesignerUiStore, type DesignerPreviewSource, type PreviewViewport } from "../state/DesignerUiStore";
import styles from "./DesignerPreviewPanel.module.css";

export interface DesignerPreviewPanelProps {
  rendererRef: RefObject<JBFormBuilderElement | null>;
  storedFormName?: string;
  previewThemeStyle: CSSProperties;
  backdropStyle: CSSProperties;
  previewDirection: FormAppDirection;
  previewName: string;
  previewDescription?: string;
  previewDocument: JBFormDocumentV1;
  rendererTheme: ThemeConfigV1;
  previewLocale: string;
  messages: FormMessages;
}

export const DesignerPreviewPanel = observer(function DesignerPreviewPanel({
  rendererRef,
  storedFormName,
  previewThemeStyle,
  backdropStyle,
  previewDirection,
  previewName,
  previewDescription,
  previewDocument,
  rendererTheme,
  previewLocale,
  messages,
}: DesignerPreviewPanelProps) {
  const ui = useDesignerUiStore();

  return (
    <section className={`${layoutStyles.panel} ${styles.previewPanel}`} data-designer-panel="preview">
      <header className={styles.previewToolbar}>
        <div className={styles.previewPicker}>
          <span>{messages.designerPreviewing}</span>
          <JBSelect<string>
            size="sm"
            popoverPosition="fixed"
            value={ui.previewSource}
            hideClear
            onChange={event => {
              ui.setPreviewSource(String(event.target.value) as DesignerPreviewSource);
              rendererRef.current?.reset();
            }}
          >
            <JBOption value="sample">{messages.designerSampleForm}</JBOption>
            {storedFormName ? <JBOption value="stored">{storedFormName}</JBOption> : null}
          </JBSelect>
        </div>
        <div className={styles.previewTools}>
          <JBTab className={styles.previewViewportTabs} value={ui.viewport} onChange={(event: JBTabChangeEvent) => ui.setViewport(event.detail.value as PreviewViewport)}>
            <JBTabList size="sm" aria-label={messages.designerPreviewWidth}>
              <JBTabTrigger value="desktop" color="primary">{messages.designerDesktop}</JBTabTrigger>
              <JBTabTrigger value="tablet" color="primary">{messages.designerTablet}</JBTabTrigger>
              <JBTabTrigger value="mobile" color="primary">{messages.designerMobile}</JBTabTrigger>
            </JBTabList>
          </JBTab>
        </div>
      </header>

      <div className={styles.previewStage} style={previewThemeStyle}>
        <div className={styles.previewBackdrop} style={backdropStyle} />
        <div className={ui.viewport === "mobile" ? styles.previewMobile : ui.viewport === "tablet" ? styles.previewTablet : styles.previewDesktop}>
          <div className={styles.formPreview} dir={previewDirection}>
            <img className={styles.emblem} src="/form/theme-patterns/science-club-emblem.png" alt="" />
            <h1>{previewName}</h1>
            {previewDescription ? <p>{previewDescription}</p> : null}
            <div className={styles.rendererWrap}>
              <JBFormBuilder
                ref={rendererRef}
                formDocument={previewDocument}
                themeConfig={rendererTheme}
                locale={previewLocale}
                aria-label={`${previewName} ${messages.designerPreview}`}
                loadDependencies={loadDependencies}
              />
            </div>
            <small className={styles.privacyNote}>{messages.designerPrivacy}</small>
          </div>
        </div>
      </div>
    </section>
  );
});
