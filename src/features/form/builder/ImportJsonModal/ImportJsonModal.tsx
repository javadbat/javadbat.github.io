import { useTranslation } from "react-i18next";
import { useEffect, useMemo, useRef, useState, type ChangeEvent } from "react";
import { JBButton } from "jb-button/react";
import { JBTextarea } from "jb-textarea/react";
import { ModalCloseButton } from "../../../../components/react/components/modal/ModalCloseButton";
import { prepareFormImport } from "./form-import";
import modalStyles from "../../shell/FormModal.module.css";
import { useBuilderStore } from "../store/BuilderStoreContext";
import styles from "./ImportJsonModal.module.css";
import {JBModal} from 'jb-modal/react'
interface ImportJsonModalProps {
  isOpen: boolean;

  onClose: () => void;
}

export function ImportJsonModal({ isOpen, onClose }: ImportJsonModalProps) {
  const { t: tCommon } = useTranslation("common");
  const { t } = useTranslation("importJsonModal");
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
      setFileError(cause instanceof Error ? cause.message : t("importFailure"));
    }
  };

  const importDocument = () => {
    if (!validation?.valid || !store.importDocument(validation.document)) return;
    store.announce(t("importSuccess"));
    onClose();
  };

  return (
    <JBModal className={modalStyles.formModal} isOpen={isOpen} label={tCommon("importJson")} autoCloseOnEscape autoCloseOnBackgroundClick onClose={onClose}>
      <div slot="header">
        <div className={styles.modalHeading}>
          <p className={styles.eyebrow}>{tCommon("portableFormDocument")}</p>
          <h2>{tCommon("importJson")}</h2>
        </div>
        <ModalCloseButton label={tCommon("close")} onClick={onClose} />
      </div>

      <div slot="content" className={styles.modalContent}>
        <p className={styles.description}>{t("importDescription")}</p>
        <JBTextarea
          className={styles.jsonInput}
          name="importJson"
          label={t("pasteJson")}
          placeholder={t("pasteJsonPlaceholder")}
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
            {t("chooseJsonFile")}
          </JBButton>
          {fileName ? <span>{fileName}</span> : null}
          <input ref={fileInputRef} className={styles.fileInput} type="file" accept="application/json,.json" onChange={event => void chooseFile(event)} />
        </div>

        {fileError ? (
          <p className={styles.errorStatus} role="alert">
            {t("importFailure")} {fileError}
          </p>
        ) : validation?.valid ? (
          <p className={styles.validStatus} role="status">
            {t("jsonSchemaValid")}
          </p>
        ) : validation ? (
          <div className={styles.invalidStatus} role="alert">
            <strong>{t("importFailure")}</strong>
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
          {tCommon("cancel")}
        </JBButton>
        <JBButton color="primary" disabled={!validation?.valid} onClick={importDocument}>
          {t("importDocument")}
        </JBButton>
      </div>
    </JBModal>
  );
}
