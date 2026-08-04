import { useEffect, useState } from "react";
import { observer } from "mobx-react-lite";
import { JBButton } from "jb-button/react";
import { JBInput } from "jb-input/react";
import { JBOption, JBSelect } from "jb-select/react";
import { ClientJBModal } from "../../../components/react/components/modal/ClientJBModal";
import { canonicalizeLocaleCode, inferLocaleDirection, type LocaleDefinition } from "../domain/form-document";
import { getStorageIssueMessage, type FormMessages } from "../i18n/locale-adapter";
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
  const [defaultLocale, setDefaultLocale] = useState(store.document.localization.defaultLocale);
  const [locales, setLocales] = useState<Record<string, LocaleDefinition>>({});
  const [newLocale, setNewLocale] = useState("");
  const [newLocaleDirection, setNewLocaleDirection] = useState<LocaleDefinition["direction"]>("ltr");
  const [localeError, setLocaleError] = useState("");
  const [slug, setSlug] = useState(store.document.slug ?? "");
  const [saveError, setSaveError] = useState("");

  useEffect(() => {
    if (isOpen) {
      setName(store.formName);
      setDefaultLocale(store.document.localization.defaultLocale);
      setLocales(structuredClone(store.document.localization.locales));
      setNewLocale("");
      setNewLocaleDirection("ltr");
      setLocaleError("");
      setSlug(store.document.slug ?? "");
      setSaveError("");
    }
  }, [isOpen, store]);

  const normalizedSlug = normalizeFormSlug(slug);
  const slugIsValid = slug.length === 0 || isValidFormSlug(normalizedSlug);

  const addLocale = () => {
    const normalized = canonicalizeLocaleCode(newLocale);
    if (!normalized) {
      setLocaleError(messages.localeInvalid);
      return;
    }
    if (locales[normalized]) {
      setLocaleError(messages.localeAlreadyAdded);
      return;
    }
    setLocales(current => ({ ...current, [normalized]: { direction: newLocaleDirection || inferLocaleDirection(normalized) } }));
    setNewLocale("");
    setLocaleError("");
  };

  const removeLocale = (locale: string) => {
    if (locale === defaultLocale || Object.keys(locales).length <= 1) {
      return;
    }
    setLocales(current => {
      const next = { ...current };
      delete next[locale];
      return next;
    });
  };

  const persist = async (saveAs: boolean) => {
    if (!slugIsValid || (saveAs && normalizedSlug.length === 0)) {
      setSaveError(messages.slugInvalid);
      return;
    }
    store.setFormLocalization({ defaultLocale, locales });
    store.updateFormName(name, defaultLocale);
    store.setEditingLocale(defaultLocale);
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
      <div slot="header" className={styles.modalHeading}>
        <p className={styles.eyebrow}>{messages.currentDraft}</p>
        <h2>{messages.formSettings}</h2>
      </div>
      <div slot="content" className={styles.modalContent}>
        <JBInput name="formName" label={messages.formName} value={name} onInput={event => setName(String((event.target as unknown as { value?: unknown }).value ?? ""))} />
        <JBInput
          name="formSlug"
          label={messages.slug}
          value={slug}
          message={normalizedSlug ? `${messages.slugPreview}: ${normalizedSlug}` : messages.slugOptional}
          onInput={event => setSlug(String((event.target as unknown as { value?: unknown }).value ?? ""))}
        />
        <JBSelect<string> name="defaultLocale" label={messages.defaultLocale} value={defaultLocale} onChange={event => setDefaultLocale(event.target.value)}>
          {Object.keys(locales).map(locale => <JBOption key={locale} value={locale}>{locale}</JBOption>)}
        </JBSelect>
        <div className={styles.localeEditor}>
          <p className={styles.modalDescription}>{messages.supportedLocales}</p>
          {Object.entries(locales).map(([locale, definition]) => (
            <div className={styles.localeRow} key={locale}>
              <strong>{locale}</strong>
              <JBSelect<LocaleDefinition["direction"]> name={`direction-${locale}`} label={messages.direction} value={definition.direction} onChange={event => setLocales(current => ({ ...current, [locale]: { direction: event.target.value === "rtl" ? "rtl" : "ltr" } }))}>
                <JBOption value="ltr">{messages.ltr}</JBOption>
                <JBOption value="rtl">{messages.rtl}</JBOption>
              </JBSelect>
              <JBButton variant="ghost" disabled={locale === defaultLocale || Object.keys(locales).length <= 1} onClick={() => removeLocale(locale)}>
                {messages.removeLocale}
              </JBButton>
            </div>
          ))}
          <div className={styles.localeRow}>
            <JBInput name="newLocale" label={messages.addLocale} value={newLocale} message={localeError || messages.localeCodeHint} onInput={event => setNewLocale(String((event.target as unknown as { value?: unknown }).value ?? ""))} />
            <JBSelect<LocaleDefinition["direction"]> name="newLocaleDirection" label={messages.direction} value={newLocaleDirection} onChange={event => setNewLocaleDirection(event.target.value === "rtl" ? "rtl" : "ltr")}>
              <JBOption value="ltr">{messages.ltr}</JBOption>
              <JBOption value="rtl">{messages.rtl}</JBOption>
            </JBSelect>
            <JBButton variant="outline" onClick={addLocale}>{messages.addLocale}</JBButton>
          </div>
        </div>
        <p className={styles.modalDescription}>{store.linkedRecord ? `${messages.linkedNamedForm}: ${store.linkedRecord.slug}` : messages.unnamedDraft}</p>
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
    </ClientJBModal>
  );
});
