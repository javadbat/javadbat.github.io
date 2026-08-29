import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
} from "react";
import { JBButton } from "jb-button/react";
import { JBColorInput } from "jb-color-input/react";
import { JBInput } from "jb-input/react";
import { JBNumberInput } from "jb-number-input/react";
import { JBRangeInput } from "jb-range-input/react";
import { JBTextarea } from "jb-textarea/react";
import { JBOption } from "jb-select/option/react";
import { JBSelect } from "jb-select/react";
import { JBFormBuilder } from "jb-form-builder/react";
import { loadDependencies } from "jb-form-builder/dependency-loader";
import type { JBFormBuilderElement } from "jb-form-builder/types";
import type { ThemeConfigV1 } from "jb-form-builder/contract/theme";
import "jb-icons/arrow";
import "jb-icons/edit";
import "jb-icons/refresh";
import { formPageHref, getCurrentFormSlug, getCurrentThemeSlug } from "../application/form-page-url";
import { useStoredForm } from "../application/use-stored-form";
import { useStoredTheme } from "../application/use-stored-theme";
import { getLocalizedText } from "../domain/form-document";
import { FormRouteBrand, FormRouteHeader } from "../layout/FormRouteHeader";
import { JBCollapse } from "jb-collapse/react";
import layoutStyles from "../layout/FormRouteLayout.module.css";
import { DESIGNER_SAMPLE_FORM } from "./sample-form";
import {
  GLOBAL_COLOR_TOKENS,
  GLOBAL_CONTROL_HEIGHT_TOKENS,
  GLOBAL_RADIUS_TOKENS,
  DEFAULT_DESIGNER_THEME,
  PATTERN_ASSETS,
  THEME_PRESETS,
  cloneTheme,
  fromPortableThemeConfig,
  readStoredTheme,
  toPortableThemeConfig,
  type DesignerThemeConfig,
  type GlobalThemeToken,
  type ThemeAudienceSize,
  type ThemeBackgroundMode,
  type ThemeControlSize,
  type ThemePatternId,
} from "./theme-config";
import styles from "./DesignerApp.module.css";
import { withControlSizeDefault } from "./control-size-default";
import { themeRepository } from "../storage/theme-repository";
import type { StoredThemeRecordV1 } from "../storage/storage-types";
import { prepareThemeImport } from "./theme-import";
import { useFormLocale, type FormAppLocale, type FormMessageKey } from "../i18n/locale-adapter";

type SaveStatus = "saving" | "saved" | "invalid" | "error";
type DesignerSection = "background" | "colors" | "typography" | "sizing" | "shape" | "components";
type PreviewViewport = "desktop" | "mobile";
type MobilePanel = "design" | "preview";
type CSSVariables = CSSProperties & Record<`--${string}`, string | number | undefined>;

const patternChoices: ThemePatternId[] = ["science-doodles", "academic-waves", "calm-dots", "warm-chevrons"];

const fontChoices = [
  { value: "text-font, fa-font, system-ui, sans-serif", labelKey: "designerJbSans" },
  { value: "Georgia, 'Times New Roman', serif", labelKey: "designerClassicSerif" },
  { value: "Verdana, Geneva, sans-serif", labelKey: "designerFriendlyRounded" },
  { value: "ui-monospace, SFMono-Regular, Consolas, monospace", labelKey: "designerTechnicalMono" },
] as const;

function valueFromEvent(event: unknown): string {
  const eventValue = event as {
    currentTarget?: { value?: unknown } | null;
    target?: { value?: unknown } | null;
  };
  return String(eventValue.currentTarget?.value ?? eventValue.target?.value ?? "");
}

function numberFromEvent(event: unknown, fallback: number): number {
  const value = Number(valueFromEvent(event));
  return Number.isFinite(value) ? value : fallback;
}

function themeSlug(name: string): string {
  return name
    .trim()
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "") || "untitled-theme";
}

const persianTokenLabels: Partial<Record<GlobalThemeToken, string>> = {
  "--jb-primary": "اصلی", "--jb-secondary": "ثانویه", "--jb-green": "سبز", "--jb-red": "قرمز", "--jb-yellow": "زرد",
  "--jb-neutral": "خنثی", "--jb-text-primary": "متن اصلی", "--jb-text-secondary": "متن ثانویه", "--jb-text-contrast": "متن متضاد",
  "--jb-black": "مشکی", "--jb-white": "سفید", "--jb-highlight": "برجسته", "--jb-radius": "گردی گوشه",
};

function tokenLabel(token: GlobalThemeToken, locale: FormAppLocale): string {
  if (locale === "fa") {
    if (persianTokenLabels[token]) return persianTokenLabels[token]!;
    const neutral = /^--jb-neutral-(\d+)$/.exec(token);
    if (neutral) return `خنثی ${neutral[1]}`;
    const radius = /^--jb-radius-(.+)$/.exec(token);
    if (radius) return `گردی ${radius[1].toUpperCase()}`;
    const height = /^--jb-control-height-(.+)$/.exec(token);
    if (height) return `ارتفاع کنترل ${height[1].toUpperCase()}`;
  }
  return token
    .replace("--jb-", "")
    .split("-")
    .map(part => part[0]?.toUpperCase() + part.slice(1))
    .join(" ");
}

function SettingRange({
  label,
  value,
  min,
  max,
  step,
  tickStep,
  suffix,
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  tickStep: number;
  suffix: string;
  onChange: (value: number) => void;
}) {
  return (
    <div className={styles.rangeSetting}>
      <span>{label}</span>
      <JBRangeInput
        aria-label={label}
        size="sm"
        min={min}
        max={max}
        step={step}
        tickStep={tickStep}
        minorTickStep={null}
        value={value}
        onInput={event => onChange(numberFromEvent(event, value))}
      />
      <JBNumberInput
        aria-label={`${label} value`}
        size="sm"
        minValue={min}
        maxValue={max}
        step={step}
        value={value}
        onInput={event => onChange(numberFromEvent(event, value))}
      >
        <span className={styles.inputSuffix} slot="end-section" aria-hidden="true">{suffix}</span>
      </JBNumberInput>
    </div>
  );
}

export function DesignerApp() {
  const { locale, direction, setLocale, messages } = useFormLocale("en");
  const message = (key: FormMessageKey, values: Record<string, string | number> = {}) => Object.entries(values)
    .reduce((result, [name, value]) => result.replaceAll(`{${name}}`, String(value)), messages[key]);
  const formSlug = getCurrentFormSlug();
  const selectedThemeSlug = getCurrentThemeSlug();
  const storedForm = useStoredForm(formSlug);
  const storedTheme = useStoredTheme(selectedThemeSlug, formSlug);
  const rendererRef = useRef<JBFormBuilderElement | null>(null);
  const uploadRef = useRef<HTMLInputElement | null>(null);
  const importFileRef = useRef<HTMLInputElement | null>(null);
  const initializingThemeRef = useRef(false);
  const ignoreStaleThemeResolutionRef = useRef(false);
  const themeRecordRef = useRef<StoredThemeRecordV1 | null>(null);
  const editVersionRef = useRef(0);
  const saveQueueRef = useRef<Promise<void>>(Promise.resolve());
  const [theme, setTheme] = useState<DesignerThemeConfig>(() => readStoredTheme());
  const lastValidPortableThemeRef = useRef<ThemeConfigV1>(toPortableThemeConfig(theme));
  const portableThemeState = useMemo(() => {
    try {
      const config = toPortableThemeConfig(theme);
      lastValidPortableThemeRef.current = config;
      return { valid: true as const, config };
    } catch {
      return { valid: false as const, config: lastValidPortableThemeRef.current };
    }
  }, [theme]);
  const portableTheme = portableThemeState.config;
  const [themeRecord, setThemeRecord] = useState<StoredThemeRecordV1 | null>(null);
  const [libraryThemes, setLibraryThemes] = useState<StoredThemeRecordV1[]>([]);
  const [defaultThemeId, setDefaultThemeId] = useState<string | null>(null);
  const [boundThemeId, setBoundThemeId] = useState<string | null>(null);
  const [themeBindings, setThemeBindings] = useState<Record<string, string>>({});
  const [themeLoadNotice, setThemeLoadNotice] = useState<string>();
  const [importOpen, setImportOpen] = useState(false);
  const [importJson, setImportJson] = useState("");
  const [importFileName, setImportFileName] = useState("");
  const [importFileError, setImportFileError] = useState("");
  const [importWarningsConfirmed, setImportWarningsConfirmed] = useState(false);
  const [importSupportedOnly, setImportSupportedOnly] = useState(false);
  const [pendingDelete, setPendingDelete] = useState<StoredThemeRecordV1>();
  const [deleteReplacementId, setDeleteReplacementId] = useState("default");
  const [deleteBusy, setDeleteBusy] = useState(false);
  const [history, setHistory] = useState<DesignerThemeConfig[]>([]);
  const [future, setFuture] = useState<DesignerThemeConfig[]>([]);
  const [saveStatus, setSaveStatus] = useState<SaveStatus>("saved");
  const [activePreset, setActivePreset] = useState("rose-pop");
  const [viewport, setViewport] = useState<PreviewViewport>("desktop");
  const [mobilePanel, setMobilePanel] = useState<MobilePanel>("design");
  const [previewSource, setPreviewSource] = useState("sample");
  const [isEditingName, setIsEditingName] = useState(false);
  const [libraryOpen, setLibraryOpen] = useState(false);
  const [exportOpen, setExportOpen] = useState(false);
  const [exportCopied, setExportCopied] = useState(false);
  const [temporaryImage, setTemporaryImage] = useState<string>();
  const [imageNotice, setImageNotice] = useState<string>();
  const [imageLoadState, setImageLoadState] = useState<"idle" | "loading" | "ready" | "error">("idle");
  const [imageRetryVersion, setImageRetryVersion] = useState(0);

  const commitTheme = useCallback((nextTheme: DesignerThemeConfig, presetId = "") => {
    editVersionRef.current += 1;
    setTheme(current => {
      setHistory(previous => [...previous.slice(-39), cloneTheme(current)]);
      return cloneTheme(nextTheme);
    });
    setFuture([]);
    setActivePreset(presetId);
    setSaveStatus("saving");
  }, []);

  const updateTheme = useCallback((change: (draft: DesignerThemeConfig) => void) => {
    const next = cloneTheme(theme);
    change(next);
    commitTheme(next);
  }, [commitTheme, theme]);

  useEffect(() => {
    if (storedTheme.status === "ready") {
      if (themeRecordRef.current?.id === storedTheme.record.id) {
        if (ignoreStaleThemeResolutionRef.current) {
          ignoreStaleThemeResolutionRef.current = false;
          setThemeLoadNotice(undefined);
          setLibraryOpen(false);
        }
        return;
      }
      const editorTheme = fromPortableThemeConfig(storedTheme.record.config);
      themeRecordRef.current = storedTheme.record;
      setThemeRecord(storedTheme.record);
      setTheme(editorTheme);
      setHistory([]);
      setFuture([]);
      setActivePreset("");
      setSaveStatus("saved");
      setThemeLoadNotice(undefined);
      return;
    }
    if (storedTheme.status === "not-found") {
      if (ignoreStaleThemeResolutionRef.current) return;
      setThemeLoadNotice(messages.designerThemeNotFound);
      setLibraryOpen(true);
      return;
    }
    if (storedTheme.status === "error") {
      if (ignoreStaleThemeResolutionRef.current) return;
      setThemeLoadNotice(storedTheme.issue.message);
      setLibraryOpen(true);
      return;
    }
    if (storedTheme.status !== "empty" || initializingThemeRef.current) return;
    initializingThemeRef.current = true;
    const initialTheme = readStoredTheme();
    void themeRepository.create(toPortableThemeConfig(initialTheme)).then(async result => {
      if (!result.ok) {
        setSaveStatus("error");
        initializingThemeRef.current = false;
        return;
      }
      themeRecordRef.current = result.value;
      setThemeRecord(result.value);
      if (editVersionRef.current === 0) setTheme(fromPortableThemeConfig(result.value.config));
      const selectedDefault = await themeRepository.setDefault(result.value.id);
      setSaveStatus(selectedDefault.ok ? (editVersionRef.current === 0 ? "saved" : "saving") : "error");
      window.history.replaceState(null, "", formPageHref("designer", formSlug, result.value.slug));
    });
  }, [formSlug, messages.designerThemeNotFound, storedTheme]);

  useEffect(() => {
    if (saveStatus !== "saving" || !themeRecord) return;
    if (!portableThemeState.valid) {
      setSaveStatus("invalid");
      return;
    }
    const editVersion = editVersionRef.current;
    const config = portableTheme;
    const timer = window.setTimeout(() => {
      saveQueueRef.current = saveQueueRef.current.then(async () => {
        const linked = themeRecordRef.current;
        if (!linked) return;
        const result = await themeRepository.save({ id: linked.id, revision: linked.revision, config });
        if (!result.ok) {
          setSaveStatus("error");
          return;
        }
        themeRecordRef.current = result.value;
        setThemeRecord(result.value);
        if (editVersionRef.current === editVersion) setSaveStatus("saved");
      });
    }, 500);
    return () => window.clearTimeout(timer);
  }, [portableTheme, portableThemeState.valid, saveStatus, themeRecord]);

  useEffect(() => () => {
    if (temporaryImage?.startsWith("blob:")) URL.revokeObjectURL(temporaryImage);
  }, [temporaryImage]);

  useEffect(() => {
    if (theme.background.mode !== "image" || temporaryImage) {
      setImageLoadState("idle");
      return;
    }
    const source = theme.background.imageUrl?.trim();
    if (!source || source.startsWith("blob:") || source.startsWith("file:")) {
      setImageLoadState("idle");
      return;
    }
    let active = true;
    setImageLoadState("loading");
    const timer = window.setTimeout(() => {
      if (window.location.protocol === "https:" && source.startsWith("http:")) {
        setImageLoadState("error");
        setImageNotice(messages.designerMixedContentNotice);
        return;
      }
      const candidate = new Image();
      candidate.onload = () => {
        if (!active) return;
        setImageLoadState("ready");
        setImageNotice(undefined);
      };
      candidate.onerror = () => {
        if (!active) return;
        setImageLoadState("error");
        setImageNotice(messages.designerUnavailableNotice);
      };
      candidate.src = source;
    }, 400);
    return () => {
      active = false;
      window.clearTimeout(timer);
    };
  }, [imageRetryVersion, messages.designerMixedContentNotice, messages.designerUnavailableNotice, temporaryImage, theme.background.imageUrl, theme.background.mode]);

  useEffect(() => {
    if (!libraryOpen) return;
    let active = true;
    void Promise.all([themeRepository.list(), themeRepository.getSettings()]).then(([themes, settings]) => {
      if (!active) return;
      if (themes.ok) setLibraryThemes(themes.value);
      if (settings.ok) {
        setDefaultThemeId(settings.value.defaultThemeId);
        setThemeBindings(settings.value.bindings);
      }
    });
    return () => { active = false; };
  }, [libraryOpen]);

  useEffect(() => {
    if (!themeRecord) return;
    let active = true;
    void themeRepository.getSettings().then(result => {
      if (!active || !result.ok) return;
      setDefaultThemeId(result.value.defaultThemeId);
      setThemeBindings(result.value.bindings);
      setBoundThemeId(formSlug ? result.value.bindings[formSlug] ?? null : null);
    });
    return () => { active = false; };
  }, [formSlug, themeRecord]);

  const openThemeRecord = (record: StoredThemeRecordV1) => {
    ignoreStaleThemeResolutionRef.current = true;
    themeRecordRef.current = record;
    setThemeRecord(record);
    setTheme(fromPortableThemeConfig(record.config));
    setHistory([]);
    setFuture([]);
    setActivePreset("");
    setSaveStatus("saved");
    setThemeLoadNotice(undefined);
    window.history.replaceState(null, "", formPageHref("designer", formSlug, record.slug));
    setLibraryOpen(false);
  };

  const createFromPreset = async (presetTheme: DesignerThemeConfig, presetId: string) => {
    const result = await themeRepository.create(toPortableThemeConfig(presetTheme));
    if (!result.ok) {
      setSaveStatus("error");
      return;
    }
    openThemeRecord(result.value);
    setActivePreset(presetId);
  };

  const openImport = () => {
    setImportJson("");
    setImportFileName("");
    setImportFileError("");
    setImportWarningsConfirmed(false);
    setImportSupportedOnly(false);
    setImportOpen(true);
  };

  const chooseImportFile = async (file: File | undefined) => {
    if (!file) return;
    setImportFileName(file.name);
    setImportWarningsConfirmed(false);
    setImportSupportedOnly(false);
    try {
      setImportJson(await file.text());
      setImportFileError("");
    } catch (cause) {
      setImportJson("");
      setImportFileError(cause instanceof Error ? cause.message : messages.designerFileReadFailed);
    }
  };

  const importTheme = async () => {
    if (!importValidation?.valid) return;
    if (importValidation.warnings.length > 0 && !importWarningsConfirmed) return;
    const result = await themeRepository.create(importValidation.config);
    if (!result.ok) {
      setImportFileError(result.error.message);
      return;
    }
    setImportOpen(false);
    openThemeRecord(result.value);
  };

  const setCurrentAsDefault = async () => {
    if (!themeRecord) return;
    const result = await themeRepository.setDefault(themeRecord.id);
    if (result.ok) {
      setDefaultThemeId(themeRecord.id);
      setSaveStatus("saved");
    } else setSaveStatus("error");
  };

  const bindCurrentForm = async () => {
    if (!themeRecord || !formSlug) return;
    const result = await themeRepository.bindForm(formSlug, themeRecord.id);
    if (result.ok) {
      setBoundThemeId(themeRecord.id);
      setSaveStatus("saved");
    } else setSaveStatus("error");
  };

  const duplicateTheme = async (record: StoredThemeRecordV1) => {
    const result = await themeRepository.duplicate(record.id);
    if (!result.ok) {
      setThemeLoadNotice(result.error.message);
      return;
    }
    setLibraryThemes(items => [result.value, ...items]);
    setThemeLoadNotice(message("designerDuplicateSuccess", { name: result.value.config.name }));
  };

  const requestThemeDelete = (record: StoredThemeRecordV1) => {
    setPendingDelete(record);
    setDeleteReplacementId("default");
  };

  const confirmThemeDelete = async () => {
    if (!pendingDelete) return;
    const replacementId = deleteReplacementId === "default" ? null : deleteReplacementId;
    setDeleteBusy(true);
    const result = await themeRepository.delete(pendingDelete.id, replacementId);
    setDeleteBusy(false);
    if (!result.ok) {
      setThemeLoadNotice(result.error.message);
      return;
    }
    const replacement = replacementId ? libraryThemes.find(record => record.id === replacementId) : undefined;
    setLibraryThemes(items => items.filter(record => record.id !== pendingDelete.id));
    setDefaultThemeId(result.value.defaultThemeId);
    setThemeBindings(result.value.bindings);
    if (formSlug) setBoundThemeId(result.value.bindings[formSlug] ?? null);
    const deletedCurrent = themeRecordRef.current?.id === pendingDelete.id;
    setPendingDelete(undefined);
    if (deletedCurrent && replacement) {
      openThemeRecord(replacement);
      return;
    }
    if (deletedCurrent) {
      ignoreStaleThemeResolutionRef.current = true;
      themeRecordRef.current = null;
      setThemeRecord(null);
      setTheme(cloneTheme(DEFAULT_DESIGNER_THEME));
      setHistory([]);
      setFuture([]);
      setSaveStatus("saved");
      window.history.replaceState(null, "", formPageHref("designer", formSlug));
    }
    setThemeLoadNotice(message("designerDeleteSuccess", { name: pendingDelete.config.name }));
  };

  const canUseStoredForm = storedForm.status === "ready";
  const selectedDocument = previewSource === "stored" && canUseStoredForm
    ? storedForm.document
    : DESIGNER_SAMPLE_FORM;
  const previewDocument = useMemo(
    () => withControlSizeDefault(selectedDocument, theme.defaults.controlSize),
    [selectedDocument, theme.defaults.controlSize],
  );
  const previewLocale = previewDocument.localization.defaultLocale;
  const previewDirection = previewDocument.localization.locales[previewLocale]?.direction ?? "ltr";
  const previewName = getLocalizedText(
    previewDocument.metadata.name,
    previewLocale,
    previewLocale,
  );
  const previewDescription = getLocalizedText(
    previewDocument.metadata.description,
    previewLocale,
    previewLocale,
  );

  const previewThemeStyle = useMemo<CSSVariables>(() => ({
    "--jb-primary": theme.global["--jb-primary"] ?? undefined,
    "--jb-secondary": theme.global["--jb-secondary"] ?? undefined,
    "--jb-text-primary": theme.global["--jb-text-primary"] ?? undefined,
    "--jb-radius": theme.global["--jb-radius"] ?? undefined,
    "--designer-text-scale": String(theme.typography.textScale),
    "--designer-spacing-scale": String(theme.sizing.spacingScale),
    "--designer-pattern-color": theme.background.patternColor,
    color: theme.global["--jb-text-primary"] ?? undefined,
    backgroundColor: theme.background.color,
    fontFamily: theme.typography.fontFamily,
  }), [theme]);

  const backdropStyle = useMemo<CSSProperties>(() => {
    if (theme.background.mode === "color") return { display: "none" };
    const source = theme.background.mode === "image"
      ? temporaryImage || (imageLoadState === "ready" ? theme.background.imageUrl : undefined)
      : PATTERN_ASSETS[theme.background.patternId];
    if (!source) return { display: "none" };
    const imageSource = `url(${JSON.stringify(source)})`;
    return {
      backgroundImage: theme.background.mode === "image" && theme.background.imageOverlayColor
        ? `linear-gradient(${theme.background.imageOverlayColor}, ${theme.background.imageOverlayColor}), ${imageSource}`
        : imageSource,
      backgroundPosition: theme.background.mode === "image" ? theme.background.imagePosition ?? "center" : "center",
      backgroundRepeat: theme.background.mode === "pattern" ? "repeat" : "no-repeat",
      backgroundSize: theme.background.mode === "pattern"
        ? `${Math.max(180, 700 * (theme.background.scale / 100))}px`
        : theme.background.imageFit ?? "cover",
      opacity: theme.background.opacity / 100,
    };
  }, [imageLoadState, temporaryImage, theme.background]);

  const exportedJson = useMemo(
    () => JSON.stringify(portableTheme, null, 2),
    [portableTheme],
  );

  const importValidation = useMemo(
    () => importJson.trim() ? prepareThemeImport(importJson, libraryThemes, { supportedValuesOnly: importSupportedOnly }) : null,
    [importJson, importSupportedOnly, libraryThemes],
  );

  const supportedImportValidation = useMemo(
    () => importJson.trim() && !importSupportedOnly ? prepareThemeImport(importJson, libraryThemes, { supportedValuesOnly: true }) : null,
    [importJson, importSupportedOnly, libraryThemes],
  );

  const undo = () => {
    const previous = history.at(-1);
    if (!previous) return;
    setFuture(items => [cloneTheme(theme), ...items].slice(0, 40));
    setHistory(items => items.slice(0, -1));
    setTheme(cloneTheme(previous));
    setActivePreset("");
    editVersionRef.current += 1;
    setSaveStatus("saving");
  };

  const redo = () => {
    const next = future[0];
    if (!next) return;
    setHistory(items => [...items.slice(-39), cloneTheme(theme)]);
    setFuture(items => items.slice(1));
    setTheme(cloneTheme(next));
    setActivePreset("");
    editVersionRef.current += 1;
    setSaveStatus("saving");
  };

  const chooseFile = (file: File | undefined) => {
    if (!file) return;
    if (file.size > 800 * 1024) {
      setImageNotice(messages.designerImageTooLarge);
      return;
    }
    if (file.size > 400 * 1024 && !window.confirm(messages.designerImageConfirm)) {
      return;
    }
    if (temporaryImage?.startsWith("blob:")) URL.revokeObjectURL(temporaryImage);
    const source = URL.createObjectURL(file);
    setTemporaryImage(source);
    setImageNotice(messages.designerLocalImageNotice);
    updateTheme(draft => {
      draft.background.mode = "image";
      draft.background.imageUrl = undefined;
    });
  };

  const renderBackgroundSettings = () => (
    <div className={styles.sectionContent}>
      <div className={styles.segmented} aria-label={messages.designerBackgroundType}>
        {(["color", "pattern", "image"] as ThemeBackgroundMode[]).map(mode => (
          <JBButton
            key={mode}
            size="sm"
            variant={theme.background.mode === mode ? "solid" : "ghost"}
            color="primary"
            onClick={() => updateTheme(draft => { draft.background.mode = mode; })}
          >
            {mode === "color" ? messages.designerColor : mode === "pattern" ? messages.designerPattern : messages.designerImage}
          </JBButton>
        ))}
      </div>

      {theme.background.mode === "pattern" ? (
        <>
          <p className={styles.settingLabel}>{messages.designerChoosePattern}</p>
          <div className={styles.patternGrid}>
            {patternChoices.map(patternId => {
              const patternLabel = patternId === "science-doodles" ? messages.designerScienceDoodles
                : patternId === "academic-waves" ? messages.designerAcademicWaves
                  : patternId === "calm-dots" ? messages.designerCalmDots : messages.designerWarmChevrons;
              return (
              <button
                key={patternId}
                type="button"
                className={theme.background.patternId === patternId ? styles.patternSelected : styles.patternButton}
                aria-label={patternLabel}
                aria-pressed={theme.background.patternId === patternId}
                onClick={() => updateTheme(draft => { draft.background.patternId = patternId; })}
              >
                <img src={PATTERN_ASSETS[patternId]} alt="" />
                {theme.background.patternId === patternId ? <span>{messages.designerSelected}</span> : null}
              </button>
              );
            })}
          </div>
        </>
      ) : null}

      {theme.background.mode === "image" ? (
        <div className={styles.imageSettings}>
          <JBInput
            size="sm"
            type="url"
            label={messages.designerImageUrl}
            placeholder="https://, data:, blob:, or file:"
            value={theme.background.imageUrl ?? ""}
            onInput={event => {
              setTemporaryImage(undefined);
              const value = valueFromEvent(event);
              setImageNotice(value.startsWith("blob:") || value.startsWith("file:")
                ? messages.designerTemporaryUrlNotice
                : undefined);
              updateTheme(draft => { draft.background.imageUrl = value || undefined; });
            }}
          />
          <JBSelect<"cover" | "contain" | "fill">
            size="sm"
            label={messages.designerImageFit}
            value={theme.background.imageFit ?? "cover"}
            hideClear
            onChange={event => updateTheme(draft => { draft.background.imageFit = valueFromEvent(event) as "cover" | "contain" | "fill"; })}
          >
            <JBOption value="cover">{messages.designerCover}</JBOption>
            <JBOption value="contain">{messages.designerContain}</JBOption>
            <JBOption value="fill">{messages.designerFill}</JBOption>
          </JBSelect>
          <JBInput
            size="sm"
            label={messages.designerImagePosition}
            placeholder="center"
            value={theme.background.imagePosition ?? ""}
            onInput={event => updateTheme(draft => { draft.background.imagePosition = valueFromEvent(event) || undefined; })}
          />
          <JBInput
            size="sm"
            label={messages.designerOverlayColor}
            placeholder="rgb(0 0 0 / 20%)"
            value={theme.background.imageOverlayColor ?? ""}
            onInput={event => updateTheme(draft => { draft.background.imageOverlayColor = valueFromEvent(event) || undefined; })}
          />
          <input
            ref={uploadRef}
            className={styles.fileInput}
            type="file"
            accept="image/png,image/jpeg,image/webp"
            onChange={event => chooseFile(event.currentTarget.files?.[0])}
          />
          <JBButton size="sm" variant="outline" onClick={() => uploadRef.current?.click()}>
            {messages.designerChooseLocalImage}
          </JBButton>
          {imageLoadState === "error" ? (
            <JBButton size="sm" variant="ghost" onClick={() => setImageRetryVersion(version => version + 1)}>{messages.designerRetryImage}</JBButton>
          ) : null}
          {imageLoadState === "loading" ? <p className={styles.notice} role="status">{messages.designerCheckingImage}</p> : imageNotice ? <p className={styles.notice}>{imageNotice}</p> : null}
        </div>
      ) : null}

      <div className={styles.colorRows}>
        <JBColorInput
          size="sm"
          label={messages.designerBackgroundColor}
          value={theme.background.color}
          onInput={event => updateTheme(draft => { draft.background.color = valueFromEvent(event); })}
        />
        {theme.background.mode === "pattern" ? (
          <JBColorInput
            size="sm"
            label={messages.designerPatternColor}
            value={theme.background.patternColor}
            onInput={event => updateTheme(draft => { draft.background.patternColor = valueFromEvent(event); })}
          />
        ) : null}
      </div>
      {theme.background.mode !== "color" ? (
        <SettingRange
          label={theme.background.mode === "pattern" ? messages.designerPatternOpacity : messages.designerImageOpacity}
          value={theme.background.opacity}
          min={0}
          max={100}
          step={1}
          tickStep={20}
          suffix="%"
          onChange={value => updateTheme(draft => { draft.background.opacity = value; })}
        />
      ) : null}
      {theme.background.mode === "pattern" ? (
        <SettingRange
          label={messages.designerPatternScale}
          value={theme.background.scale}
          min={40}
          max={180}
          step={5}
          tickStep={20}
          suffix="%"
          onChange={value => updateTheme(draft => { draft.background.scale = value; })}
        />
      ) : null}
    </div>
  );

  const renderSectionContent = (section: DesignerSection) => {
    if (section === "background") return renderBackgroundSettings();
    if (section === "colors") {
      return (
        <div className={styles.sectionContent}>
          <p className={styles.sectionIntro}>Set only the colors you want to override. Empty values inherit the JB default.</p>
          <div className={styles.tokenList}>
            {GLOBAL_COLOR_TOKENS.map(token => (
              <div className={styles.tokenField} key={token}>
                <JBColorInput
                  size="sm"
                  label={tokenLabel(token)}
                  value={theme.global[token] ?? ""}
                  onInput={event => updateTheme(draft => { draft.global[token] = valueFromEvent(event) || null; })}
                />
                <code>{token}</code>
              </div>
            ))}
          </div>
        </div>
      );
    }
    if (section === "typography") {
      return (
        <div className={styles.sectionContent}>
          <JBSelect<string>
            size="sm"
            popoverPosition="fixed"
            label="Font family"
            value={theme.typography.fontFamily}
            hideClear
            onChange={event => updateTheme(draft => { draft.typography.fontFamily = valueFromEvent(event); })}
          >
            {fontChoices.map(font => <JBOption key={font.value} value={font.value}>{font.label}</JBOption>)}
          </JBSelect>
          <SettingRange label="Text scale" value={theme.typography.textScale} min={0.8} max={1.5} step={0.05} tickStep={0.2} suffix="×" onChange={value => updateTheme(draft => { draft.typography.textScale = value; })} />
        </div>
      );
    }
    if (section === "sizing") {
      return (
        <div className={styles.sectionContent}>
          <JBSelect<ThemeAudienceSize>
            size="sm"
            popoverPosition="fixed"
            label="Audience size"
            value={theme.sizing.audienceSize}
            hideClear
            onChange={event => updateTheme(draft => { draft.sizing.audienceSize = valueFromEvent(event) as ThemeAudienceSize; })}
          >
            <JBOption value="compact">Compact</JBOption>
            <JBOption value="standard">Standard</JBOption>
            <JBOption value="large">Large</JBOption>
            <JBOption value="extra-large">Extra large</JBOption>
            <JBOption value="custom">Custom</JBOption>
          </JBSelect>
          <JBSelect<ThemeControlSize>
            size="sm"
            popoverPosition="fixed"
            label="Default control size"
            value={theme.defaults.controlSize}
            hideClear
            onChange={event => updateTheme(draft => { draft.defaults.controlSize = valueFromEvent(event) as ThemeControlSize; })}
          >
            <JBOption value="sm">Small</JBOption>
            <JBOption value="md">Medium</JBOption>
            <JBOption value="lg">Large</JBOption>
          </JBSelect>
          <SettingRange label="Spacing scale" value={theme.sizing.spacingScale} min={0.75} max={1.6} step={0.05} tickStep={0.2} suffix="×" onChange={value => updateTheme(draft => { draft.sizing.spacingScale = value; draft.sizing.audienceSize = "custom"; })} />
          <div className={styles.tokenList}>
            {GLOBAL_CONTROL_HEIGHT_TOKENS.map(token => (
              <div className={styles.tokenField} key={token}>
                <JBInput
                  size="sm"
                  label={tokenLabel(token)}
                  placeholder="Use JB default"
                  value={theme.global[token] ?? ""}
                  onInput={event => updateTheme(draft => { draft.global[token] = valueFromEvent(event) || null; })}
                />
                <code>{token}</code>
              </div>
            ))}
          </div>
        </div>
      );
    }
    if (section === "shape") {
      const radius = Number.parseFloat(theme.global["--jb-radius"] ?? "");
      return (
        <div className={styles.sectionContent}>
          <SettingRange label="Corner radius" value={Number.isFinite(radius) ? radius : 0.75} min={0} max={2} step={0.125} tickStep={0.5} suffix="rem" onChange={value => updateTheme(draft => { draft.global["--jb-radius"] = `${value}rem`; })} />
          <div className={styles.tokenList}>
            {GLOBAL_RADIUS_TOKENS.filter(token => token !== "--jb-radius").map(token => (
              <div className={styles.tokenField} key={token}>
                <JBInput
                  size="sm"
                  label={tokenLabel(token)}
                  placeholder="Use JB default"
                  value={theme.global[token] ?? ""}
                  onInput={event => updateTheme(draft => { draft.global[token] = valueFromEvent(event) || null; })}
                />
                <code>{token}</code>
              </div>
            ))}
          </div>
        </div>
      );
    }
    return (
      <div className={styles.sectionContent}>
        <JBSelect<string> size="sm" popoverPosition="fixed" label="Preview component" value="all" hideClear>
          <JBOption value="all">All form controls</JBOption>
          <JBOption value="inputs">Inputs</JBOption>
          <JBOption value="choices">Choices</JBOption>
          <JBOption value="actions">Buttons</JBOption>
        </JBSelect>
        <p className={styles.notice}>Component-specific styling is planned for a later version. This selector only changes the isolated preview.</p>
      </div>
    );
  };

  if (libraryOpen) {
    return (
      <main className={styles.libraryPage}>
        <header className={styles.libraryHeader}>
          <div><span className={styles.brandMark}>JB</span><h1>Your themes</h1></div>
          <div className={styles.libraryActions}>
            <JBButton variant="outline" onClick={openImport}>Import theme</JBButton>
            <JBButton color="primary" onClick={() => setLibraryOpen(false)}>Open designer</JBButton>
          </div>
        </header>
        <p>Open a reusable theme or start with a preset. Themes stay separate from forms.</p>
        {themeLoadNotice ? <p role="alert">{themeLoadNotice}</p> : null}
        {libraryThemes.length > 0 ? (
          <>
            <h2>My themes</h2>
            <section className={styles.libraryGrid} aria-label="My themes">
              {libraryThemes.map(record => (
                <article key={record.id} className={styles.libraryCard}>
                  <button className={styles.libraryCardOpen} type="button" onClick={() => openThemeRecord(record)}>
                    <img src={record.config.background?.type === "pattern" && record.config.background.patternId in PATTERN_ASSETS
                      ? PATTERN_ASSETS[record.config.background.patternId as ThemePatternId]
                      : PATTERN_ASSETS["academic-waves"]} alt="" />
                    <strong>{record.config.name}</strong>
                    <span>{record.id === defaultThemeId ? "Default theme" : record.config.description ?? "Reusable local theme"}</span>
                  </button>
                  <div className={styles.libraryCardActions}>
                    <button type="button" onClick={() => void duplicateTheme(record)}>Duplicate</button>
                    <button type="button" onClick={() => requestThemeDelete(record)}>Delete</button>
                  </div>
                </article>
              ))}
            </section>
          </>
        ) : null}
        <h2>Preset gallery</h2>
        <section className={styles.libraryGrid} aria-label="Theme presets">
          {THEME_PRESETS.map(presetItem => (
            <button key={presetItem.id} type="button" onClick={() => void createFromPreset(presetItem.config, presetItem.id)}>
              <img src={presetItem.thumbnail} alt="" />
              <strong>{presetItem.label}</strong>
              <span>{presetItem.config.description}</span>
            </button>
          ))}
        </section>
        {importOpen ? (
          <div className={styles.modalBackdrop} onMouseDown={event => { if (event.target === event.currentTarget) setImportOpen(false); }}>
            <section className={`${styles.exportModal} ${styles.importModal}`} role="dialog" aria-modal="true" aria-labelledby="import-theme-title" onKeyDown={event => { if (event.key === "Escape") setImportOpen(false); }}>
              <h2 id="import-theme-title">Import theme</h2>
              <p>Paste portable ThemeConfig JSON or choose a <code>.jb-theme.json</code> file. Existing themes are never overwritten.</p>
              <JBTextarea
                className={styles.importJsonInput}
                name="themeImportJson"
                label="Theme JSON"
                placeholder="Paste ThemeConfig JSON"
                value={importJson}
                autoHeight={false}
                autoFocus
                onInput={event => {
                  setImportJson(valueFromEvent(event));
                  setImportFileName("");
                  setImportFileError("");
                  setImportWarningsConfirmed(false);
                  setImportSupportedOnly(false);
                }}
              />
              <div className={styles.importFileRow}>
                <JBButton variant="outline" onClick={() => importFileRef.current?.click()}>Choose theme file</JBButton>
                {importFileName ? <span>{importFileName}</span> : null}
                <input
                  ref={importFileRef}
                  className={styles.hiddenFileInput}
                  type="file"
                  accept="application/json,.json,.jb-theme.json"
                  onChange={event => {
                    const file = event.currentTarget.files?.[0];
                    event.currentTarget.value = "";
                    void chooseImportFile(file);
                  }}
                />
              </div>
              {importFileError ? <p className={styles.importError} role="alert">{importFileError}</p> : null}
              {importValidation?.valid ? (
                <>
                  {importSupportedOnly && importValidation.omittedIssues.length > 0 ? (
                    <div className={styles.importConflict} role="status">
                      <strong>Only supported values will be imported.</strong>
                      <p>The following paths will be omitted:</p>
                      <ul>{importValidation.omittedIssues.slice(0, 8).map(issue => <li key={`${issue.path}:${issue.message}`}><code>{issue.path}</code></li>)}</ul>
                    </div>
                  ) : null}
                  {importValidation.conflicts.name || importValidation.conflicts.slug ? (
                    <p className={styles.importConflict} role="status">
                      A theme already uses this name or URL slug. Import will create an independent copy with a numbered slug.
                    </p>
                  ) : <p className={styles.importValid} role="status">ThemeConfig is valid and ready to import.</p>}
                </>
              ) : importValidation ? (
                <div className={styles.importError} role="alert">
                  <strong>ThemeConfig is not valid.</strong>
                  <ul>{importValidation.issues.slice(0, 8).map(issue => <li key={`${issue.path}:${issue.message}`}><code>{issue.path}</code> {issue.message}</li>)}</ul>
                  {supportedImportValidation?.valid && supportedImportValidation.omittedIssues.length > 0 ? (
                    <JBButton variant="outline" onClick={() => {
                      setImportSupportedOnly(true);
                      setImportWarningsConfirmed(false);
                    }}>Review supported values only</JBButton>
                  ) : null}
                </div>
              ) : null}
              {importValidation?.valid && importValidation.warnings.length > 0 ? (
                <label className={styles.importWarningConsent}>
                  <input type="checkbox" checked={importWarningsConfirmed} onChange={event => setImportWarningsConfirmed(event.currentTarget.checked)} />
                  <span>{importValidation.warnings.join(" ")} Import anyway.</span>
                </label>
              ) : null}
              <div className={styles.importActions}>
                <JBButton variant="ghost" onClick={() => setImportOpen(false)}>Cancel</JBButton>
                {importSupportedOnly ? <JBButton variant="outline" onClick={() => setImportSupportedOnly(false)}>Use strict import</JBButton> : null}
                <JBButton color="primary" disabled={!importValidation?.valid || (importValidation.warnings.length > 0 && !importWarningsConfirmed)} onClick={() => void importTheme()}>
                  {importValidation?.valid && (importValidation.conflicts.name || importValidation.conflicts.slug) ? "Create copy" : importSupportedOnly ? "Import supported values" : "Import theme"}
                </JBButton>
              </div>
            </section>
          </div>
        ) : null}
        {pendingDelete ? (
          <div className={styles.modalBackdrop} onMouseDown={event => { if (!deleteBusy && event.target === event.currentTarget) setPendingDelete(undefined); }}>
            <section className={`${styles.exportModal} ${styles.deleteModal}`} role="dialog" aria-modal="true" aria-labelledby="delete-theme-title" onKeyDown={event => { if (!deleteBusy && event.key === "Escape") setPendingDelete(undefined); }}>
              <h2 id="delete-theme-title">Delete {pendingDelete.config.name}?</h2>
              <p>
                This theme is {pendingDelete.id === defaultThemeId ? "the current default" : "not the default"} and is used by {Object.values(themeBindings).filter(themeId => themeId === pendingDelete.id).length} saved form(s).
                Choose what should replace every reference before deletion.
              </p>
              <JBSelect<string>
                label="Replacement theme"
                value={deleteReplacementId}
                hideClear
                onChange={event => setDeleteReplacementId(valueFromEvent(event))}
              >
                <JBOption value="default">Built-in Default</JBOption>
                {libraryThemes.filter(record => record.id !== pendingDelete.id).map(record => (
                  <JBOption key={record.id} value={record.id}>{record.config.name}</JBOption>
                ))}
              </JBSelect>
              <div>
                <JBButton variant="ghost" disabled={deleteBusy} onClick={() => setPendingDelete(undefined)}>Cancel</JBButton>
                <JBButton color="danger" disabled={deleteBusy} onClick={() => void confirmThemeDelete()}>{deleteBusy ? "Deleting…" : "Replace and delete"}</JBButton>
              </div>
            </section>
          </div>
        ) : null}
      </main>
    );
  }

  const sections: Array<{ id: DesignerSection; label: string }> = [
    { id: "background", label: "Background" },
    { id: "colors", label: "Colors" },
    { id: "typography", label: "Typography" },
    { id: "sizing", label: "Size & spacing" },
    { id: "shape", label: "Shape" },
    { id: "components", label: "Components" },
  ];

  return (
    <div className={styles.designer} dir="ltr">
      <FormRouteHeader layout="editor" className={styles.header}>
        <FormRouteBrand href={formPageHref("landing")} title="Form builder" subtitle="Theme designer" />
        <div className={styles.themeIdentity}>
          <button type="button" className={styles.backButton} onClick={() => setLibraryOpen(true)}>
            <jb-icon-arrow direction="left" />
            <span>Back to themes</span>
          </button>
          <span className={styles.headerDivider} />
        {isEditingName ? (
          <JBInput
            className={styles.nameInput}
            size="sm"
            aria-label="Theme name"
            value={theme.name}
            onInput={event => updateTheme(draft => { draft.name = valueFromEvent(event); })}
            onBlur={() => setIsEditingName(false)}
          />
        ) : (
          <button type="button" className={styles.themeName} onClick={() => setIsEditingName(true)}>
            {theme.name}
            <jb-icon-edit />
          </button>
        )}
        <p className={`${styles.saveState} ${styles[`saveState_${saveStatus}`]}`} aria-live="polite">
          <span aria-hidden="true" />
          {saveStatus === "saving" ? "Saving…" : saveStatus === "invalid" ? "Finish editing" : saveStatus === "error" ? "Save failed" : "Saved"}
        </p>
        </div>
        <div className={styles.headerActions}>
          <JBButton size="sm" variant="ghost" disabled={!history.length} aria-label="Undo" onClick={undo}>Undo</JBButton>
          <JBButton size="sm" variant="ghost" disabled={!future.length} aria-label="Redo" onClick={redo}>Redo</JBButton>
          <JBButton size="sm" variant="ghost" disabled={!themeRecord || defaultThemeId === themeRecord.id} onClick={() => void setCurrentAsDefault()}>
            {themeRecord && defaultThemeId === themeRecord.id ? "Default" : "Set default"}
          </JBButton>
          {formSlug ? (
            <JBButton size="sm" variant="ghost" disabled={!themeRecord || boundThemeId === themeRecord.id} onClick={() => void bindCurrentForm()}>
              {themeRecord && boundThemeId === themeRecord.id ? "Used for this form" : "Use for this form"}
            </JBButton>
          ) : null}
          <JBButton color="primary" onClick={() => { setExportCopied(false); setExportOpen(true); }}>Export theme</JBButton>
        </div>
      </FormRouteHeader>

      <div className={styles.mobileTabs}>
        <JBButton size="sm" variant={mobilePanel === "design" ? "solid" : "ghost"} onClick={() => setMobilePanel("design")}>Design</JBButton>
        <JBButton size="sm" variant={mobilePanel === "preview" ? "solid" : "ghost"} onClick={() => setMobilePanel("preview")}>Preview</JBButton>
      </div>

      <main className={`${layoutStyles.workspace} ${styles.workspace}`} data-mobile-panel={mobilePanel}>
        <aside className={`${layoutStyles.panel} ${styles.settingsPanel}`}>
          <section className={styles.presets}>
            <h2>Presets</h2>
            <div className={styles.presetRow}>
              {THEME_PRESETS.slice(0, 4).map(presetItem => (
                <button
                  key={presetItem.id}
                  type="button"
                  className={activePreset === presetItem.id ? styles.presetSelected : styles.presetButton}
                  onClick={() => commitTheme(presetItem.config, presetItem.id)}
                >
                  <span><img src={presetItem.thumbnail} alt="" /></span>
                  <small>{presetItem.label}</small>
                </button>
              ))}
            </div>
          </section>

          <div className={styles.sections}>
            {sections.map(section => (
              <JBCollapse
                key={section.id}
                title={section.label}
                defaultOpen={section.id === "background"}
              >
                {renderSectionContent(section.id)}
              </JBCollapse>
            ))}
          </div>
          <div className={styles.autosaveNote}>
            Changes are saved automatically
          </div>
        </aside>

        <section className={`${layoutStyles.panel} ${styles.previewPanel}`}>
          <header className={styles.previewToolbar}>
            <div className={styles.previewPicker}>
              <span>Previewing:</span>
              <JBSelect<string>
                size="sm"
                popoverPosition="fixed"
                value={previewSource}
                hideClear
                onChange={event => setPreviewSource(valueFromEvent(event))}
              >
                <JBOption value="sample">Parent permission form</JBOption>
                {canUseStoredForm ? (
                  <JBOption value="stored">
                    {getLocalizedText(
                      storedForm.document.metadata.name,
                      storedForm.document.localization.defaultLocale,
                      storedForm.document.localization.defaultLocale,
                    )}
                  </JBOption>
                ) : null}
              </JBSelect>
            </div>
            <div className={styles.previewTools}>
              <div className={styles.segmented} aria-label="Preview width">
                <JBButton size="sm" variant={viewport === "desktop" ? "solid" : "ghost"} onClick={() => setViewport("desktop")}>Desktop</JBButton>
                <JBButton size="sm" variant={viewport === "mobile" ? "solid" : "ghost"} onClick={() => setViewport("mobile")}>Mobile</JBButton>
              </div>
              <JBButton size="sm" variant="ghost" onClick={() => rendererRef.current?.reset()}>
                <jb-icon-refresh /> Reset
              </JBButton>
            </div>
          </header>

          <div className={styles.previewStage} style={previewThemeStyle}>
            <div className={styles.previewBackdrop} style={backdropStyle} />
            <div className={viewport === "mobile" ? styles.previewMobile : styles.previewDesktop}>
              <div className={styles.formPreview} dir={previewDirection}>
                <img className={styles.emblem} src="/form/theme-patterns/science-club-emblem.png" alt="" />
                <h1>{previewName}</h1>
                {previewDescription ? <p>{previewDescription}</p> : null}
                <div className={styles.rendererWrap}>
                  <JBFormBuilder
                    ref={rendererRef}
                    formDocument={previewDocument}
                    themeConfig={portableTheme}
                    locale={previewLocale}
                    aria-label={`${previewName} preview`}
                    loadDependencies={loadDependencies}
                  />
                </div>
                <small className={styles.privacyNote}>Your information is kept private and used only for this activity.</small>
              </div>
            </div>
          </div>
        </section>
      </main>

      {exportOpen ? (
        <div className={styles.modalBackdrop} role="presentation" onMouseDown={event => {
          if (event.target === event.currentTarget) setExportOpen(false);
        }}>
          <section className={styles.exportModal} role="dialog" aria-modal="true" aria-labelledby="export-title">
            <h2 id="export-title">Export {theme.name}</h2>
            <p>This is the current saved snapshot. Use it as the theme config for JB Form Builder.</p>
            <pre tabIndex={0}>{exportedJson}</pre>
            <div>
              <JBButton variant="ghost" onClick={() => setExportOpen(false)}>Close</JBButton>
              <JBButton color="primary" onClick={async () => {
                try {
                  await navigator.clipboard.writeText(exportedJson);
                  setExportCopied(true);
                } catch {
                  const blob = new Blob([exportedJson], { type: "application/json" });
                  const href = URL.createObjectURL(blob);
                  const anchor = document.createElement("a");
                  anchor.href = href;
                  anchor.download = `${themeSlug(theme.name)}.jb-theme.json`;
                  anchor.click();
                  URL.revokeObjectURL(href);
                }
              }}>{exportCopied ? "Copied" : "Copy JSON"}</JBButton>
            </div>
          </section>
        </div>
      ) : null}
    </div>
  );
}
