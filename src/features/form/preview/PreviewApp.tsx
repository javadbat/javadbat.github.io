import { useEffect, useMemo, useState } from "react";
import { JBButton } from "jb-button/react";
import { JBOption } from "jb-select/option/react";
import { JBSelect } from "jb-select/react";
import { formRouteHref, getCurrentFormRoute } from "../application/form-route";
import { useStoredForm } from "../application/use-stored-form";
import { getLocalizedText } from "../domain/form-document";
import { useFormLocale } from "../i18n/locale-adapter";
import styles from "../shell/RouteShell.module.css";
import { PreviewFormPanel } from "./PreviewFormPanel";

const PREVIEW_LANGUAGE_QUERY_PARAMETER = "lang";

function getRequestedLanguage(): string | null {
  if (typeof window === "undefined") return null;
  return new URLSearchParams(window.location.search).get(PREVIEW_LANGUAGE_QUERY_PARAMETER);
}

export function PreviewApp() {
  const { locale, direction, messages } = useFormLocale("en");
  const { slug } = getCurrentFormRoute();
  const resolution = useStoredForm(slug);
  const [requestedLanguage, setRequestedLanguage] = useState<string | null>(getRequestedLanguage);
  const supportedLanguages = useMemo(() => resolution.status === "ready" ? Object.keys(resolution.document.localization.locales) : [], [resolution]);
  const selectedLanguage = useMemo(() => {
    if (resolution.status !== "ready") return requestedLanguage ?? locale;
    const requested = requestedLanguage?.toLowerCase();
    return supportedLanguages.find(language => language.toLowerCase() === requested) ?? resolution.document.localization.defaultLocale;
  }, [locale, requestedLanguage, resolution, supportedLanguages]);
  const formName = resolution.status === "ready"
    ? getLocalizedText(resolution.document.metadata.name, selectedLanguage, resolution.document.localization.defaultLocale)
    : "";

  useEffect(() => {
    if (resolution.status !== "ready") return;
    const url = new URL(window.location.href);
    if (url.searchParams.get(PREVIEW_LANGUAGE_QUERY_PARAMETER) === selectedLanguage) return;
    url.searchParams.set(PREVIEW_LANGUAGE_QUERY_PARAMETER, selectedLanguage);
    window.history.replaceState(window.history.state, "", url);
  }, [resolution.status, selectedLanguage]);
  const unresolvedMessage =
    resolution.status === "loading"
      ? messages.loadingForms
      : resolution.status === "error"
        ? messages.storageUnavailable
        : resolution.status === "not-found"
          ? messages.unknownForm
          : resolution.status === "empty"
            ? messages.noSavedDraft
            : "";

  return (
    <div className={styles.page} dir={direction}>
      <header className={styles.topbar}>
        <a className={styles.brand} href={formRouteHref("landing")}>
          <span className={styles.brandMark}>JB</span>
          <span>
            <strong>{messages.productName}</strong>
            <small>{messages.preview}</small>
          </span>
        </a>
        <div className={styles.topActions}>
          {resolution.status === "ready" && (
            <div className={styles.previewLocaleControl}>
              <span>{messages.locale}</span>
              <JBSelect<string>
                name="previewLanguage"
                aria-label={messages.contentLocale}
                size="sm"
                value={selectedLanguage}
                hideClear
                onChange={event => setRequestedLanguage(event.target.value)}
              >
                {supportedLanguages.map(language => (
                  <JBOption key={language} value={language}>
                    {language.toUpperCase()}
                  </JBOption>
                ))}
              </JBSelect>
            </div>
          )}
          <JBButton variant="ghost" onClick={() => window.location.assign(formRouteHref("builder", slug))}>
            {messages.builder}
          </JBButton>
          <JBButton variant="outline" onClick={() => window.location.assign(formRouteHref("designer", slug))}>
            {messages.designer}
          </JBButton>
        </div>
      </header>
      {resolution.status === "ready" ? (
        <main className={styles.previewMain}>
          <header className={styles.previewHeading}>
            <p className={styles.eyebrow}>{messages.preview}</p>
            <h1>{formName || messages.previewReadyTitle}</h1>
            <p>{messages.previewReadyDescription}</p>
          </header>
          <PreviewFormPanel
            document={resolution.document}
            locale={selectedLanguage}
            accessibleName={formName || messages.previewReadyTitle}
            messages={messages}
          />
        </main>
      ) : (
        <main className={styles.placeholder}>
          <div className={styles.placeholderCard} aria-hidden="true">
            <span />
          </div>
          <p className={styles.eyebrow}>{messages.phaseOne}</p>
          <h1>{messages.preview}</h1>
          <p className={styles.placeholderDescription}>{unresolvedMessage}</p>
        </main>
      )}
    </div>
  );
}
