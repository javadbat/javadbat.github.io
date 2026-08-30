import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type MouseEvent as ReactMouseEvent,
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
import { registryByType } from "jb-form-builder/registry/form-element-registry";
import type { JBFormBuilderElement } from "jb-form-builder/types";
import type { ThemeConfigV1 } from "jb-form-builder/contract/theme";
import "jb-icons/arrow";
import "jb-icons/edit";
import "jb-icons/refresh";
import { formPageHref, getCurrentFormSlug, getCurrentThemeSlug } from "../application/form-page-url";
import { useStoredForm } from "../application/use-stored-form";
import { useStoredTheme } from "../application/use-stored-theme";
import { getLocalizedText, walkFormElements, type JBFormDocumentV1 } from "../domain/form-document";
import { FormRouteBrand, FormRouteHeader, FormRouteLinkButton } from "../layout/FormRouteHeader";
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
  type GlobalColorToken,
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
import {
  BASE_THEME_COLOR_TOKENS,
  calculateColorGroup,
  recalculateAllThemeColors,
  withCalculatedThemeColors,
  type BaseThemeColorToken,
} from "./theme-color-calculator";

type SaveStatus = "saving" | "saved" | "invalid" | "error";
type DesignerSection = "background" | "colors" | "typography" | "sizing" | "shape" | "components";
type PreviewViewport = "desktop" | "mobile";
type MobilePanel = "design" | "preview";
type ComponentPreview = "all" | "inputs" | "choices" | "actions";
type CSSVariables = CSSProperties & Record<`--${string}`, string | number | undefined>;
type ThemeSizeCode = "xs" | "sm" | "md" | "lg" | "xl";

const allGlobalThemeTokens: readonly GlobalThemeToken[] = [
  ...GLOBAL_COLOR_TOKENS,
  ...GLOBAL_RADIUS_TOKENS,
  ...GLOBAL_CONTROL_HEIGHT_TOKENS,
];

const legacyColorFallbacks: Partial<Record<GlobalThemeToken, `--${string}`>> = {
  "--jb-neutral-0": "--jb-neutral",
  "--jb-text-primary": "--jb-content-primary",
  "--jb-text-secondary": "--jb-content-secondary",
  "--jb-text-contrast": "--jb-content-inverse",
};

function isolateComponentPreview(document: JBFormDocumentV1, preview: ComponentPreview): JBFormDocumentV1 {
  if (preview === "all") return document;
  const categoryMatches = (category: string | undefined): boolean => preview === "choices"
    ? category === "Choice"
    : preview === "actions"
      ? category === "Action"
      : category !== undefined && !new Set(["Container", "Content", "Choice", "Action"]).has(category);
  const matchingElements = walkFormElements(document.elements).filter(element => categoryMatches(registryByType.get(element.type)?.category));
  const fallbackElements = walkFormElements(DESIGNER_SAMPLE_FORM.elements).filter(element => categoryMatches(registryByType.get(element.type)?.category));
  return {
    ...document,
    elements: matchingElements.length > 0 ? matchingElements : fallbackElements,
  };
}

function readCssVariableDefaults(): Partial<Record<GlobalThemeToken, string>> {
  if (typeof document === "undefined") return {};
  const rootStyle = getComputedStyle(document.documentElement);
  const values: Partial<Record<GlobalThemeToken, string>> = {};
  for (const token of allGlobalThemeTokens) {
    if (GLOBAL_COLOR_TOKENS.includes(token as typeof GLOBAL_COLOR_TOKENS[number])) {
      const probe = document.createElement("span");
      const fallback = legacyColorFallbacks[token];
      probe.style.color = `var(${token}${fallback ? `, var(${fallback}, transparent)` : ", transparent"})`;
      probe.style.display = "none";
      document.body.append(probe);
      const resolved = getComputedStyle(probe).color.trim();
      probe.remove();
      if (resolved && resolved !== "transparent" && resolved !== "rgba(0, 0, 0, 0)") values[token] = resolved;
      continue;
    }
    const resolved = rootStyle.getPropertyValue(token).trim();
    if (resolved) values[token] = resolved;
  }
  return values;
}

function useCssVariableDefaults(): Partial<Record<GlobalThemeToken, string>> {
  const [defaults, setDefaults] = useState<Partial<Record<GlobalThemeToken, string>>>(readCssVariableDefaults);
  useEffect(() => setDefaults(readCssVariableDefaults()), []);
  return defaults;
}

function cssLengthToRem(value: string): number {
  const numeric = Number.parseFloat(value);
  if (!Number.isFinite(numeric)) return Number.NaN;
  if (value.trim().toLowerCase().endsWith("px") && typeof document !== "undefined") {
    const rootFontSize = Number.parseFloat(getComputedStyle(document.documentElement).fontSize);
    return rootFontSize > 0 ? numeric / rootFontSize : numeric / 16;
  }
  return numeric;
}

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

function downloadThemeJson(json: string, slug: string): void {
  const blob = new Blob([json], { type: "application/json" });
  const href = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = href;
  anchor.download = `${slug}.jb-theme.json`;
  anchor.click();
  URL.revokeObjectURL(href);
}

const BLANK_DESIGNER_THEME: DesignerThemeConfig = {
  schemaVersion: 1,
  name: "Untitled theme",
  global: {},
  typography: {
    fontFamily: "text-font, fa-font, system-ui, sans-serif",
    textScale: 1,
  },
  sizing: {
    audienceSize: "standard",
    spacingScale: 1,
  },
  defaults: { controlSize: "md" },
  background: {
    mode: "color",
    color: "#FFFFFF",
    patternId: "academic-waves",
    patternColor: "#3156B8",
    opacity: 20,
    scale: 100,
  },
};

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

function colorVariantLabel(token: GlobalColorToken, baseToken: BaseThemeColorToken | undefined, locale: FormAppLocale): string {
  if (!baseToken || token === baseToken || !token.startsWith(`${baseToken}-`)) return tokenLabel(token, locale);
  const variant = token.slice(baseToken.length + 1);
  if (/^\d+$/.test(variant)) return locale === "fa" ? `درجه ${variant}` : `Shade ${variant}`;
  const labels: Record<string, readonly [string, string]> = {
    l: ["Light", "روشن"],
    d: ["Dark", "تیره"],
    contrast: ["Contrast", "متضاد"],
    subtle: ["Subtle", "ملایم"],
    hover: ["Hover", "اشاره‌گر"],
    pressed: ["Pressed", "فشرده"],
  };
  const label = labels[variant];
  return label ? label[locale === "fa" ? 1 : 0] : tokenLabel(token, locale);
}

function SettingRange({
  label,
  message,
  value,
  min,
  max,
  step,
  tickStep,
  suffix,
  onChange,
}: {
  label: string;
  message?: string;
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
        message={message}
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
  const cssVariableDefaults = useCssVariableDefaults();
  const sizeLabel = (size: ThemeSizeCode): string => ({
    xs: messages.designerExtraSmall,
    sm: messages.designerSmall,
    md: messages.designerMedium,
    lg: messages.designerLarge,
    xl: messages.designerExtraLarge,
  })[size];
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
  const saveInFlightRef = useRef<Promise<boolean> | null>(null);
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
  const rendererTheme = useMemo<ThemeConfigV1>(() => {
    const config = structuredClone(portableTheme);
    delete config.background;
    return config;
  }, [portableTheme]);
  const [themeRecord, setThemeRecord] = useState<StoredThemeRecordV1 | null>(null);
  const [libraryThemes, setLibraryThemes] = useState<StoredThemeRecordV1[]>([]);
  const [defaultThemeId, setDefaultThemeId] = useState<string | null>(null);
  const [boundThemeId, setBoundThemeId] = useState<string | null>(null);
  const [themeBindings, setThemeBindings] = useState<Record<string, string>>({});
  const [themeLoadNotice, setThemeLoadNotice] = useState<string>();
  const [themeSearch, setThemeSearch] = useState("");
  const [createOpen, setCreateOpen] = useState(false);
  const [createName, setCreateName] = useState("");
  const [createDescription, setCreateDescription] = useState("");
  const [createSource, setCreateSource] = useState("blank");
  const [createError, setCreateError] = useState("");
  const [createBusy, setCreateBusy] = useState(false);
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
  const [componentPreview, setComponentPreview] = useState<ComponentPreview>("all");
  const [isEditingName, setIsEditingName] = useState(false);
  const [libraryOpen, setLibraryOpen] = useState(false);
  const [exportOpen, setExportOpen] = useState(false);
  const [exportCopied, setExportCopied] = useState(false);
  const [advancedColorsOpen, setAdvancedColorsOpen] = useState(false);
  const [advancedColorDraft, setAdvancedColorDraft] = useState<DesignerThemeConfig["global"]>({});
  const [temporaryImage, setTemporaryImage] = useState<string>();
  const [imageNotice, setImageNotice] = useState<string>();
  const [imageLoadState, setImageLoadState] = useState<"idle" | "loading" | "ready" | "error">("idle");
  const [imageRetryVersion, setImageRetryVersion] = useState(0);
  const normalizedThemeSearch = themeSearch.trim().toLocaleLowerCase(locale);
  const filteredLibraryThemes = useMemo(() => {
    if (!normalizedThemeSearch) return libraryThemes;
    return libraryThemes.filter(record => `${record.config.name} ${record.config.description ?? ""}`.toLocaleLowerCase(locale).includes(normalizedThemeSearch));
  }, [libraryThemes, locale, normalizedThemeSearch]);
  const filteredThemePresets = useMemo(() => {
    if (!normalizedThemeSearch) return THEME_PRESETS;
    return THEME_PRESETS.filter(presetItem => `${presetItem.label} ${presetItem.config.description ?? ""}`.toLocaleLowerCase(locale).includes(normalizedThemeSearch));
  }, [locale, normalizedThemeSearch]);
  const showBuiltInTheme = !normalizedThemeSearch || `${messages.designerDefaultTheme} ${messages.designerBuiltInDefault} ${messages.designerBuiltInThemeDescription}`
    .toLocaleLowerCase(locale)
    .includes(normalizedThemeSearch);
  const hasThemeSearchResults = showBuiltInTheme || filteredLibraryThemes.length > 0 || filteredThemePresets.length > 0;

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

  const saveCurrentTheme = useCallback((): Promise<boolean> => {
    if (saveInFlightRef.current) return saveInFlightRef.current;
    if (!portableThemeState.valid) {
      setSaveStatus("invalid");
      return Promise.resolve(false);
    }
    const editVersion = editVersionRef.current;
    const config = portableTheme;
    setSaveStatus("saving");
    const operation = saveQueueRef.current.then(async () => {
      const linked = themeRecordRef.current;
      if (!linked) {
        setSaveStatus("error");
        return false;
      }
      const result = await themeRepository.save({ id: linked.id, revision: linked.revision, config });
      if (!result.ok) {
        setSaveStatus("error");
        return false;
      }
      themeRecordRef.current = result.value;
      setThemeRecord(result.value);
      if (editVersionRef.current === editVersion) setSaveStatus("saved");
      return true;
    });
    saveInFlightRef.current = operation;
    saveQueueRef.current = operation.then(() => undefined, () => undefined);
    void operation.finally(() => {
      if (saveInFlightRef.current === operation) saveInFlightRef.current = null;
    });
    return operation;
  }, [portableTheme, portableThemeState.valid]);

  useEffect(() => {
    if (saveStatus !== "saving" || !themeRecord) return;
    const timer = window.setTimeout(() => {
      void saveCurrentTheme();
    }, 500);
    return () => window.clearTimeout(timer);
  }, [saveCurrentTheme, saveStatus, themeRecord]);

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

  const openCreate = () => {
    setCreateName("");
    setCreateDescription("");
    setCreateSource("blank");
    setCreateError("");
    setCreateBusy(false);
    setCreateOpen(true);
  };

  const createTheme = async () => {
    const name = createName.trim();
    if (!name) {
      setCreateError(messages.designerThemeNameRequired);
      return;
    }
    const preset = THEME_PRESETS.find(item => item.id === createSource);
    const config = cloneTheme(preset?.config ?? BLANK_DESIGNER_THEME);
    config.name = name;
    const description = createDescription.trim();
    if (description) config.description = description;
    else delete config.description;
    setCreateBusy(true);
    const result = await themeRepository.create(toPortableThemeConfig(config));
    setCreateBusy(false);
    if (!result.ok) {
      setCreateError(result.error.message);
      return;
    }
    setCreateOpen(false);
    openThemeRecord(result.value);
    setActivePreset(preset?.id ?? "");
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

  const exportThemeRecord = (record: StoredThemeRecordV1) => {
    downloadThemeJson(JSON.stringify(record.config, null, 2), record.slug);
  };

  const setLibraryThemeAsDefault = async (record: StoredThemeRecordV1) => {
    const result = await themeRepository.setDefault(record.id);
    if (!result.ok) {
      setThemeLoadNotice(result.error.message);
      return;
    }
    setDefaultThemeId(record.id);
    setThemeBindings(result.value.bindings);
    setThemeLoadNotice(message("designerDefaultSuccess", { name: record.config.name }));
  };

  const setBuiltInThemeAsDefault = async () => {
    const result = await themeRepository.setDefault(null);
    if (!result.ok) {
      setThemeLoadNotice(result.error.message);
      return;
    }
    setDefaultThemeId(null);
    setThemeBindings(result.value.bindings);
    setThemeLoadNotice(messages.designerBuiltInDefaultSuccess);
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

  const requestDesignerLeave = useCallback(async (leave: () => void) => {
    if (saveStatus === "invalid" || saveStatus === "error") {
      window.alert(messages.designerNavigationBlocked);
      return;
    }
    if (saveStatus === "saving" && !await saveCurrentTheme()) return;
    if (temporaryImage && !window.confirm(messages.designerTemporaryLeaveConfirm)) return;
    leave();
  }, [messages.designerNavigationBlocked, messages.designerTemporaryLeaveConfirm, saveCurrentTheme, saveStatus, temporaryImage]);

  const handleDesignerNavigationCapture = (event: ReactMouseEvent<HTMLDivElement>) => {
    if (saveStatus === "saved" && !temporaryImage) return;
    const anchor = (event.target as Element).closest("a[href]") as HTMLAnchorElement | null;
    if (!anchor || event.button !== 0) return;
    event.preventDefault();
    const href = anchor.href;
    void requestDesignerLeave(() => window.location.assign(href));
  };

  useEffect(() => {
    if (saveStatus === "saved" && !temporaryImage) return;
    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      event.returnValue = "";
    };
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [saveStatus, temporaryImage]);

  const canUseStoredForm = storedForm.status === "ready";
  const selectedDocument = previewSource === "stored" && canUseStoredForm
    ? storedForm.document
    : DESIGNER_SAMPLE_FORM;
  const componentPreviewDocument = useMemo(
    () => isolateComponentPreview(selectedDocument, componentPreview),
    [componentPreview, selectedDocument],
  );
  const previewDocument = useMemo(
    () => withControlSizeDefault(componentPreviewDocument, theme.defaults.controlSize),
    [componentPreviewDocument, theme.defaults.controlSize],
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

  const setBaseThemeColor = (token: BaseThemeColorToken, value: string) => {
    updateTheme(draft => {
      Object.assign(draft.global, calculateColorGroup(token, value));
    });
  };

  const openAdvancedColors = () => {
    setAdvancedColorDraft(withCalculatedThemeColors(theme.global) as DesignerThemeConfig["global"]);
    setAdvancedColorsOpen(true);
  };

  const saveAdvancedColors = () => {
    updateTheme(draft => { draft.global = { ...advancedColorDraft }; });
    setAdvancedColorsOpen(false);
  };

  const advancedColorGroups: Array<{
    id: string;
    title: string;
    description: string;
    baseToken?: BaseThemeColorToken;
    tokens: GlobalColorToken[];
  }> = [
    { id: "primary", title: messages.designerPrimaryPalette, description: messages.designerSemanticPaletteHelp, baseToken: "--jb-primary", tokens: GLOBAL_COLOR_TOKENS.filter(token => token === "--jb-primary" || token.startsWith("--jb-primary-")) },
    { id: "secondary", title: messages.designerSecondaryPalette, description: messages.designerSemanticPaletteHelp, baseToken: "--jb-secondary", tokens: GLOBAL_COLOR_TOKENS.filter(token => token === "--jb-secondary" || token.startsWith("--jb-secondary-")) },
    { id: "green", title: messages.designerSuccessPalette, description: messages.designerSemanticPaletteHelp, baseToken: "--jb-green", tokens: GLOBAL_COLOR_TOKENS.filter(token => token === "--jb-green" || token.startsWith("--jb-green-")) },
    { id: "red", title: messages.designerErrorPalette, description: messages.designerSemanticPaletteHelp, baseToken: "--jb-red", tokens: GLOBAL_COLOR_TOKENS.filter(token => token === "--jb-red" || token.startsWith("--jb-red-")) },
    { id: "yellow", title: messages.designerWarningPalette, description: messages.designerSemanticPaletteHelp, baseToken: "--jb-yellow", tokens: GLOBAL_COLOR_TOKENS.filter(token => token === "--jb-yellow" || token.startsWith("--jb-yellow-")) },
    { id: "neutral", title: messages.designerNeutralPalette, description: messages.designerNeutralPaletteHelp, baseToken: "--jb-neutral", tokens: GLOBAL_COLOR_TOKENS.filter(token => token === "--jb-neutral" || token.startsWith("--jb-neutral-")) },
    {
      id: "foundations",
      title: messages.designerFoundationColors,
      description: messages.designerFoundationColorsHelp,
      tokens: ["--jb-text-primary", "--jb-text-secondary", "--jb-text-contrast", "--jb-black", "--jb-white", "--jb-highlight"],
    },
  ];

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
      const quickColorGroups: Array<{ title: string; description: string; tokens: BaseThemeColorToken[] }> = [
        {
          title: messages.designerBrandColors,
          description: messages.designerBrandColorsHelp,
          tokens: ["--jb-primary", "--jb-secondary", "--jb-neutral"],
        },
        {
          title: messages.designerFeedbackColors,
          description: messages.designerFeedbackColorsHelp,
          tokens: ["--jb-green", "--jb-red", "--jb-yellow"],
        },
      ];
      return (
        <div className={styles.sectionContent}>
          <p className={styles.sectionIntro}>{messages.designerColorsIntro}</p>
          {quickColorGroups.map(group => (
            <section className={styles.colorGroupCard} key={group.title}>
              <div className={styles.colorGroupHeading}>
                <strong>{group.title}</strong>
                <span>{group.description}</span>
              </div>
              <div className={styles.quickColorGrid}>
                {group.tokens.map(token => {
                  const baseValue = theme.global[token] ?? cssVariableDefaults[token] ?? "";
                  const calculated = calculateColorGroup(token, baseValue);
                  return (
                    <div className={styles.quickColorField} key={token}>
                      <JBColorInput
                        size="sm"
                        label={tokenLabel(token, locale)}
                        message={theme.global[token] == null ? messages.designerInheritedDefault : messages.designerShadesCalculated}
                        value={baseValue}
                        onInput={event => setBaseThemeColor(token, valueFromEvent(event))}
                      />
                      <div className={styles.calculatedSwatches} aria-label={messages.designerCalculatedPalette}>
                        {Object.entries(calculated).slice(0, token === "--jb-neutral" ? 12 : 7).map(([shadeToken, color]) => (
                          <span key={shadeToken} style={{ backgroundColor: color ?? "transparent" }} title={shadeToken} />
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>
          ))}
          <div className={styles.advancedColorCallout}>
            <div>
              <strong>{messages.designerAdvancedColors}</strong>
              <span>{messages.designerAdvancedColorsHelp}</span>
            </div>
            <JBButton size="sm" variant="outline" onClick={openAdvancedColors}>{messages.designerCustomizeEveryColor}</JBButton>
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
            label={messages.designerFontFamily}
            value={theme.typography.fontFamily}
            hideClear
            onChange={event => updateTheme(draft => { draft.typography.fontFamily = valueFromEvent(event); })}
          >
            {fontChoices.map(font => <JBOption key={font.value} value={font.value}>{messages[font.labelKey]}</JBOption>)}
          </JBSelect>
          <SettingRange label={messages.designerTextScale} value={theme.typography.textScale} min={0.8} max={1.5} step={0.05} tickStep={0.2} suffix="×" onChange={value => updateTheme(draft => { draft.typography.textScale = value; })} />
        </div>
      );
    }
    if (section === "sizing") {
      return (
        <div className={styles.sectionContent}>
          <JBSelect<ThemeAudienceSize>
            size="sm"
            popoverPosition="fixed"
            label={messages.designerAudienceSize}
            value={theme.sizing.audienceSize}
            hideClear
            onChange={event => updateTheme(draft => { draft.sizing.audienceSize = valueFromEvent(event) as ThemeAudienceSize; })}
          >
            <JBOption value="compact">{messages.designerCompact}</JBOption>
            <JBOption value="standard">{messages.designerStandard}</JBOption>
            <JBOption value="large">{messages.designerLarge}</JBOption>
            <JBOption value="extra-large">{messages.designerExtraLarge}</JBOption>
            <JBOption value="custom">{messages.designerCustom}</JBOption>
          </JBSelect>
          <JBSelect<ThemeControlSize>
            size="sm"
            popoverPosition="fixed"
            label={messages.designerDefaultControlSize}
            value={theme.defaults.controlSize}
            hideClear
            onChange={event => updateTheme(draft => { draft.defaults.controlSize = valueFromEvent(event) as ThemeControlSize; })}
          >
            <JBOption value="sm">{messages.designerSmall}</JBOption>
            <JBOption value="md">{messages.designerMedium}</JBOption>
            <JBOption value="lg">{messages.designerLarge}</JBOption>
          </JBSelect>
          <SettingRange label={messages.designerSpacingScale} value={theme.sizing.spacingScale} min={0.75} max={1.6} step={0.05} tickStep={0.2} suffix="×" onChange={value => updateTheme(draft => { draft.sizing.spacingScale = value; draft.sizing.audienceSize = "custom"; })} />
          <div className={styles.tokenList}>
            {GLOBAL_CONTROL_HEIGHT_TOKENS.map(token => (
              <div className={styles.tokenField} key={token}>
                <JBInput
                  size="sm"
                  label={message("designerControlHeightLabel", { size: sizeLabel(token.slice("--jb-control-height-".length) as ThemeSizeCode) })}
                  message={theme.global[token] == null
                    ? `${message("designerControlHeightHelp", { size: sizeLabel(token.slice("--jb-control-height-".length) as ThemeSizeCode) })} ${messages.designerInheritedDefault}`
                    : message("designerControlHeightHelp", { size: sizeLabel(token.slice("--jb-control-height-".length) as ThemeSizeCode) })}
                  value={theme.global[token] ?? cssVariableDefaults[token] ?? ""}
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
      const radiusSize: Record<typeof GLOBAL_RADIUS_TOKENS[number], ThemeSizeCode> = {
        "--jb-radius": "md",
        "--jb-radius-xs": "xs",
        "--jb-radius-sm": "sm",
        "--jb-radius-lg": "lg",
        "--jb-radius-xl": "xl",
      };
      return (
        <div className={styles.sectionContent}>
          {GLOBAL_RADIUS_TOKENS.map(token => {
            const size = sizeLabel(radiusSize[token]);
            const inherited = theme.global[token] == null;
            const radius = cssLengthToRem(theme.global[token] ?? cssVariableDefaults[token] ?? "");
            return (
              <div className={styles.tokenField} key={token}>
                <SettingRange
                  label={message("designerCornerRadiusLabel", { size })}
                  message={`${message("designerCornerRadiusHelp", { size })}${inherited ? ` ${messages.designerInheritedDefault}` : ""}`}
                  value={Number.isFinite(radius) ? radius : 0}
                  min={0}
                  max={2}
                  step={0.125}
                  tickStep={0.5}
                  suffix="rem"
                  onChange={value => updateTheme(draft => { draft.global[token] = `${value}rem`; })}
                />
                <code>{token}</code>
              </div>
            );
          })}
        </div>
      );
    }
    return (
      <div className={styles.sectionContent}>
        <div className={styles.componentPreviewControl} role="group" aria-label={messages.designerPreviewComponent}>
          <span>{messages.designerPreviewComponent}</span>
          <div>
            <JBButton size="sm" variant={componentPreview === "all" ? "solid" : "outline"} onClick={() => setComponentPreview("all")}>{messages.designerAllControls}</JBButton>
            <JBButton size="sm" variant={componentPreview === "inputs" ? "solid" : "outline"} onClick={() => setComponentPreview("inputs")}>{messages.designerInputs}</JBButton>
            <JBButton size="sm" variant={componentPreview === "choices" ? "solid" : "outline"} onClick={() => setComponentPreview("choices")}>{messages.designerChoices}</JBButton>
            <JBButton size="sm" variant={componentPreview === "actions" ? "solid" : "outline"} onClick={() => setComponentPreview("actions")}>{messages.designerButtons}</JBButton>
          </div>
        </div>
        <p className={styles.notice}>{messages.designerComponentsNotice}</p>
      </div>
    );
  };

  if (libraryOpen) {
    return (
      <main className={styles.libraryPage} dir={direction}>
        <header className={styles.libraryHeader}>
          <div><span className={styles.brandMark}>JB</span><h1>{messages.designerYourThemes}</h1></div>
          <div className={styles.libraryActions}>
            <JBSelect<FormAppLocale> className={styles.languageSelect} size="sm" aria-label={messages.designerLanguage} value={locale} hideClear onChange={event => setLocale(valueFromEvent(event) as FormAppLocale)}>
              <JBOption value="en">EN</JBOption>
              <JBOption value="fa">FA</JBOption>
            </JBSelect>
            <JBButton variant="outline" onClick={openCreate}>{messages.designerCreateTheme}</JBButton>
            <JBButton variant="outline" onClick={openImport}>{messages.designerImportTheme}</JBButton>
            <JBButton color="primary" onClick={() => setLibraryOpen(false)}>{messages.designerOpenDesigner}</JBButton>
          </div>
        </header>
        <p>{messages.designerLibraryDescription}</p>
        <div className={styles.libraryToolbar}>
          <JBInput size="sm" label={messages.designerSearchThemes} value={themeSearch} onInput={event => setThemeSearch(valueFromEvent(event))} />
        </div>
        {themeLoadNotice ? <p role="alert">{themeLoadNotice}</p> : null}
        {showBuiltInTheme ? (
          <>
            <h2>{messages.designerDefaultTheme}</h2>
            <section className={styles.libraryGrid} aria-label={messages.designerDefaultTheme}>
              <article className={styles.libraryCard}>
                <div className={`${styles.libraryCardOpen} ${styles.libraryCardStatic}`}>
                  <div className={styles.builtInThemePreview} aria-hidden="true"><span>JB</span></div>
                  <strong>{messages.designerBuiltInDefault}</strong>
                  <span>{messages.designerBuiltInThemeDescription}</span>
                </div>
                <div className={styles.libraryCardActions}>
                  <button type="button" disabled={defaultThemeId === null} onClick={() => void setBuiltInThemeAsDefault()}>
                    {defaultThemeId === null ? messages.designerDefault : messages.designerSetDefault}
                  </button>
                </div>
              </article>
            </section>
          </>
        ) : null}
        {filteredLibraryThemes.length > 0 ? (
          <>
            <h2>{messages.designerMyThemes}</h2>
            <section className={styles.libraryGrid} aria-label={messages.designerMyThemes}>
              {filteredLibraryThemes.map(record => (
                <article key={record.id} className={styles.libraryCard}>
                  <button className={styles.libraryCardOpen} type="button" onClick={() => openThemeRecord(record)}>
                    <img src={record.config.background?.type === "pattern" && record.config.background.patternId in PATTERN_ASSETS
                      ? PATTERN_ASSETS[record.config.background.patternId as ThemePatternId]
                      : PATTERN_ASSETS["academic-waves"]} alt="" />
                    <strong>{record.config.name}</strong>
                    <span>{record.id === defaultThemeId ? messages.designerDefaultTheme : record.config.description ?? messages.designerReusableTheme}</span>
                  </button>
                  <div className={styles.libraryCardActions}>
                    <button type="button" onClick={() => openThemeRecord(record)}>{messages.designerEdit}</button>
                    <button type="button" onClick={() => void duplicateTheme(record)}>{messages.designerDuplicate}</button>
                    <button type="button" onClick={() => exportThemeRecord(record)}>{messages.designerExportTheme}</button>
                    <button type="button" disabled={record.id === defaultThemeId} onClick={() => void setLibraryThemeAsDefault(record)}>
                      {record.id === defaultThemeId ? messages.designerDefault : messages.designerSetDefault}
                    </button>
                    <button className={styles.deleteThemeAction} type="button" onClick={() => requestThemeDelete(record)}>{messages.designerDelete}</button>
                  </div>
                </article>
              ))}
            </section>
          </>
        ) : null}
        {filteredThemePresets.length > 0 ? (
          <>
            <h2>{messages.designerPresetGallery}</h2>
            <section className={styles.libraryGrid} aria-label={messages.designerThemePresets}>
              {filteredThemePresets.map(presetItem => (
                <button key={presetItem.id} type="button" onClick={() => void createFromPreset(presetItem.config, presetItem.id)}>
                  <img src={presetItem.thumbnail} alt="" />
                  <strong>{presetItem.label}</strong>
                  <span>{presetItem.config.description}</span>
                </button>
              ))}
            </section>
          </>
        ) : null}
        {!hasThemeSearchResults ? <p className={styles.libraryEmpty}>{messages.designerNoThemeResults}</p> : null}
        {createOpen ? (
          <div className={styles.modalBackdrop} onMouseDown={event => { if (!createBusy && event.target === event.currentTarget) setCreateOpen(false); }}>
            <section className={`${styles.exportModal} ${styles.createModal}`} role="dialog" aria-modal="true" aria-labelledby="create-theme-title" onKeyDown={event => { if (!createBusy && event.key === "Escape") setCreateOpen(false); }}>
              <h2 id="create-theme-title">{messages.designerCreateTheme}</h2>
              <p>{messages.designerCreateDescription}</p>
              <JBSelect<string> label={messages.designerStartFrom} value={createSource} hideClear onChange={event => setCreateSource(valueFromEvent(event))}>
                <JBOption value="blank">{messages.designerBlankTheme}</JBOption>
                {THEME_PRESETS.map(presetItem => <JBOption key={presetItem.id} value={presetItem.id}>{presetItem.label}</JBOption>)}
              </JBSelect>
              <JBInput label={messages.designerThemeName} value={createName} autoFocus onInput={event => { setCreateName(valueFromEvent(event)); setCreateError(""); }} />
              <JBTextarea name="themeDescription" label={messages.designerThemeDescription} value={createDescription} onInput={event => setCreateDescription(valueFromEvent(event))} />
              {createError ? <p className={styles.importError} role="alert">{createError}</p> : null}
              <div>
                <JBButton variant="ghost" disabled={createBusy} onClick={() => setCreateOpen(false)}>{messages.designerCancel}</JBButton>
                <JBButton color="primary" disabled={createBusy} onClick={() => void createTheme()}>{createBusy ? messages.designerCreating : messages.designerCreateTheme}</JBButton>
              </div>
            </section>
          </div>
        ) : null}
        {importOpen ? (
          <div className={styles.modalBackdrop} onMouseDown={event => { if (event.target === event.currentTarget) setImportOpen(false); }}>
            <section className={`${styles.exportModal} ${styles.importModal}`} role="dialog" aria-modal="true" aria-labelledby="import-theme-title" onKeyDown={event => { if (event.key === "Escape") setImportOpen(false); }}>
              <h2 id="import-theme-title">{messages.designerImportTheme}</h2>
              <p>{messages.designerImportDescription}</p>
              <JBTextarea
                className={styles.importJsonInput}
                name="themeImportJson"
                label={messages.designerThemeJson}
                placeholder={messages.designerPasteThemeJson}
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
                <JBButton variant="outline" onClick={() => importFileRef.current?.click()}>{messages.designerChooseThemeFile}</JBButton>
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
                      <strong>{messages.designerSupportedOnly}</strong>
                      <p>{messages.designerOmittedPaths}</p>
                      <ul>{importValidation.omittedIssues.slice(0, 8).map(issue => <li key={`${issue.path}:${issue.message}`}><code>{issue.path}</code></li>)}</ul>
                    </div>
                  ) : null}
                  {importValidation.conflicts.name || importValidation.conflicts.slug ? (
                    <p className={styles.importConflict} role="status">
                      {messages.designerImportConflict}
                    </p>
                  ) : <p className={styles.importValid} role="status">{messages.designerImportReady}</p>}
                </>
              ) : importValidation ? (
                <div className={styles.importError} role="alert">
                  <strong>{messages.designerImportInvalid}</strong>
                  <ul>{importValidation.issues.slice(0, 8).map(issue => <li key={`${issue.path}:${issue.message}`}><code>{issue.path}</code> {issue.message}</li>)}</ul>
                  {supportedImportValidation?.valid && supportedImportValidation.omittedIssues.length > 0 ? (
                    <JBButton variant="outline" onClick={() => {
                      setImportSupportedOnly(true);
                      setImportWarningsConfirmed(false);
                    }}>{messages.designerReviewSupported}</JBButton>
                  ) : null}
                </div>
              ) : null}
              {importValidation?.valid && importValidation.warnings.length > 0 ? (
                <label className={styles.importWarningConsent}>
                  <input type="checkbox" checked={importWarningsConfirmed} onChange={event => setImportWarningsConfirmed(event.currentTarget.checked)} />
                  <span>{importValidation.warnings.join(" ")} {messages.designerImportAnyway}</span>
                </label>
              ) : null}
              <div className={styles.importActions}>
                <JBButton variant="ghost" onClick={() => setImportOpen(false)}>{messages.designerCancel}</JBButton>
                {importSupportedOnly ? <JBButton variant="outline" onClick={() => setImportSupportedOnly(false)}>{messages.designerUseStrictImport}</JBButton> : null}
                <JBButton color="primary" disabled={!importValidation?.valid || (importValidation.warnings.length > 0 && !importWarningsConfirmed)} onClick={() => void importTheme()}>
                  {importValidation?.valid && (importValidation.conflicts.name || importValidation.conflicts.slug) ? messages.designerCreateCopy : importSupportedOnly ? messages.designerImportSupported : messages.designerImportTheme}
                </JBButton>
              </div>
            </section>
          </div>
        ) : null}
        {pendingDelete ? (
          <div className={styles.modalBackdrop} onMouseDown={event => { if (!deleteBusy && event.target === event.currentTarget) setPendingDelete(undefined); }}>
            <section className={`${styles.exportModal} ${styles.deleteModal}`} role="dialog" aria-modal="true" aria-labelledby="delete-theme-title" onKeyDown={event => { if (!deleteBusy && event.key === "Escape") setPendingDelete(undefined); }}>
              <h2 id="delete-theme-title">{message("designerDeleteTitle", { name: pendingDelete.config.name })}</h2>
              <p>
                {message("designerDeleteDescription", {
                  status: pendingDelete.id === defaultThemeId ? messages.designerCurrentDefault : messages.designerNotDefault,
                  count: Object.values(themeBindings).filter(themeId => themeId === pendingDelete.id).length,
                })}
              </p>
              <JBSelect<string>
                label={messages.designerReplacementTheme}
                value={deleteReplacementId}
                hideClear
                onChange={event => setDeleteReplacementId(valueFromEvent(event))}
              >
                <JBOption value="default">{messages.designerBuiltInDefault}</JBOption>
                {libraryThemes.filter(record => record.id !== pendingDelete.id).map(record => (
                  <JBOption key={record.id} value={record.id}>{record.config.name}</JBOption>
                ))}
              </JBSelect>
              <div>
                <JBButton variant="ghost" disabled={deleteBusy} onClick={() => setPendingDelete(undefined)}>{messages.designerCancel}</JBButton>
                <JBButton color="danger" disabled={deleteBusy} onClick={() => void confirmThemeDelete()}>{deleteBusy ? messages.designerDeleting : messages.designerReplaceDelete}</JBButton>
              </div>
            </section>
          </div>
        ) : null}
      </main>
    );
  }

  const sections: Array<{ id: DesignerSection; label: string }> = [
    { id: "background", label: messages.designerBackground },
    { id: "colors", label: messages.designerColors },
    { id: "typography", label: messages.designerTypography },
    { id: "sizing", label: messages.designerSizeSpacing },
    { id: "shape", label: messages.designerShape },
    { id: "components", label: messages.designerComponents },
  ];

  return (
    <div className={styles.designer} dir={direction} onClickCapture={handleDesignerNavigationCapture}>
      <FormRouteHeader layout="editor" className={styles.header}>
        <FormRouteBrand href={formPageHref("landing")} title={messages.designerBrandTitle} subtitle={messages.designerBrandSubtitle} />
        <div className={styles.themeIdentity}>
          <button type="button" className={styles.backButton} onClick={() => void requestDesignerLeave(() => setLibraryOpen(true))}>
            <jb-icon-arrow direction={direction === "rtl" ? "right" : "left"} />
            <span>{messages.designerBackThemes}</span>
          </button>
          <span className={styles.headerDivider} />
        {isEditingName ? (
          <JBInput
            className={styles.nameInput}
            size="sm"
            aria-label={messages.designerThemeName}
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
          {saveStatus === "saving" ? messages.designerSaving : saveStatus === "invalid" ? messages.designerFinishEditing : saveStatus === "error" ? messages.designerSaveFailed : messages.designerSaved}
        </p>
        </div>
        <div className={styles.headerActions}>
          <FormRouteLinkButton href={formPageHref("builder", formSlug)}>{messages.builder}</FormRouteLinkButton>
          <FormRouteLinkButton href={formPageHref("preview", formSlug, themeRecord?.slug)} variant="outline">{messages.preview}</FormRouteLinkButton>
          <JBSelect<FormAppLocale> className={styles.languageSelect} size="sm" aria-label={messages.designerLanguage} value={locale} hideClear onChange={event => setLocale(valueFromEvent(event) as FormAppLocale)}>
            <JBOption value="en">EN</JBOption>
            <JBOption value="fa">FA</JBOption>
          </JBSelect>
          <JBButton size="sm" variant="ghost" disabled={!history.length} aria-label={messages.designerUndo} onClick={undo}>{messages.designerUndo}</JBButton>
          <JBButton size="sm" variant="ghost" disabled={!future.length} aria-label={messages.designerRedo} onClick={redo}>{messages.designerRedo}</JBButton>
          {saveStatus === "error" ? <JBButton size="sm" variant="outline" onClick={() => void saveCurrentTheme()}>{messages.designerRetrySave}</JBButton> : null}
          <JBButton size="sm" variant="ghost" disabled={!themeRecord || defaultThemeId === themeRecord.id} onClick={() => void setCurrentAsDefault()}>
            {themeRecord && defaultThemeId === themeRecord.id ? messages.designerDefault : messages.designerSetDefault}
          </JBButton>
          {formSlug ? (
            <JBButton size="sm" variant="ghost" disabled={!themeRecord || boundThemeId === themeRecord.id} onClick={() => void bindCurrentForm()}>
              {themeRecord && boundThemeId === themeRecord.id ? messages.designerUsedForForm : messages.designerUseForForm}
            </JBButton>
          ) : null}
          <JBButton color="primary" onClick={() => { setExportCopied(false); setExportOpen(true); }}>{messages.designerExportTheme}</JBButton>
        </div>
      </FormRouteHeader>

      <div className={styles.mobileTabs}>
        <JBButton size="sm" variant={mobilePanel === "design" ? "solid" : "ghost"} onClick={() => setMobilePanel("design")}>{messages.designerDesign}</JBButton>
        <JBButton size="sm" variant={mobilePanel === "preview" ? "solid" : "ghost"} onClick={() => setMobilePanel("preview")}>{messages.designerPreview}</JBButton>
      </div>

      <main className={`${layoutStyles.workspace} ${styles.workspace}`} data-mobile-panel={mobilePanel}>
        <aside className={`${layoutStyles.panel} ${styles.settingsPanel}`}>
          <section className={styles.presets}>
            <h2>{messages.designerPresets}</h2>
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
            {messages.designerAutosave}
          </div>
        </aside>

        <section className={`${layoutStyles.panel} ${styles.previewPanel}`}>
          <header className={styles.previewToolbar}>
            <div className={styles.previewPicker}>
              <span>{messages.designerPreviewing}</span>
              <JBSelect<string>
                size="sm"
                popoverPosition="fixed"
                value={previewSource}
                hideClear
                onChange={event => setPreviewSource(valueFromEvent(event))}
              >
                <JBOption value="sample">{messages.designerSampleForm}</JBOption>
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
              <div className={styles.segmented} aria-label={messages.designerPreviewWidth}>
                <JBButton size="sm" variant={viewport === "desktop" ? "solid" : "ghost"} onClick={() => setViewport("desktop")}>{messages.designerDesktop}</JBButton>
                <JBButton size="sm" variant={viewport === "mobile" ? "solid" : "ghost"} onClick={() => setViewport("mobile")}>{messages.designerMobile}</JBButton>
              </div>
              <JBButton size="sm" variant="ghost" onClick={() => rendererRef.current?.reset()}>
                <jb-icon-refresh /> {messages.designerReset}
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
                    themeConfig={rendererTheme}
                    locale={previewLocale}
                    aria-label={`${previewName} ${messages.designerPreview}`}
                    loadDependencies={loadDependencies}
                  />
                </div>
                <small className={styles.privacyNote}>{messages.designerPrivacy}</small>
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
            <h2 id="export-title">{messages.designerExportTheme}: {theme.name}</h2>
            <p>{messages.designerExportDescription}</p>
            <pre tabIndex={0}>{exportedJson}</pre>
            <div>
              <JBButton variant="ghost" onClick={() => setExportOpen(false)}>{messages.designerClose}</JBButton>
              <JBButton color="primary" onClick={async () => {
                try {
                  await navigator.clipboard.writeText(exportedJson);
                  setExportCopied(true);
                } catch {
                  downloadThemeJson(exportedJson, themeSlug(theme.name));
                }
              }}>{exportCopied ? messages.designerCopied : messages.designerCopyJson}</JBButton>
            </div>
          </section>
        </div>
      ) : null}
      {advancedColorsOpen ? (
        <div className={styles.modalBackdrop} role="presentation" onMouseDown={event => {
          if (event.target === event.currentTarget) setAdvancedColorsOpen(false);
        }}>
          <section className={`${styles.exportModal} ${styles.advancedColorsModal}`} role="dialog" aria-modal="true" aria-labelledby="advanced-colors-title" onKeyDown={event => {
            if (event.key === "Escape") setAdvancedColorsOpen(false);
          }}>
            <header>
              <div>
                <h2 id="advanced-colors-title">{messages.designerAdvancedColors}</h2>
                <p>{messages.designerAdvancedColorsModalHelp}</p>
              </div>
              <JBButton size="sm" variant="ghost" onClick={() => setAdvancedColorDraft(recalculateAllThemeColors(advancedColorDraft) as DesignerThemeConfig["global"])}>
                {messages.designerRestoreCalculatedColors}
              </JBButton>
            </header>
            <div className={styles.advancedColorGroups}>
              {advancedColorGroups.map(group => {
                const baseValue = group.baseToken
                  ? advancedColorDraft[group.baseToken] ?? cssVariableDefaults[group.baseToken] ?? ""
                  : undefined;
                const derivedTokens = group.baseToken ? group.tokens.filter(token => token !== group.baseToken) : group.tokens;
                return (
                  <section
                    className={`${styles.advancedColorGroup} ${group.baseToken ? styles.calculatedColorGroup : styles.foundationColorGroup}`}
                    key={group.id}
                    style={baseValue ? ({ "--advanced-group-color": baseValue } as CSSVariables) : undefined}
                  >
                    <header className={styles.advancedColorGroupHeader}>
                      {baseValue ? <span className={styles.advancedGroupSwatch} style={{ backgroundColor: baseValue }} /> : null}
                      <div>
                        <h3>{group.title}</h3>
                        <p>{group.description}</p>
                      </div>
                    </header>
                    {group.baseToken ? (
                      <div className={styles.advancedBaseToken}>
                        <span className={styles.baseColorBadge}>{messages.designerBaseColor}</span>
                        <JBColorInput
                          size="md"
                          label={tokenLabel(group.baseToken, locale)}
                          message={messages.designerBaseColorHelp}
                          value={baseValue}
                          onInput={event => {
                            const value = valueFromEvent(event);
                            setAdvancedColorDraft(current => ({ ...current, ...calculateColorGroup(group.baseToken!, value) }));
                          }}
                        />
                        <code>{group.baseToken}</code>
                      </div>
                    ) : null}
                    <div className={styles.advancedDerivedGrid}>
                      {derivedTokens.map(token => (
                        <div className={`${styles.tokenField} ${styles.advancedDerivedToken}`} key={token}>
                          <JBColorInput
                            size="sm"
                            label={colorVariantLabel(token, group.baseToken, locale)}
                            value={advancedColorDraft[token] ?? cssVariableDefaults[token] ?? ""}
                            onInput={event => setAdvancedColorDraft(current => ({ ...current, [token]: valueFromEvent(event) || null }))}
                          />
                          <code>{token}</code>
                        </div>
                      ))}
                    </div>
                  </section>
                );
              })}
            </div>
            <footer>
              <span>{messages.designerAdvancedChangesApplyOnSave}</span>
              <div>
                <JBButton variant="ghost" onClick={() => setAdvancedColorsOpen(false)}>{messages.designerCancel}</JBButton>
                <JBButton color="primary" onClick={saveAdvancedColors}>{messages.designerApplyColors}</JBButton>
              </div>
            </footer>
          </section>
        </div>
      ) : null}
    </div>
  );
}
