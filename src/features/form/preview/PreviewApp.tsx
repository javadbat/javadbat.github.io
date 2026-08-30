import { useEffect, useMemo, useRef, useState, type CSSProperties } from "react";
import { JBButton } from "jb-button/react";
import { JBOption } from "jb-select/option/react";
import { JBSelect } from "jb-select/react";
import type { ThemeConfigV1 } from "jb-form-builder/contract/theme";
import { formPageHref, getCurrentFormSlug, getCurrentThemeSlug } from "../application/form-page-url";
import { useStoredForm } from "../application/use-stored-form";
import { useStoredTheme } from "../application/use-stored-theme";
import { getLocalizedText } from "../domain/form-document";
import { useFormLocale } from "../i18n/locale-adapter";
import { FormRouteBrand, FormRouteHeader } from "../layout/FormRouteHeader";
import styles from "../shell/RouteShell.module.css";
import { PreviewFormPanel } from "./PreviewFormPanel";
import { PATTERN_ASSETS, type ThemePatternId } from "../designer/theme-config";

const PREVIEW_LANGUAGE_QUERY_PARAMETER = "lang";
type CSSVariables = CSSProperties & Record<`--${string}`, string | number | undefined>;

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
  const { locale, direction, messages } = useFormLocale("en");
  const slug = getCurrentFormSlug();
  const resolution = useStoredForm(slug);
  const themeResolution = useStoredTheme(getCurrentThemeSlug(), slug);
  const themeConfig = themeResolution.status === "ready" ? themeResolution.record.config : null;
  const rendererTheme = useMemo<ThemeConfigV1 | null>(() => {
    if (!themeConfig) return null;
    const config = structuredClone(themeConfig);
    delete config.background;
    return config;
  }, [themeConfig]);
  const pageThemeStyle = useMemo<CSSVariables | undefined>(() => {
    if (!themeConfig) return undefined;
    const background = themeConfig.background;
    const backgroundColor = background?.type === "image"
      ? background.fallbackColor
      : background?.color;
    return {
      ...themeConfig.global,
      color: themeConfig.global?.["--jb-text-primary"],
      background: backgroundColor,
      fontFamily: themeConfig.typography?.fontFamily,
    };
  }, [themeConfig]);
  const pageBackdropStyle = useMemo<CSSProperties>(() => {
    const background = themeConfig?.background;
    if (!background || background.type === "color") return { display: "none" };
    if (background.type === "pattern") {
      return {
        backgroundImage: `url(${JSON.stringify(PATTERN_ASSETS[background.patternId as ThemePatternId])})`,
        backgroundPosition: "center",
        backgroundRepeat: "repeat",
        backgroundSize: `${Math.max(180, 700 * ((background.scale ?? 100) / 100))}px`,
        opacity: (background.opacity ?? 100) / 100,
      };
    }
    const source = `url(${JSON.stringify(background.source)})`;
    return {
      backgroundImage: background.overlayColor
        ? `linear-gradient(${background.overlayColor}, ${background.overlayColor}), ${source}`
        : source,
      backgroundPosition: background.position ?? "center",
      backgroundRepeat: "no-repeat",
      backgroundSize: background.fit ?? "cover",
      opacity: (background.opacity ?? 100) / 100,
    };
  }, [themeConfig]);
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
    const url = new URL(window.location.href);
    if (url.searchParams.get(PREVIEW_LANGUAGE_QUERY_PARAMETER) === selectedLanguage) return;
    url.searchParams.set(PREVIEW_LANGUAGE_QUERY_PARAMETER, selectedLanguage);
    window.history.replaceState(window.history.state, "", url);
  }, [resolution.status, selectedLanguage]);

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
    <div className={styles.page} dir={direction} style={pageThemeStyle} data-theme-background={themeConfig?.background?.type}>
      <div className={styles.themePageBackdrop} style={pageBackdropStyle} aria-hidden="true" />
      <FormRouteHeader className={styles.topbar}>
        <FormRouteBrand href={formPageHref("landing")} title={messages.productName} subtitle={messages.preview} />
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
          <JBButton className={styles.previewNavButton} variant="ghost" size="sm" aria-label={messages.builder} onClick={() => window.location.assign(formPageHref("builder", slug))}>
            <BuilderIcon />
            <span>{messages.builder}</span>
          </JBButton>
          <JBButton className={styles.previewNavButton} variant="outline" size="sm" aria-label={messages.designer} onClick={() => window.location.assign(formPageHref("designer", slug))}>
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
      </FormRouteHeader>
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
            themeConfig={rendererTheme}
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
