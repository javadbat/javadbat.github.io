import { formPageHref, getCurrentFormSlug } from "../application/form-page-url";
import { useStoredForm } from "../application/use-stored-form";
import { getLocalizedText } from "../domain/form-document";
import { useFormLocale } from "../i18n/locale-adapter";
import { FormRouteBrand, FormRouteHeader, FormRouteLinkButton } from "../layout/FormRouteHeader";
import styles from "../shell/RouteShell.module.css";

export function DesignerPlaceholderApp() {
  const { locale, direction, messages } = useFormLocale("en");
  const slug = getCurrentFormSlug();
  const resolution = useStoredForm(slug);
  const formName = resolution.status === "ready"
    ? getLocalizedText(resolution.document.metadata.name, locale, resolution.document.localization.defaultLocale)
    : "";

  return (
    <div className={styles.page} dir={direction}>
      <FormRouteHeader className={styles.topbar}>
        <FormRouteBrand href={formPageHref("landing")} title={messages.productName} subtitle={messages.designer} />
        <div className={styles.topActions}>
          <FormRouteLinkButton href={formPageHref("builder", slug)}>
            {messages.builder}
          </FormRouteLinkButton>
          <FormRouteLinkButton href={formPageHref("preview", slug)} variant="outline">
            {messages.preview}
          </FormRouteLinkButton>
        </div>
      </FormRouteHeader>
      <main className={styles.placeholder}>
        <div className={styles.placeholderCard} aria-hidden="true">
          <span />
        </div>
        <p className={styles.eyebrow}>{messages.phaseOne}</p>
        <h1>{messages.emptyDesigner}</h1>
        <p className={styles.placeholderDescription}>
          {resolution.status === "loading"
            ? messages.loadingForms
            : resolution.status === "error"
              ? messages.storageUnavailable
              : resolution.status === "not-found"
                ? messages.unknownForm
                : resolution.status === "empty"
                  ? messages.noSavedDraft
                  : `${messages.emptyDesignerDescription} ${messages.formName}: ${formName}.`}
        </p>
      </main>
    </div>
  );
}
