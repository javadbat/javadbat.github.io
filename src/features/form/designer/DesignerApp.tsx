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
import { JBOption } from "jb-select/option/react";
import { JBSelect } from "jb-select/react";
import { JBFormBuilder } from "jb-form-builder/react";
import { loadDependencies } from "jb-form-builder/dependency-loader";
import type { JBFormBuilderElement } from "jb-form-builder/types";
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

type SaveStatus = "saving" | "saved" | "error";
type DesignerSection = "background" | "colors" | "typography" | "sizing" | "shape" | "components";
type PreviewViewport = "desktop" | "mobile";
type MobilePanel = "design" | "preview";
type CSSVariables = CSSProperties & Record<`--${string}`, string | number | undefined>;

const patternChoices: Array<{ id: ThemePatternId; label: string }> = [
  { id: "science-doodles", label: "Science doodles" },
  { id: "academic-waves", label: "Academic waves" },
  { id: "calm-dots", label: "Calm dots" },
  { id: "warm-chevrons", label: "Warm chevrons" },
];

const fontChoices = [
  { value: "text-font, fa-font, system-ui, sans-serif", label: "JB Sans" },
  { value: "Georgia, 'Times New Roman', serif", label: "Classic serif" },
  { value: "Verdana, Geneva, sans-serif", label: "Friendly rounded" },
  { value: "ui-monospace, SFMono-Regular, Consolas, monospace", label: "Technical mono" },
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

function tokenLabel(token: GlobalThemeToken): string {
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
  const formSlug = getCurrentFormSlug();
  const selectedThemeSlug = getCurrentThemeSlug();
  const storedForm = useStoredForm(formSlug);
  const storedTheme = useStoredTheme(selectedThemeSlug, formSlug);
  const rendererRef = useRef<JBFormBuilderElement | null>(null);
  const uploadRef = useRef<HTMLInputElement | null>(null);
  const initializingThemeRef = useRef(false);
  const ignoreStaleThemeResolutionRef = useRef(false);
  const themeRecordRef = useRef<StoredThemeRecordV1 | null>(null);
  const editVersionRef = useRef(0);
  const saveQueueRef = useRef<Promise<void>>(Promise.resolve());
  const [theme, setTheme] = useState<DesignerThemeConfig>(() => readStoredTheme());
  const [themeRecord, setThemeRecord] = useState<StoredThemeRecordV1 | null>(null);
  const [libraryThemes, setLibraryThemes] = useState<StoredThemeRecordV1[]>([]);
  const [defaultThemeId, setDefaultThemeId] = useState<string | null>(null);
  const [boundThemeId, setBoundThemeId] = useState<string | null>(null);
  const [themeLoadNotice, setThemeLoadNotice] = useState<string>();
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
      setThemeLoadNotice("The requested theme was not found. Choose a local theme or create one from a preset.");
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
  }, [formSlug, storedTheme]);

  useEffect(() => {
    if (saveStatus !== "saving" || !themeRecord) return;
    const editVersion = editVersionRef.current;
    const config = toPortableThemeConfig(theme);
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
  }, [saveStatus, theme, themeRecord]);

  useEffect(() => () => {
    if (temporaryImage?.startsWith("blob:")) URL.revokeObjectURL(temporaryImage);
  }, [temporaryImage]);

  useEffect(() => {
    if (!libraryOpen) return;
    let active = true;
    void Promise.all([themeRepository.list(), themeRepository.getSettings()]).then(([themes, settings]) => {
      if (!active) return;
      if (themes.ok) setLibraryThemes(themes.value);
      if (settings.ok) setDefaultThemeId(settings.value.defaultThemeId);
    });
    return () => { active = false; };
  }, [libraryOpen]);

  useEffect(() => {
    if (!themeRecord) return;
    let active = true;
    void themeRepository.getSettings().then(result => {
      if (!active || !result.ok) return;
      setDefaultThemeId(result.value.defaultThemeId);
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

  const canUseStoredForm = storedForm.status === "ready";
  const selectedDocument = previewSource === "stored" && canUseStoredForm
    ? storedForm.document
    : DESIGNER_SAMPLE_FORM;
  const previewDocument = useMemo(
    () => withControlSizeDefault(selectedDocument, theme.defaults.controlSize),
    [selectedDocument, theme.defaults.controlSize],
  );
  const previewName = getLocalizedText(
    previewDocument.metadata.name,
    "en",
    previewDocument.localization.defaultLocale,
  );
  const previewDescription = getLocalizedText(
    previewDocument.metadata.description,
    "en",
    previewDocument.localization.defaultLocale,
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

  const portableTheme = useMemo(() => toPortableThemeConfig(theme), [theme]);

  const backdropStyle = useMemo<CSSProperties>(() => {
    if (theme.background.mode === "color") return { display: "none" };
    const source = theme.background.mode === "image"
      ? temporaryImage || theme.background.imageUrl
      : PATTERN_ASSETS[theme.background.patternId];
    if (!source) return { display: "none" };
    return {
      backgroundImage: `url(${JSON.stringify(source)})`,
      backgroundPosition: "center",
      backgroundRepeat: theme.background.mode === "pattern" ? "repeat" : "no-repeat",
      backgroundSize: theme.background.mode === "pattern"
        ? `${Math.max(180, 700 * (theme.background.scale / 100))}px`
        : "cover",
      opacity: theme.background.opacity / 100,
    };
  }, [temporaryImage, theme.background]);

  const exportedJson = useMemo(
    () => JSON.stringify(portableTheme, null, 2),
    [portableTheme],
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
      setImageNotice("This image is larger than 800 KB and cannot be used.");
      return;
    }
    if (file.size > 400 * 1024 && !window.confirm("This image is larger than 400 KB. Use it for this preview anyway?")) {
      return;
    }
    if (temporaryImage?.startsWith("blob:")) URL.revokeObjectURL(temporaryImage);
    const source = URL.createObjectURL(file);
    setTemporaryImage(source);
    setImageNotice("Local images are temporary. Upload the image and use its URL before sharing this theme.");
    updateTheme(draft => {
      draft.background.mode = "image";
      draft.background.imageUrl = undefined;
    });
  };

  const renderBackgroundSettings = () => (
    <div className={styles.sectionContent}>
      <div className={styles.segmented} aria-label="Background type">
        {(["color", "pattern", "image"] as ThemeBackgroundMode[]).map(mode => (
          <JBButton
            key={mode}
            size="sm"
            variant={theme.background.mode === mode ? "solid" : "ghost"}
            color="primary"
            onClick={() => updateTheme(draft => { draft.background.mode = mode; })}
          >
            {mode[0].toUpperCase() + mode.slice(1)}
          </JBButton>
        ))}
      </div>

      {theme.background.mode === "pattern" ? (
        <>
          <p className={styles.settingLabel}>Choose a pattern</p>
          <div className={styles.patternGrid}>
            {patternChoices.map(pattern => (
              <button
                key={pattern.id}
                type="button"
                className={theme.background.patternId === pattern.id ? styles.patternSelected : styles.patternButton}
                aria-label={pattern.label}
                aria-pressed={theme.background.patternId === pattern.id}
                onClick={() => updateTheme(draft => { draft.background.patternId = pattern.id; })}
              >
                <img src={PATTERN_ASSETS[pattern.id]} alt="" />
                {theme.background.patternId === pattern.id ? <span>Selected</span> : null}
              </button>
            ))}
          </div>
        </>
      ) : null}

      {theme.background.mode === "image" ? (
        <div className={styles.imageSettings}>
          <JBInput
            size="sm"
            type="url"
            label="Background image URL"
            placeholder="https://, data:, blob:, or file:"
            value={theme.background.imageUrl ?? ""}
            onInput={event => {
              setTemporaryImage(undefined);
              const value = valueFromEvent(event);
              setImageNotice(value.startsWith("blob:") || value.startsWith("file:")
                ? "Blob and file URLs are temporary. Use a persistent URL before sharing."
                : undefined);
              updateTheme(draft => { draft.background.imageUrl = value || undefined; });
            }}
          />
          <input
            ref={uploadRef}
            className={styles.fileInput}
            type="file"
            accept="image/png,image/jpeg,image/webp"
            onChange={event => chooseFile(event.currentTarget.files?.[0])}
          />
          <JBButton size="sm" variant="outline" onClick={() => uploadRef.current?.click()}>
            Choose local image
          </JBButton>
          {imageNotice ? <p className={styles.notice}>{imageNotice}</p> : null}
        </div>
      ) : null}

      <div className={styles.colorRows}>
        <JBColorInput
          size="sm"
          label="Background color"
          value={theme.background.color}
          onInput={event => updateTheme(draft => { draft.background.color = valueFromEvent(event); })}
        />
        {theme.background.mode === "pattern" ? (
          <JBColorInput
            size="sm"
            label="Pattern color"
            value={theme.background.patternColor}
            onInput={event => updateTheme(draft => { draft.background.patternColor = valueFromEvent(event); })}
          />
        ) : null}
      </div>
      {theme.background.mode !== "color" ? (
        <SettingRange
          label={`${theme.background.mode === "pattern" ? "Pattern" : "Image"} opacity`}
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
          label="Pattern scale"
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
          <JBButton color="primary" onClick={() => setLibraryOpen(false)}>Open designer</JBButton>
        </header>
        <p>Open a reusable theme or start with a preset. Themes stay separate from forms.</p>
        {themeLoadNotice ? <p role="alert">{themeLoadNotice}</p> : null}
        {libraryThemes.length > 0 ? (
          <>
            <h2>My themes</h2>
            <section className={styles.libraryGrid} aria-label="My themes">
              {libraryThemes.map(record => (
                <button key={record.id} type="button" onClick={() => openThemeRecord(record)}>
                  <img src={record.config.background?.type === "pattern" && record.config.background.patternId in PATTERN_ASSETS
                    ? PATTERN_ASSETS[record.config.background.patternId as ThemePatternId]
                    : PATTERN_ASSETS["academic-waves"]} alt="" />
                  <strong>{record.config.name}</strong>
                  <span>{record.id === defaultThemeId ? "Default theme" : record.config.description ?? "Reusable local theme"}</span>
                </button>
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
    <div className={styles.designer}>
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
          {saveStatus === "saving" ? "Saving…" : saveStatus === "error" ? "Save failed" : "Saved"}
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
                    {getLocalizedText(storedForm.document.metadata.name, "en", storedForm.document.localization.defaultLocale)}
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
              <div className={styles.formPreview}>
                <img className={styles.emblem} src="/form/theme-patterns/science-club-emblem.png" alt="" />
                <h1>{previewName}</h1>
                {previewDescription ? <p>{previewDescription}</p> : null}
                <div className={styles.rendererWrap}>
                  <JBFormBuilder
                    ref={rendererRef}
                    formDocument={previewDocument}
                    themeConfig={portableTheme}
                    locale="en"
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
