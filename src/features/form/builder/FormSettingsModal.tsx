import { useEffect, useState } from "react";
import { observer } from "mobx-react-lite";
import { JBButton } from "jb-button/react";
import { JBInput } from "jb-input/react";
import { JBOption, JBSelect } from "jb-select/react";
import { ClientJBModal } from "../../../components/react/components/modal/ClientJBModal";
import { getStorageIssueMessage, type FormAppLocale, type FormMessages } from "../i18n/locale-adapter";
import { isValidFormSlug, normalizeFormSlug } from "../application/form-slug";
import { useBuilderStore } from "./BuilderStoreContext";
import styles from "./BuilderApp.module.css";

interface FormSettingsModalProps {
  isOpen: boolean;
  messages: FormMessages;
  onClose: () => void;
}

export const FormSettingsModal = observer(function FormSettingsModal({ isOpen, messages, onClose }: FormSettingsModalProps) {
  const store = useBuilderStore();
  const [name, setName] = useState(store.formName);
  const [formLocale, setFormLocale] = useState<FormAppLocale>(store.document.localization.defaultLocale === "fa" ? "fa" : "en");
  const [slug, setSlug] = useState(store.document.slug ?? "");
  const [saveError, setSaveError] = useState("");

  useEffect(() => {
    if (isOpen) {
      setName(store.formName);
      setFormLocale(store.document.localization.defaultLocale === "fa" ? "fa" : "en");
      setSlug(store.document.slug ?? "");
      setSaveError("");
    }
  }, [isOpen, store]);

  const normalizedSlug = normalizeFormSlug(slug);
  const slugIsValid = slug.length === 0 || isValidFormSlug(normalizedSlug);

  const persist = async (saveAs: boolean) => {
    if (!slugIsValid || (saveAs && normalizedSlug.length === 0)) {
      setSaveError(messages.slugInvalid);
      return;
    }
    store.updateFormName(name, formLocale);
    store.setFormLocale(formLocale);
    const saved = await store.save({
      slug: normalizedSlug || undefined,
      saveAs,
    });
    if (saved) {
      onClose();
    } else {
      setSaveError(getStorageIssueMessage(messages, store.storageIssue));
    }
  };

  return (
    <ClientJBModal isOpen={isOpen} label={messages.formSettings} autoCloseOnEscape autoCloseOnBackgroundClick onClose={onClose}>
      <div className={styles.modalContent}>
        <div className={styles.modalHeading}>
          <p className={styles.eyebrow}>{messages.currentDraft}</p>
          <h2>{messages.formSettings}</h2>
        </div>
        <JBInput name="formName" label={messages.formName} value={name} onInput={event => setName(String((event.target as unknown as { value?: unknown }).value ?? ""))} />
        <JBInput
          name="formSlug"
          label={messages.slug}
          value={slug}
          message={normalizedSlug ? `${messages.slugPreview}: ${normalizedSlug}` : messages.slugOptional}
          onInput={event => setSlug(String((event.target as unknown as { value?: unknown }).value ?? ""))}
        />
        <JBSelect<FormAppLocale> name="formLocale" label={messages.locale} value={formLocale} onChange={event => setFormLocale(event.target.value === "fa" ? "fa" : "en")}>
          <JBOption value="en">{messages.english}</JBOption>
          <JBOption value="fa">{messages.persian}</JBOption>
        </JBSelect>
        <p className={styles.modalDescription}>{store.linkedRecord ? `${messages.linkedNamedForm}: ${store.linkedRecord.slug}` : messages.unnamedDraft}</p>
        {saveError ? (
          <p className={styles.fieldError} role="alert">
            {saveError}
          </p>
        ) : null}
        <div className={styles.modalActions}>
          <JBButton variant="ghost" onClick={onClose}>
            {messages.cancel}
          </JBButton>
          <JBButton variant="outline" disabled={store.status === "saving" || !slugIsValid || normalizedSlug.length === 0} onClick={() => void persist(true)}>
            {messages.saveAs}
          </JBButton>
          <JBButton color="primary" disabled={store.status === "saving" || !slugIsValid} onClick={() => void persist(false)}>
            {store.status === "saving" ? messages.saving : messages.save}
          </JBButton>
        </div>
      </div>
    </ClientJBModal>
  );
});
