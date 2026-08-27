import { useEffect, useMemo, useRef, useState } from "react";
import { JBButton } from "jb-button/react";
import { formRouteHref } from "../application/form-route";
import { getLocalizedText } from "../domain/form-document";
import { useFormLocale, type FormAppLocale } from "../i18n/locale-adapter";
import { formRepository } from "../storage/form-repository";
import type { CurrentDraftRecordV1, StoredFormRecordV1 } from "../storage/storage-types";
import styles from "../shell/RouteShell.module.css";
import { defineJBFormDelete } from "../../../../packages/jb-form-delete/src/index";

defineJBFormDelete();

export function FormLandingApp() {
  const { locale, direction, setLocale, messages } = useFormLocale("en");
  const [forms, setForms] = useState<StoredFormRecordV1[]>([]);
  const [draft, setDraft] = useState<CurrentDraftRecordV1 | null>(null);
  const [storageState, setStorageState] = useState<"loading" | "ready" | "error">("loading");
  const savedFormsRef = useRef<HTMLElement>(null);
  const dateFormatter = useMemo(
    () =>
      new Intl.DateTimeFormat(locale, {
        dateStyle: "medium",
        timeStyle: "short",
      }),
    [locale],
  );

  const navigate = (path: string) => window.location.assign(path);

  useEffect(() => {
    const container = savedFormsRef.current;
    if (!container) return;
    const handleDelete = (event: Event) => {
      const formId = (event as CustomEvent<{ formId?: string }>).detail?.formId;
      const record = forms.find(form => form.id === formId);
      if (record) void deleteForm(record);
    };
    container.addEventListener("delete-request", handleDelete);
    return () => container.removeEventListener("delete-request", handleDelete);
  }, [forms]);

  const deleteForm = async (record: StoredFormRecordV1) => {
    if (!window.confirm(`${messages.deleteFormConfirm}\n\n${getLocalizedText(record.document.metadata.name, locale, record.document.localization.defaultLocale)}`)) return;
    const result = await formRepository.deleteNamedForm(record.id);
    if (result.ok) {
      setForms(current => current.filter(form => form.id !== record.id));
      setDraft(current => current?.linkedFormId === record.id ? null : current);
    } else {
      setStorageState("error");
    }
  };

  useEffect(() => {
    let active = true;
    Promise.all([formRepository.listNamedForms(), formRepository.getCurrentDraft()]).then(([formResult, draftResult]) => {
      if (!active) {
        return;
      }
      if (!formResult.ok || !draftResult.ok) {
        setStorageState("error");
        return;
      }
      setForms(formResult.value);
      setDraft(draftResult.value);
      setStorageState("ready");
    });
    return () => {
      active = false;
    };
  }, []);

  return (
    <div className={styles.page} dir={direction}>
      <header className={styles.topbar}>
        <a className={styles.brand} href={formRouteHref("landing")}>
          <span className={styles.brandMark}>JB</span>
          <span>
            <strong>{messages.productName}</strong>
            <small>{messages.phaseOne}</small>
          </span>
        </a>
        <div className={styles.topActions}>
          <JBButton size="sm" variant="ghost" onClick={() => setLocale((locale === "en" ? "fa" : "en") as FormAppLocale)}>
            {locale === "en" ? "FA" : "EN"}
          </JBButton>
          <JBButton size="sm" variant="ghost" onClick={() => navigate(formRouteHref("builder"))}>
            {draft ? messages.continueDraft : messages.createForm}
          </JBButton>
        </div>
      </header>

      <main className={styles.hero}>
        <section>
          <p className={styles.eyebrow}>
            {messages.phaseOne} · {messages.editorReady}
          </p>
          <h1>{messages.formHomeTitle}</h1>
          <p className={styles.heroDescription}>{messages.formHomeDescription}</p>
          <div className={styles.heroActions}>
            <JBButton color="primary" size="lg" onClick={() => navigate(formRouteHref("builder"))}>
              {draft ? messages.continueDraft : messages.createForm}
            </JBButton>
            <JBButton variant="outline" size="lg" onClick={() => navigate(formRouteHref("preview"))}>
              {messages.preview}
            </JBButton>
          </div>
        </section>

        <div className={styles.formPreviewCard} aria-hidden="true">
          <div className={styles.previewToolbar}>
            <i />
            <i />
            <i />
          </div>
          <div className={styles.previewSurface}>
            <span className={styles.previewLine} />
            <span className={styles.previewField} />
            <span className={styles.previewField} />
            <span className={styles.previewField} />
            <span className={styles.previewButton} />
          </div>
        </div>
      </main>

      <section ref={savedFormsRef} className={styles.savedForms} aria-labelledby="saved-forms-title">
        <div className={styles.savedFormsHeading}>
          <div>
            <p className={styles.eyebrow}>{messages.currentDraft}</p>
            <h2 id="saved-forms-title">{messages.savedForms}</h2>
          </div>
          <span>{forms.length}</span>
        </div>

        {storageState === "loading" ? (
          <output className={styles.savedFormsState}>{messages.loadingForms}</output>
        ) : storageState === "error" ? (
          <p className={styles.savedFormsState} role="alert">
            {messages.storageUnavailable}
          </p>
        ) : forms.length === 0 ? (
          <p className={styles.savedFormsState}>{messages.noSavedForms}</p>
        ) : (
          <ul className={styles.savedFormGrid}>
            {forms.map(record => (
              <li className={styles.savedFormCard} key={record.id}>
                <div>
                  <strong>{getLocalizedText(record.document.metadata.name, locale, record.document.localization.defaultLocale)}</strong>
                  <code>{record.slug}</code>
                </div>
                <p>
                  {record.document.elements.length} {record.document.elements.length === 1 ? messages.field : messages.fields}
                  {" · "}
                  {messages.updated} {dateFormatter.format(new Date(record.updatedAt))}
                </p>
                <div className={styles.savedFormActions}>
                  <JBButton size="sm" variant="outline" onClick={() => navigate(formRouteHref("builder", record.slug))}>
                    {messages.loadForm}
                  </JBButton>
                  <JBButton size="sm" variant="ghost" onClick={() => navigate(formRouteHref("preview", record.slug))}>
                    {messages.preview}
                  </JBButton>
                  <jb-form-delete form-id={record.id} label={messages.deleteForm} />
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
