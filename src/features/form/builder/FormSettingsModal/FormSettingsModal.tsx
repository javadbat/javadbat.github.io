import { observer } from "mobx-react-lite";
import { JBButton } from "jb-button/react";
import { JBInput } from "jb-input/react";
import { JBOption } from "jb-select/option/react";
import { JBSelect } from "jb-select/react";
import { ModalCloseButton } from "../../../../components/react/components/modal/ModalCloseButton";
import type { FormMessages } from "../../i18n/locale-adapter";
import modalStyles from "../../shell/FormModal.module.css";
import { LocaleEditor } from "./LocaleEditor";
import { copyLocaleDefinitions, useFormSettings } from "./useFormSettings";
import styles from "./FormSettingsModal.module.css";
import { JBModal } from "jb-modal/react";

interface FormSettingsModalProps {
  isOpen: boolean;
  focusFormName?: boolean;
  messages: FormMessages;
  onClose: () => void;
}

export { copyLocaleDefinitions };

export const FormSettingsModal = observer(function FormSettingsModal({ isOpen, focusFormName = false, messages, onClose }: FormSettingsModalProps) {
  const {
    store,
    name,
    setName,
    defaultLocale,
    setDefaultLocale,
    locales,
    setLocales,
    newLocale,
    setNewLocale,
    localeError,
    slug,
    setSlug,
    saveError,
    normalizedSlug,
    slugIsValid,
    addLocale,
    removeLocale,
    persist,
  } = useFormSettings(isOpen, messages, onClose);

  return (
    <JBModal className={modalStyles.formModal} isOpen={isOpen} label={messages.formSettings} autoCloseOnEscape autoCloseOnBackgroundClick onClose={onClose}>
      <div slot="header">
        <div className={styles.modalHeading}>
          <p className={styles.eyebrow}>{messages.currentDraft}</p>
          <h2>{messages.formSettings}</h2>
        </div>
        <ModalCloseButton label={messages.close} onClick={onClose} />
      </div>
      <div slot="content" className={styles.modalContent}>
        <section className={styles.settingsSection}>
          <JBInput
            name="formName"
            label={messages.formName}
            value={name}
            autoFocus={focusFormName}
            onInput={event => setName(String((event.target as unknown as { value?: unknown }).value ?? ""))}
          />
          <JBInput
            name="formSlug"
            label={messages.slug}
            value={slug}
            message={normalizedSlug ? `${messages.slugPreview}: ${normalizedSlug}` : messages.slugOptional}
            onInput={event => setSlug(String((event.target as unknown as { value?: unknown }).value ?? ""))}
          />
        </section>

        <section className={styles.settingsSection}>
          <JBSelect<string>
            name="defaultLocale"
            label={messages.defaultLocale}
            value={defaultLocale}
            onChange={event => setDefaultLocale(event.target.value)}
          >
            {Object.keys(locales).map(locale => (
              <JBOption key={locale} value={locale}>
                {locale}
              </JBOption>
            ))}
          </JBSelect>
          <LocaleEditor
            locales={locales}
            defaultLocale={defaultLocale}
            newLocale={newLocale}
            localeError={localeError}
            messages={messages}
            setLocales={setLocales}
            setNewLocale={setNewLocale}
            onAdd={addLocale}
            onRemove={removeLocale}
          />
        </section>
        <p className={styles.draftStatus}>{store.linkedRecord ? `${messages.linkedNamedForm}: ${store.linkedRecord.slug}` : messages.unnamedDraft}</p>
        {saveError ? (
          <p className={styles.fieldError} role="alert">
            {saveError}
          </p>
        ) : null}
      </div>
      <div slot="footer" className={styles.modalActions}>
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
    </JBModal>
  );
});
