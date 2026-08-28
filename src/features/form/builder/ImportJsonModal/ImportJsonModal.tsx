import { useEffect, useMemo, useRef, useState, type ChangeEvent } from "react";
import { JBButton } from "jb-button/react";
import { JBTextarea } from "jb-textarea/react";
import { ModalCloseButton } from "../../../../components/react/components/modal/ModalCloseButton";
import { prepareFormImport } from "./form-import";
import type { FormMessages } from "../../i18n/locale-adapter";
import modalStyles from "../../shell/FormModal.module.css";
import { useBuilderStore } from "../store/BuilderStoreContext";
import styles from "./ImportJsonModal.module.css";
import {JBModal} from 'jb-modal/react'
interface ImportJsonModalProps {
  isOpen: boolean;
  messages: FormMessages;
  onClose: () => void;
}

export function ImportJsonModal({ isOpen, messages, onClose }: ImportJsonModalProps) {
  const store = useBuilderStore();
  const [json, setJson] = useState("");
  const [fileName, setFileName] = useState("");
  const [fileError, setFileError] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!isOpen) return;
    setJson("");
    setFileName("");
    setFileError("");
  }, [isOpen]);

  const validation = useMemo(() => (json.trim() ? prepareFormImport(json) : null), [json]);

  const chooseFile = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.currentTarget.files?.[0];
    event.currentTarget.value = "";
    if (!file) return;
    setFileName(file.name);
    try {
      setJson(await file.text());
      setFileError("");
    } catch (cause) {
      setJson("");
      setFileError(cause instanceof Error ? cause.message : messages.importFailure);
    }
  };

  const importDocument = () => {
    if (!validation?.valid || !store.importDocument(validation.document)) return;
    store.announce(messages.importSuccess);
    onClose();
  };

  return (
    <JBModal className={modalStyles.formModal} isOpen={isOpen} label={messages.importJson} autoCloseOnEscape autoCloseOnBackgroundClick onClose={onClose}>
      <div slot="header">
        <div className={styles.modalHeading}>
          <p className={styles.eyebrow}>{messages.portableFormDocument}</p>
          <h2>{messages.importJson}</h2>
        </div>
        <ModalCloseButton label={messages.close} onClick={onClose} />
      </div>

      <div slot="content" className={styles.modalContent}>
        <p className={styles.description}>{messages.importDescription}</p>
        <JBTextarea
          className={styles.jsonInput}
          name="importJson"
          label={messages.pasteJson}
          placeholder={messages.pasteJsonPlaceholder}
          value={json}
          autoFocus
          onInput={event => {
            setJson(String((event.target as unknown as { value?: unknown }).value ?? ""));
            setFileName("");
            setFileError("");
          }}
        />

        <div className={styles.fileChooser}>
          <JBButton variant="outline" onClick={() => fileInputRef.current?.click()}>
            {messages.chooseJsonFile}
          </JBButton>
          {fileName ? <span>{fileName}</span> : null}
          <input ref={fileInputRef} className={styles.fileInput} type="file" accept="application/json,.json" onChange={event => void chooseFile(event)} />
        </div>

        {fileError ? (
          <p className={styles.errorStatus} role="alert">
            {messages.importFailure} {fileError}
          </p>
        ) : validation?.valid ? (
          <p className={styles.validStatus} role="status">
            {messages.jsonSchemaValid}
          </p>
        ) : validation ? (
          <div className={styles.invalidStatus} role="alert">
            <strong>{messages.importFailure}</strong>
            <ul>
              {validation.issues.map(issue => (
                <li key={`${issue.path}:${issue.code}`}>
                  <code>{issue.path}</code>
                  <span>{issue.message}</span>
                </li>
              ))}
            </ul>
          </div>
        ) : null}
      </div>

      <div slot="footer" className={styles.modalActions}>
        <JBButton variant="ghost" onClick={onClose}>
          {messages.cancel}
        </JBButton>
        <JBButton color="primary" disabled={!validation?.valid} onClick={importDocument}>
          {messages.importDocument}
        </JBButton>
      </div>
    </JBModal>
  );
}
