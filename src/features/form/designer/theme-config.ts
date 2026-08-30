import { canonicalizeThemeConfig, type ThemeConfigV1 } from "jb-form-builder/contract/theme";
import { withCalculatedThemeColors } from "./theme-color-calculator";

export type ThemePatternId =
  | "science-doodles"
  | "academic-waves"
  | "calm-dots"
  | "warm-chevrons";

export type ThemeBackgroundMode = "color" | "pattern" | "image";
export type ThemeControlSize = "sm" | "md" | "lg";
export type ThemeAudienceSize = "compact" | "standard" | "large" | "extra-large" | "custom";

export const GLOBAL_COLOR_TOKENS = [
  "--jb-primary",
  "--jb-primary-l",
  "--jb-primary-d",
  "--jb-primary-contrast",
  "--jb-primary-subtle",
  "--jb-primary-hover",
  "--jb-primary-pressed",
  "--jb-secondary",
  "--jb-secondary-l",
  "--jb-secondary-d",
  "--jb-secondary-contrast",
  "--jb-secondary-subtle",
  "--jb-secondary-hover",
  "--jb-secondary-pressed",
  "--jb-green",
  "--jb-green-l",
  "--jb-green-d",
  "--jb-green-contrast",
  "--jb-green-subtle",
  "--jb-green-hover",
  "--jb-green-pressed",
  "--jb-red",
  "--jb-red-l",
  "--jb-red-d",
  "--jb-red-contrast",
  "--jb-red-subtle",
  "--jb-red-hover",
  "--jb-red-pressed",
  "--jb-yellow",
  "--jb-yellow-l",
  "--jb-yellow-d",
  "--jb-yellow-contrast",
  "--jb-yellow-subtle",
  "--jb-yellow-hover",
  "--jb-yellow-pressed",
  "--jb-neutral",
  "--jb-neutral-0",
  "--jb-neutral-1",
  "--jb-neutral-2",
  "--jb-neutral-3",
  "--jb-neutral-4",
  "--jb-neutral-5",
  "--jb-neutral-6",
  "--jb-neutral-7",
  "--jb-neutral-8",
  "--jb-neutral-9",
  "--jb-neutral-10",
  "--jb-text-primary",
  "--jb-text-secondary",
  "--jb-text-contrast",
  "--jb-black",
  "--jb-white",
  "--jb-highlight",
] as const;

export const GLOBAL_RADIUS_TOKENS = [
  "--jb-radius",
  "--jb-radius-xs",
  "--jb-radius-sm",
  "--jb-radius-lg",
  "--jb-radius-xl",
] as const;

export const GLOBAL_CONTROL_HEIGHT_TOKENS = [
  "--jb-control-height-xs",
  "--jb-control-height-sm",
  "--jb-control-height-md",
  "--jb-control-height-lg",
  "--jb-control-height-xl",
] as const;

export type GlobalColorToken = typeof GLOBAL_COLOR_TOKENS[number];
export type GlobalRadiusToken = typeof GLOBAL_RADIUS_TOKENS[number];
export type GlobalControlHeightToken = typeof GLOBAL_CONTROL_HEIGHT_TOKENS[number];
export type GlobalThemeToken = GlobalColorToken | GlobalRadiusToken | GlobalControlHeightToken;

export interface DesignerThemeConfig {
  schemaVersion: 1;
  name: string;
  description?: string;
  global: Partial<Record<GlobalThemeToken, string | null | undefined>>;
  typography: {
    fontFamily: string;
    textScale: number;
  };
  sizing: {
    audienceSize: ThemeAudienceSize;
    spacingScale: number;
  };
  defaults: {
    controlSize: ThemeControlSize;
  };
  background: {
    mode: ThemeBackgroundMode;
    color: string;
    patternId: ThemePatternId;
    patternColor: string;
    opacity: number;
    scale: number;
    imageUrl?: string;
    imageFit?: "cover" | "contain" | "fill";
    imagePosition?: string;
    imageOverlayColor?: string;
  };
}

export interface ThemePreset {
  id: string;
  label: string;
  thumbnail: string;
  config: DesignerThemeConfig;
}

export const PATTERN_ASSETS: Record<ThemePatternId, string> = {
  "science-doodles": "/form/theme-patterns/science-doodles.png",
  "academic-waves": "/form/theme-patterns/academic-waves.png",
  "calm-dots": "/form/theme-patterns/calm-dots.png",
  "warm-chevrons": "/form/theme-patterns/warm-chevrons.png",
};

const rosePop: DesignerThemeConfig = {
  schemaVersion: 1,
  name: "Rose Pop",
  description: "A bright, friendly theme for children and families.",
  global: {
    "--jb-primary": "#2455E8",
    "--jb-secondary": "#FF7D83",
    "--jb-text-primary": "#101B48",
    "--jb-radius": "0.75rem",
  },
  typography: {
    fontFamily: "text-font, fa-font, system-ui, sans-serif",
    textScale: 1.08,
  },
  sizing: {
    audienceSize: "large",
    spacingScale: 1.1,
  },
  defaults: { controlSize: "lg" },
  background: {
    mode: "pattern",
    color: "#FFF9F9",
    patternId: "science-doodles",
    patternColor: "#FF8990",
    opacity: 28,
    scale: 100,
  },
};

function preset(
  id: string,
  label: string,
  patternId: ThemePatternId,
  overrides: Partial<DesignerThemeConfig["global"]>,
  backgroundColor: string,
): ThemePreset {
  return {
    id,
    label,
    thumbnail: PATTERN_ASSETS[patternId],
    config: {
      ...rosePop,
      name: label,
      global: { ...rosePop.global, ...overrides },
      typography: { ...rosePop.typography },
      sizing: { ...rosePop.sizing },
      defaults: { ...rosePop.defaults },
      background: {
        ...rosePop.background,
        color: backgroundColor,
        patternId,
      },
    },
  };
}

export const THEME_PRESETS: ThemePreset[] = [
  { id: "rose-pop", label: "Rose Pop", thumbnail: PATTERN_ASSETS["science-doodles"], config: rosePop },
  preset("electric-play", "Electric Play", "calm-dots", {
    "--jb-primary": "#0959F7",
    "--jb-secondary": "#00B887",
  }, "#F4FBFF"),
  preset("academic", "Academic", "academic-waves", {
    "--jb-primary": "#3156B8",
    "--jb-secondary": "#8497CB",
  }, "#F8FAFF"),
  preset("professional", "Professional", "warm-chevrons", {
    "--jb-primary": "#173B73",
    "--jb-secondary": "#63738D",
  }, "#FBFCFE"),
  preset("classroom", "Classroom", "calm-dots", {
    "--jb-primary": "#157A78",
    "--jb-secondary": "#F0A34A",
  }, "#F6FCFA"),
  preset("technical", "Technical", "academic-waves", {
    "--jb-primary": "#1369A8",
    "--jb-secondary": "#08A3A3",
  }, "#F5FAFD"),
  preset("calm", "Calm", "warm-chevrons", {
    "--jb-primary": "#65739C",
    "--jb-secondary": "#A78EBC",
  }, "#FBF9FC"),
  preset("high-contrast", "High Contrast", "calm-dots", {
    "--jb-primary": "#0039CC",
    "--jb-secondary": "#A53500",
    "--jb-text-primary": "#080B16",
  }, "#FFFFFF"),
];

export const DEFAULT_DESIGNER_THEME = cloneTheme(rosePop);
export const THEME_STORAGE_KEY = "jb-form-designer-theme-v1";

export function cloneTheme(theme: DesignerThemeConfig): DesignerThemeConfig {
  return structuredClone(theme);
}

export function readStoredTheme(): DesignerThemeConfig {
  if (typeof window === "undefined") return cloneTheme(DEFAULT_DESIGNER_THEME);
  try {
    const value = window.localStorage.getItem(THEME_STORAGE_KEY);
    if (!value) return cloneTheme(DEFAULT_DESIGNER_THEME);
    const parsed = JSON.parse(value) as DesignerThemeConfig;
    return parsed.schemaVersion === 1 ? parsed : cloneTheme(DEFAULT_DESIGNER_THEME);
  } catch {
    return cloneTheme(DEFAULT_DESIGNER_THEME);
  }
}

export function canonicalTheme(theme: DesignerThemeConfig): DesignerThemeConfig {
  const canonical = cloneTheme(theme);
  canonical.global = Object.fromEntries(
    Object.entries(canonical.global)
      .filter(([, value]) => typeof value === "string" && value.trim() !== "")
      .sort(([left], [right]) => left.localeCompare(right)),
  ) as DesignerThemeConfig["global"];
  if (!canonical.description?.trim()) delete canonical.description;
  if (!canonical.background.imageUrl?.trim()) delete canonical.background.imageUrl;
  return JSON.parse(JSON.stringify(canonical)) as DesignerThemeConfig;
}

/** Converts editor state to the standalone sparse contract used by exports and the renderer. */
export function toPortableThemeConfig(theme: DesignerThemeConfig): ThemeConfigV1 {
  const background: ThemeConfigV1["background"] = theme.background.mode === "color"
    ? { type: "color", color: theme.background.color }
    : theme.background.mode === "pattern"
      ? {
          type: "pattern",
          patternId: theme.background.patternId,
          color: theme.background.color,
          foregroundColor: theme.background.patternColor,
          opacity: theme.background.opacity,
          scale: theme.background.scale,
        }
      : theme.background.imageUrl
        ? {
            type: "image",
            source: theme.background.imageUrl,
            fit: theme.background.imageFit,
            position: theme.background.imagePosition,
            opacity: theme.background.opacity,
            overlayColor: theme.background.imageOverlayColor,
            fallbackColor: theme.background.color,
          }
        : { type: "color", color: theme.background.color };

  return canonicalizeThemeConfig({
    schemaVersion: 1,
    name: theme.name,
    description: theme.description,
    global: Object.fromEntries(Object.entries(withCalculatedThemeColors(theme.global)).filter((entry): entry is [GlobalThemeToken, string] => typeof entry[1] === "string" && entry[1].trim() !== "")),
    typography: { ...theme.typography },
    sizing: { ...theme.sizing },
    defaults: { ...theme.defaults },
    background,
  });
}

/** Hydrates persisted portable data into the current friendly-control editor model. */
export function fromPortableThemeConfig(config: ThemeConfigV1): DesignerThemeConfig {
  const theme = cloneTheme(DEFAULT_DESIGNER_THEME);
  theme.name = config.name;
  if (config.description) theme.description = config.description;
  else delete theme.description;
  theme.global = { ...(config.global ?? {}) };
  theme.typography = { ...theme.typography, ...config.typography };
  theme.sizing = { ...theme.sizing, ...config.sizing };
  theme.defaults = { ...theme.defaults, ...config.defaults };

  if (config.background?.type === "color") {
    theme.background.mode = "color";
    theme.background.color = config.background.color;
  } else if (config.background?.type === "pattern") {
    theme.background.mode = "pattern";
    if (config.background.patternId in PATTERN_ASSETS) theme.background.patternId = config.background.patternId as ThemePatternId;
    if (config.background.color) theme.background.color = config.background.color;
    if (config.background.foregroundColor) theme.background.patternColor = config.background.foregroundColor;
    if (config.background.opacity !== undefined) theme.background.opacity = config.background.opacity;
    if (config.background.scale !== undefined) theme.background.scale = config.background.scale;
  } else if (config.background?.type === "image") {
    theme.background.mode = "image";
    theme.background.imageUrl = config.background.source;
    theme.background.imageFit = config.background.fit;
    theme.background.imagePosition = config.background.position;
    theme.background.imageOverlayColor = config.background.overlayColor;
    if (config.background.fallbackColor) theme.background.color = config.background.fallbackColor;
    if (config.background.opacity !== undefined) theme.background.opacity = config.background.opacity;
  }
  return theme;
}
