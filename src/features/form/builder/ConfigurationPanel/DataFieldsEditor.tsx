import { useTranslation } from "react-i18next";
import { observer } from "mobx-react-lite";
import { useRef, useState } from "react";
import { JBInput } from "jb-input/react";
import { JBButton } from "jb-button/react";
import { JBModal } from "jb-modal/react";
import { ModalCloseButton } from "../../../../components/react/components/modal/ModalCloseButton";
import { JBCollapse } from "jb-collapse/react";
import { useBuilderStore } from "../store/BuilderStoreContext";
import { inputValue } from "./configuration-values";
import styles from "./ConfigurationPanel.module.css";
import modalStyles from "../../shell/FormModal.module.css";

interface DataFieldsEditorProps {

}

export const DataFieldsEditor = observer(function DataFieldsEditor({ }: DataFieldsEditorProps) {
  const { t: tCommon } = useTranslation("common");
  const { t } = useTranslation("configurationPanel");
  const store = useBuilderStore();
  const element = store.selectedElement;
  const [uploadHelpOpen, setUploadHelpOpen] = useState(false);
  const lastNonEmptyName = useRef<{ elementId: string; value: string } | null>(null);
  if (!element) return null;

  const nameError = store.getElementNameError(element.id);
  if (lastNonEmptyName.current?.elementId !== element.id) {
    lastNonEmptyName.current = { elementId: element.id, value: element.name };
  } else if (element.name !== "") {
    lastNonEmptyName.current.value = element.name;
  }

  return (
    <>
    <JBCollapse title={t("dataSettings")} defaultOpen={false}>
      <JBInput
        size="sm"
        id={`element-name-${element.id}`}
        name="elementName"
        label={t("elementName")}
        value={element.name}
        error={nameError === "required" ? t("nameRequired") : nameError === "invalid" ? t("nameInvalid") : undefined}
        aria-invalid={nameError !== null}
        onInput={event => store.updateSelectedElement({ name: inputValue(event as unknown as Event) })}
        onBlur={event => {
          if (inputValue(event as unknown as Event) === "" && lastNonEmptyName.current) {
            store.updateSelectedElement({ name: lastNonEmptyName.current.value });
          }
        }}
        message={t("elementNameDescription")}
      />
      {element.type === "jb-file-input" || element.type === "jb-image-input" ? (
        <div className={styles.integrationField}>
          <JBInput
            size="sm"
            name="prop-uploadEndpoint"
            label={t("uploadEndpoint")}
            type="url"
            value={typeof element.props.uploadEndpoint === "string" ? element.props.uploadEndpoint : ""}
            placeholder={t("uploadEndpointPlaceholder")}
            message={t("uploadEndpointDescription")}
            onInput={event => {
              const value = inputValue(event as unknown as Event).trim();
              store.updateSelectedProp("uploadEndpoint", value === "" ? undefined : value);
            }}
          />
          <JBButton className={styles.integrationInfoButton} variant="ghost" size="sm" square aria-label={t("uploadEndpointInfo")} onClick={() => setUploadHelpOpen(true)}>ℹ️</JBButton>
        </div>
      ) : null}
    </JBCollapse>
    {element.type === "jb-file-input" || element.type === "jb-image-input" ? (
      <JBModal className={modalStyles.formModal} isOpen={uploadHelpOpen} label={t("fileUploadHelpTitle")} autoCloseOnEscape autoCloseOnBackgroundClick onClose={() => setUploadHelpOpen(false)}>
        <div slot="header"><h2>{t("fileUploadHelpTitle")}</h2><ModalCloseButton label={tCommon("close")} onClick={() => setUploadHelpOpen(false)} /></div>
        <div slot="content" className={styles.uploadHelpContent}>
          <p>{t("fileUploadHelpDescription")}</p>
          <ol><li>{t("fileUploadHelpStepOne")}</li><li>{t("fileUploadHelpStepTwo")}</li><li>{t("fileUploadHelpStepThree")}</li></ol>
          <code>POST /your-upload-endpoint · multipart/form-data · file</code>
        </div>
      </JBModal>
    ) : null}
    </>
  );
});
