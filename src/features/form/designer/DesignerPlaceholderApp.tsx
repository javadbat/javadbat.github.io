import { JBButton } from "jb-button/react";
import { formRouteHref, getCurrentFormRoute } from "../application/form-route";
import { useStoredForm } from "../application/use-stored-form";
import { getLocalizedText } from "../domain/form-document";
import { useFormLocale } from "../i18n/locale-adapter";
import styles from "../shell/RouteShell.module.css";

export function DesignerPlaceholderApp() {
  const { locale, direction, messages } = useFormLocale("en");
  const { slug } = getCurrentFormRoute();
  const resolution = useStoredForm(slug);
  const formName = resolution.status === "ready" ? getLocalizedText(resolution.document.metadata.name, locale) : "";

  return (
    <div className={styles.page} dir={direction}>
      <header className={styles.topbar}>
        <a className={styles.brand} href={formRouteHref("landing")}>
          <span className={styles.brandMark}>JB</span>
          <span>
            <strong>{messages.productName}</strong>
            <small>{messages.designer}</small>
          </span>
        </a>
        <div className={styles.topActions}>
          <JBButton variant="ghost" onClick={() => window.location.assign(formRouteHref("builder", slug))}>
            {messages.builder}
          </JBButton>
          <JBButton variant="outline" onClick={() => window.location.assign(formRouteHref("preview", slug))}>
            {messages.preview}
          </JBButton>
        </div>
      </header>
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
