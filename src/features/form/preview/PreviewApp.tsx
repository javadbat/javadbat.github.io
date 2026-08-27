import { useEffect, useMemo, useRef, useState } from "react";
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

function BuilderIcon() {
  return (
    <svg className={`${styles.previewHeaderIcon} ${styles.previewBuilderIcon}`} viewBox="0 0 24 24" aria-hidden="true">
      <path d="M4 4h6v6H4zM14 4h6v6h-6zM4 14h6v6H4zM14 14h6v6h-6z" />
    </svg>
  );
}

function DesignerIcon() {
  return (
    <svg className={styles.previewHeaderIcon} viewBox="0 0 24 24" aria-hidden="true">
      <path d="m14.7 5.3 4 4M4 20l4.3-1 10.4-10.4a2.8 2.8 0 0 0-4-4L4.3 15 4 20Z" />
      <path d="m12.5 7.5 4 4" />
    </svg>
  );
}

function OverflowIcon() {
  return (
    <svg className={styles.previewOverflowIcon} viewBox="0 0 24 24" aria-hidden="true">
      <circle cx="5" cy="12" r="1.6" />
      <circle cx="12" cy="12" r="1.6" />
      <circle cx="19" cy="12" r="1.6" />
    </svg>
  );
}

export function PreviewApp() {
  const { locale, direction, setLocale, messages } = useFormLocale("en");
  const { slug } = getCurrentFormRoute();
  const resolution = useStoredForm(slug);
  const [requestedLanguage, setRequestedLanguage] = useState<string | null>(getRequestedLanguage);
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const supportedLanguages = useMemo(() => resolution.status === "ready" ? Object.keys(resolution.document.localization.locales) : [], [resolution]);
  const selectedLanguage = useMemo(() => {
    if (resolution.status !== "ready") return requestedLanguage ?? locale;
    const requested = requestedLanguage?.toLowerCase();
    return supportedLanguages.find(language => language.toLowerCase() === requested)
      ?? supportedLanguages.find(language => language.toLowerCase() === locale)
      ?? resolution.document.localization.defaultLocale;
  }, [locale, requestedLanguage, resolution, supportedLanguages]);
  const formName = resolution.status === "ready"
    ? getLocalizedText(resolution.document.metadata.name, selectedLanguage, resolution.document.localization.defaultLocale)
    : "";

  useEffect(() => {
    if (resolution.status !== "ready") return;
    const appLocale = selectedLanguage.toLowerCase().split("-")[0] === "fa" ? "fa" : "en";
    if (locale !== appLocale) setLocale(appLocale);
    const url = new URL(window.location.href);
    if (url.searchParams.get(PREVIEW_LANGUAGE_QUERY_PARAMETER) === selectedLanguage) return;
    url.searchParams.set(PREVIEW_LANGUAGE_QUERY_PARAMETER, selectedLanguage);
    window.history.replaceState(window.history.state, "", url);
  }, [locale, resolution.status, selectedLanguage, setLocale]);

  useEffect(() => {
    if (!menuOpen) return;

    const closeOnOutsideClick = (event: MouseEvent) => {
      if (event.target instanceof Node && !menuRef.current?.contains(event.target)) setMenuOpen(false);
    };
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setMenuOpen(false);
    };

    document.addEventListener("mousedown", closeOnOutsideClick);
    document.addEventListener("keydown", closeOnEscape);
    return () => {
      document.removeEventListener("mousedown", closeOnOutsideClick);
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, [menuOpen]);

  const selectLanguage = (nextLanguage: string) => {
    setRequestedLanguage(nextLanguage);
    setLocale(nextLanguage.toLowerCase().split("-")[0] === "fa" ? "fa" : "en");
    setMenuOpen(false);
  };
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
                onChange={event => selectLanguage(event.target.value)}
              >
                {supportedLanguages.map(language => (
                  <JBOption key={language} value={language}>
                    {language.toUpperCase()}
                  </JBOption>
                ))}
              </JBSelect>
            </div>
          )}
          <JBButton className={styles.previewNavButton} variant="ghost" size="sm" aria-label={messages.builder} onClick={() => window.location.assign(formRouteHref("builder", slug))}>
            <BuilderIcon />
            <span>{messages.builder}</span>
          </JBButton>
          <JBButton className={styles.previewNavButton} variant="outline" size="sm" aria-label={messages.designer} onClick={() => window.location.assign(formRouteHref("designer", slug))}>
            <DesignerIcon />
            <span>{messages.designer}</span>
          </JBButton>
          {resolution.status === "ready" && (
            <div className={styles.previewOverflowMenu} ref={menuRef}>
              <button
                type="button"
                className={styles.previewOverflowToggle}
                aria-label={messages.moreActions}
                aria-expanded={menuOpen}
                aria-controls="preview-mobile-actions"
                onClick={() => setMenuOpen(open => !open)}
              >
                <OverflowIcon />
              </button>
              <div id="preview-mobile-actions" className={styles.previewOverflowPanel} hidden={!menuOpen}>
                <label htmlFor="preview-mobile-language">{messages.locale}</label>
                <JBSelect<string>
                  id="preview-mobile-language"
                  name="previewMobileLanguage"
                  aria-label={messages.contentLocale}
                  size="sm"
                  value={selectedLanguage}
                  hideClear
                  onChange={event => selectLanguage(event.target.value)}
                >
                  {supportedLanguages.map(language => (
                    <JBOption key={language} value={language}>
                      {language.toUpperCase()}
                    </JBOption>
                  ))}
                </JBSelect>
              </div>
            </div>
          )}
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
            key={selectedLanguage}
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
