import { useTranslation } from "react-i18next";
import { FormI18nProvider } from "../i18n/FormI18nProvider";
import { formPageHref, getCurrentFormSlug } from "../application/form-page-url";
import { useStoredForm } from "../application/use-stored-form";
import { getLocalizedText } from "../domain/form-document";
import { FormRouteBrand, FormRouteHeader, FormRouteLinkButton } from "../layout/FormRouteHeader";
import styles from "../shell/RouteShell.module.css";

function DesignerPlaceholderAppContent() {
  const { t, i18n } = useTranslation("designerPlaceholderApp");
  const locale = i18n.language;
  const direction = i18n.dir();
  const { t: tCommon } = useTranslation("common");
  const slug = getCurrentFormSlug();
  const resolution = useStoredForm(slug);
  const formName = resolution.status === "ready"
    ? getLocalizedText(resolution.document.metadata.name, locale, resolution.document.localization.defaultLocale)
    : "";

  return (
    <div className={styles.page} dir={direction}>
      <FormRouteHeader className={styles.topbar}>
        <FormRouteBrand href={formPageHref("landing")} title={tCommon("productName")} subtitle={tCommon("designer")} />
        <div className={styles.topActions}>
          <FormRouteLinkButton href={formPageHref("builder", slug)}>
            {tCommon("builder")}
          </FormRouteLinkButton>
          <FormRouteLinkButton href={formPageHref("preview", slug)} variant="outline">
            {tCommon("preview")}
          </FormRouteLinkButton>
        </div>
      </FormRouteHeader>
      <main className={styles.placeholder}>
        <div className={styles.placeholderCard} aria-hidden="true">
          <span />
        </div>
        <p className={styles.eyebrow}>{tCommon("phaseOne")}</p>
        <h1>{t("emptyDesigner")}</h1>
        <p className={styles.placeholderDescription}>
          {resolution.status === "loading"
            ? tCommon("loadingForms")
            : resolution.status === "error"
              ? tCommon("storageUnavailable")
              : resolution.status === "not-found"
                ? tCommon("unknownForm")
                : resolution.status === "empty"
                  ? tCommon("noSavedDraft")
                  : `${t("emptyDesignerDescription")} ${tCommon("formName")}: ${formName}.`}
        </p>
      </main>
    </div>
  );
}

export function DesignerPlaceholderApp() {
  return <FormI18nProvider><DesignerPlaceholderAppContent /></FormI18nProvider>;
}
