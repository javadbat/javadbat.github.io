import { observer } from "mobx-react-lite";
import { useRef, useState } from "react";
import { JBInput } from "jb-input/react";
import { JBButton } from "jb-button/react";
import { JBModal } from "jb-modal/react";
import { ModalCloseButton } from "../../../../components/react/components/modal/ModalCloseButton";
import { JBCollapse } from "jb-collapse/react";
import type { FormMessages } from "../../i18n/locale-adapter";
import { useBuilderStore } from "../store/BuilderStoreContext";
import { inputValue } from "./configuration-values";
import styles from "./ConfigurationPanel.module.css";
import modalStyles from "../../shell/FormModal.module.css";

interface DataFieldsEditorProps {
  messages: FormMessages;
}

export const DataFieldsEditor = observer(function DataFieldsEditor({ messages }: DataFieldsEditorProps) {
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
    <JBCollapse title={messages.dataSettings} defaultOpen={false}>
      <JBInput
        size="sm"
        id={`element-name-${element.id}`}
        name="elementName"
        label={messages.elementName}
        value={element.name}
        error={nameError === "required" ? messages.nameRequired : nameError === "invalid" ? messages.nameInvalid : undefined}
        aria-invalid={nameError !== null}
        onInput={event => store.updateSelectedElement({ name: inputValue(event as unknown as Event) })}
        onBlur={event => {
          if (inputValue(event as unknown as Event) === "" && lastNonEmptyName.current) {
            store.updateSelectedElement({ name: lastNonEmptyName.current.value });
          }
        }}
        message={messages.elementNameDescription}
      />
      {element.type === "jb-file-input" || element.type === "jb-image-input" ? (
        <div className={styles.integrationField}>
          <JBInput
            size="sm"
            name="prop-uploadEndpoint"
            label={messages.uploadEndpoint}
            type="url"
            value={typeof element.props.uploadEndpoint === "string" ? element.props.uploadEndpoint : ""}
            placeholder={messages.uploadEndpointPlaceholder}
            message={messages.uploadEndpointDescription}
            onInput={event => {
              const value = inputValue(event as unknown as Event).trim();
              store.updateSelectedProp("uploadEndpoint", value === "" ? undefined : value);
            }}
          />
          <JBButton className={styles.integrationInfoButton} variant="ghost" size="sm" square aria-label={messages.uploadEndpointInfo} onClick={() => setUploadHelpOpen(true)}>ℹ️</JBButton>
        </div>
      ) : null}
    </JBCollapse>
    {element.type === "jb-file-input" || element.type === "jb-image-input" ? (
      <JBModal className={modalStyles.formModal} isOpen={uploadHelpOpen} label={messages.fileUploadHelpTitle} autoCloseOnEscape autoCloseOnBackgroundClick onClose={() => setUploadHelpOpen(false)}>
        <div slot="header"><h2>{messages.fileUploadHelpTitle}</h2><ModalCloseButton label={messages.close} onClick={() => setUploadHelpOpen(false)} /></div>
        <div slot="content" className={styles.uploadHelpContent}>
          <p>{messages.fileUploadHelpDescription}</p>
          <ol><li>{messages.fileUploadHelpStepOne}</li><li>{messages.fileUploadHelpStepTwo}</li><li>{messages.fileUploadHelpStepThree}</li></ol>
          <code>POST /your-upload-endpoint · multipart/form-data · file</code>
        </div>
      </JBModal>
    ) : null}
    </>
  );
});
