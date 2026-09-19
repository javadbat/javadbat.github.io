import { useTranslation } from "react-i18next";
import { useEffect, useMemo, useState, type CSSProperties } from "react";
import type { ThemeConfigV1 } from "jb-form-builder/contract/theme";
import { formPageHref, getCurrentFormSlug, getCurrentThemeSlug } from "../application/form-page-url";
import { useStoredForm } from "../application/use-stored-form";
import { useStoredTheme } from "../application/use-stored-theme";
import { getLocalizedText } from "../domain/form-document";
import { FormI18nProvider } from "../i18n/FormI18nProvider";
import { FormRouteBrand, FormRouteHeader } from "../layout/FormRouteHeader";
import { FormRouteMenu } from "../layout/FormRouteMenu";
import styles from "../shell/RouteShell.module.css";
import { PreviewFormPanel } from "./PreviewFormPanel";
import { PATTERN_ASSETS, type ThemePatternId } from "../designer/theme-config";

const PREVIEW_LANGUAGE_QUERY_PARAMETER = "lang";
type CSSVariables = CSSProperties & Record<`--${string}`, string | number | undefined>;

function getRequestedLanguage(): string | null {
  if (typeof window === "undefined") return null;
  return new URLSearchParams(window.location.search).get(PREVIEW_LANGUAGE_QUERY_PARAMETER);
}

function PreviewAppContent() {
  const { t: tCommon, i18n } = useTranslation("common");
  const direction = i18n.dir();
  const { t } = useTranslation("previewApp");
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
  const supportedLanguages = useMemo(() => resolution.status === "ready" ? Object.keys(resolution.document.localization.locales) : [], [resolution]);
  const selectedLanguage = useMemo(() => {
    if (resolution.status !== "ready") return requestedLanguage ?? "";
    const requested = requestedLanguage?.toLowerCase();
    return supportedLanguages.find(language => language.toLowerCase() === requested)
      ?? resolution.document.localization.defaultLocale;
  }, [requestedLanguage, resolution, supportedLanguages]);
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
      ? tCommon("loadingForms")
      : resolution.status === "error"
        ? tCommon("storageUnavailable")
        : resolution.status === "not-found"
          ? tCommon("unknownForm")
          : resolution.status === "empty"
            ? tCommon("noSavedDraft")
            : "";

  return (
    <div className={styles.page} dir={direction} style={pageThemeStyle} data-theme-background={themeConfig?.background?.type}>
      <div className={styles.themePageBackdrop} style={pageBackdropStyle} aria-hidden="true" />
      <FormRouteHeader className={styles.topbar}>
        <FormRouteBrand href={formPageHref("landing")} title={tCommon("productName")} subtitle={tCommon("preview")} />
        <FormRouteMenu
          currentPage="preview"
          formSlug={slug}
          themeSlug={getCurrentThemeSlug()}
          contentLanguage={selectedLanguage}
          contentLanguageOptions={(supportedLanguages.length > 0 ? supportedLanguages : ["en", "fa"]).map(language => ({ value: language, label: language.toUpperCase() }))}
          onContentLanguageChange={setRequestedLanguage}
        />
      </FormRouteHeader>
      {resolution.status === "ready" ? (
        <main className={styles.previewMain}>
          <header className={styles.previewHeading}>
            <p className={styles.eyebrow}>{tCommon("preview")}</p>
            <h1>{formName || t("previewReadyTitle")}</h1>
            <p>{t("previewReadyDescription")}</p>
          </header>
          <PreviewFormPanel
            key={selectedLanguage}
            document={resolution.document}
            locale={selectedLanguage}
            accessibleName={formName || t("previewReadyTitle")}
            themeConfig={rendererTheme}
          />
        </main>
      ) : (
        <main className={styles.placeholder}>
          <div className={styles.placeholderCard} aria-hidden="true">
            <span />
          </div>
          <p className={styles.eyebrow}>{tCommon("phaseOne")}</p>
          <h1>{tCommon("preview")}</h1>
          <p className={styles.placeholderDescription}>{unresolvedMessage}</p>
        </main>
      )}
    </div>
  );
}

export function PreviewApp() {
  return <FormI18nProvider><PreviewAppContent /></FormI18nProvider>;
}
