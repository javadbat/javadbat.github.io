export const THEME_SCHEMA_VERSION = 1 as const;

export const GLOBAL_THEME_TOKENS = [
  "--jb-primary",
  "--jb-secondary",
  "--jb-green",
  "--jb-red",
  "--jb-yellow",
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
  "--jb-radius",
  "--jb-radius-xs",
  "--jb-radius-sm",
  "--jb-radius-lg",
  "--jb-radius-xl",
  "--jb-control-height-xs",
  "--jb-control-height-sm",
  "--jb-control-height-md",
  "--jb-control-height-lg",
  "--jb-control-height-xl",
] as const;

export type GlobalThemeToken = typeof GLOBAL_THEME_TOKENS[number];
export type ThemeControlSize = "sm" | "md" | "lg";
export type ThemeAudienceSize = "compact" | "standard" | "large" | "extra-large" | "custom";

export interface ThemeColorBackground {
  type: "color";
  color: string;
}

export interface ThemePatternBackground {
  type: "pattern";
  patternId: string;
  color?: string;
  foregroundColor?: string;
  opacity?: number;
  scale?: number;
}

export interface ThemeImageBackground {
  type: "image";
  source: string;
  fit?: "cover" | "contain" | "fill";
  position?: string;
  opacity?: number;
  overlayColor?: string;
  fallbackColor?: string;
}

export type ThemeBackground = ThemeColorBackground | ThemePatternBackground | ThemeImageBackground;

/** Portable, form-independent visual configuration consumed by the renderer. */
export interface ThemeConfigV1 {
  $schema?: string;
  schemaVersion: typeof THEME_SCHEMA_VERSION;
  name: string;
  description?: string;
  global?: Partial<Record<GlobalThemeToken, string>>;
  typography?: {
    fontFamily?: string;
    textScale?: number;
  };
  sizing?: {
    audienceSize?: ThemeAudienceSize;
    spacingScale?: number;
  };
  defaults?: {
    controlSize?: ThemeControlSize;
  };
  background?: ThemeBackground;
  components?: Record<string, { tokens: Record<string, string> }>;
}

export interface ThemeConfigIssue {
  path: string;
  message: string;
}

export interface ThemeConfigValidationResult {
  valid: boolean;
  issues: ThemeConfigIssue[];
  config?: ThemeConfigV1;
}

const globalTokenSet = new Set<string>(GLOBAL_THEME_TOKENS);
const controlSizes = new Set<ThemeControlSize>(["sm", "md", "lg"]);
const audienceSizes = new Set<ThemeAudienceSize>(["compact", "standard", "large", "extra-large", "custom"]);
const topLevelKeys = new Set(["$schema", "schemaVersion", "name", "description", "global", "typography", "sizing", "defaults", "background", "components"]);

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function nonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

function finitePositive(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value) && value > 0;
}

function rejectUnknownKeys(value: Record<string, unknown>, allowed: readonly string[], path: string, issues: ThemeConfigIssue[]): void {
  const allowedSet = new Set(allowed);
  for (const key of Object.keys(value)) if (!allowedSet.has(key)) issues.push({ path: `${path}/${key}`, message: "Unsupported ThemeConfig field." });
}

/** Validates untrusted ThemeConfig without changing it or silently dropping values. */
export function validateThemeConfig(value: unknown): ThemeConfigValidationResult {
  const issues: ThemeConfigIssue[] = [];
  if (!isRecord(value)) return { valid: false, issues: [{ path: "/", message: "ThemeConfig must be an object." }] };

  for (const key of Object.keys(value)) if (!topLevelKeys.has(key)) issues.push({ path: `/${key}`, message: "Unsupported ThemeConfig field." });

  if (value.schemaVersion !== THEME_SCHEMA_VERSION) issues.push({ path: "/schemaVersion", message: "Only ThemeConfig schema version 1 is supported." });
  if (!nonEmptyString(value.name)) issues.push({ path: "/name", message: "ThemeConfig name is required." });
  if (value.$schema !== undefined && !nonEmptyString(value.$schema)) issues.push({ path: "/$schema", message: "Schema URL must be a non-empty string." });
  if (value.description !== undefined && !nonEmptyString(value.description)) issues.push({ path: "/description", message: "Description must be a non-empty string when present." });

  if (value.global !== undefined) {
    if (!isRecord(value.global)) issues.push({ path: "/global", message: "Global tokens must be an object." });
    else for (const [token, tokenValue] of Object.entries(value.global)) {
      if (!globalTokenSet.has(token)) issues.push({ path: `/global/${token}`, message: "Unsupported global theme token." });
      if (!nonEmptyString(tokenValue)) issues.push({ path: `/global/${token}`, message: "Theme token values must be non-empty strings." });
    }
  }

  if (value.typography !== undefined) {
    if (!isRecord(value.typography)) issues.push({ path: "/typography", message: "Typography must be an object." });
    else {
      rejectUnknownKeys(value.typography, ["fontFamily", "textScale"], "/typography", issues);
      if (value.typography.fontFamily !== undefined && !nonEmptyString(value.typography.fontFamily)) issues.push({ path: "/typography/fontFamily", message: "Font family must be a non-empty string." });
      if (value.typography.textScale !== undefined && !finitePositive(value.typography.textScale)) issues.push({ path: "/typography/textScale", message: "Text scale must be a positive number." });
    }
  }

  if (value.sizing !== undefined) {
    if (!isRecord(value.sizing)) issues.push({ path: "/sizing", message: "Sizing must be an object." });
    else {
      rejectUnknownKeys(value.sizing, ["audienceSize", "spacingScale"], "/sizing", issues);
      if (value.sizing.audienceSize !== undefined && !audienceSizes.has(value.sizing.audienceSize as ThemeAudienceSize)) issues.push({ path: "/sizing/audienceSize", message: "Unsupported audience size." });
      if (value.sizing.spacingScale !== undefined && !finitePositive(value.sizing.spacingScale)) issues.push({ path: "/sizing/spacingScale", message: "Spacing scale must be a positive number." });
    }
  }

  if (value.defaults !== undefined) {
    if (!isRecord(value.defaults)) issues.push({ path: "/defaults", message: "Defaults must be an object." });
    else {
      rejectUnknownKeys(value.defaults, ["controlSize"], "/defaults", issues);
      if (value.defaults.controlSize !== undefined && !controlSizes.has(value.defaults.controlSize as ThemeControlSize)) issues.push({ path: "/defaults/controlSize", message: "Unsupported default control size." });
    }
  }

  if (value.background !== undefined) {
    if (!isRecord(value.background)) issues.push({ path: "/background", message: "Background must be an object." });
    else if (value.background.type === "color") {
      rejectUnknownKeys(value.background, ["type", "color"], "/background", issues);
      if (!nonEmptyString(value.background.color)) issues.push({ path: "/background/color", message: "Background color is required." });
    } else if (value.background.type === "pattern") {
      rejectUnknownKeys(value.background, ["type", "patternId", "color", "foregroundColor", "opacity", "scale"], "/background", issues);
      if (!nonEmptyString(value.background.patternId)) issues.push({ path: "/background/patternId", message: "Pattern ID is required." });
      for (const key of ["color", "foregroundColor"] as const) if (value.background[key] !== undefined && !nonEmptyString(value.background[key])) issues.push({ path: `/background/${key}`, message: "Background colors must be non-empty strings." });
      if (value.background.opacity !== undefined && (typeof value.background.opacity !== "number" || value.background.opacity < 0 || value.background.opacity > 100)) issues.push({ path: "/background/opacity", message: "Pattern opacity must be between 0 and 100." });
      if (value.background.scale !== undefined && !finitePositive(value.background.scale)) issues.push({ path: "/background/scale", message: "Pattern scale must be a positive number." });
    } else if (value.background.type === "image") {
      rejectUnknownKeys(value.background, ["type", "source", "fit", "position", "opacity", "overlayColor", "fallbackColor"], "/background", issues);
      if (!nonEmptyString(value.background.source) || !/^(https?:|data:image\/(?:png|jpeg|webp);base64,)/i.test(value.background.source)) issues.push({ path: "/background/source", message: "Image source must be HTTP(S) or Base64 PNG, JPEG, or WebP." });
      if (value.background.fit !== undefined && !new Set(["cover", "contain", "fill"]).has(value.background.fit as string)) issues.push({ path: "/background/fit", message: "Unsupported image fit." });
      if (value.background.position !== undefined && !nonEmptyString(value.background.position)) issues.push({ path: "/background/position", message: "Image position must be a non-empty string." });
      if (value.background.opacity !== undefined && (typeof value.background.opacity !== "number" || value.background.opacity < 0 || value.background.opacity > 100)) issues.push({ path: "/background/opacity", message: "Image opacity must be between 0 and 100." });
      for (const key of ["overlayColor", "fallbackColor"] as const) if (value.background[key] !== undefined && !nonEmptyString(value.background[key])) issues.push({ path: `/background/${key}`, message: "Background colors must be non-empty strings." });
    } else issues.push({ path: "/background/type", message: "Unsupported background type." });
  }

  if (value.components !== undefined) {
    if (!isRecord(value.components)) issues.push({ path: "/components", message: "Components must be an object." });
    else for (const [tagName, component] of Object.entries(value.components)) {
      if (!/^[a-z][a-z0-9]*-[a-z0-9-]+$/.test(tagName)) issues.push({ path: `/components/${tagName}`, message: "Component keys must be custom-element tag names." });
      if (!isRecord(component) || !isRecord(component.tokens)) {
        issues.push({ path: `/components/${tagName}/tokens`, message: "Component tokens must be an object." });
        continue;
      }
      rejectUnknownKeys(component, ["tokens"], `/components/${tagName}`, issues);
      for (const [token, tokenValue] of Object.entries(component.tokens)) {
        if (!token.startsWith("--jb-")) issues.push({ path: `/components/${tagName}/tokens/${token}`, message: "Unsupported component token name." });
        if (!nonEmptyString(tokenValue)) issues.push({ path: `/components/${tagName}/tokens/${token}`, message: "Component token values must be non-empty strings." });
      }
    }
  }

  return issues.length === 0
    ? { valid: true, issues, config: structuredClone(value) as unknown as ThemeConfigV1 }
    : { valid: false, issues };
}

function sortedStringMap(value: Record<string, unknown> | undefined): Record<string, string> | undefined {
  if (!value) return undefined;
  const entries = Object.entries(value)
    .filter((entry): entry is [string, string] => nonEmptyString(entry[1]))
    .map(([key, item]) => [key, item.trim()] as const)
    .sort(([left], [right]) => left.localeCompare(right));
  return entries.length > 0 ? Object.fromEntries(entries) : undefined;
}

/** Produces deterministic sparse JSON after validation. */
export function canonicalizeThemeConfig(value: unknown): ThemeConfigV1 {
  const result = validateThemeConfig(value);
  if (!result.valid || !result.config) throw new TypeError(result.issues.map(issue => `${issue.path}: ${issue.message}`).join("\n"));
  const source = result.config;
  const canonical = {
    ...(source.$schema?.trim() ? { $schema: source.$schema.trim() } : {}),
    schemaVersion: 1,
    name: source.name.trim(),
  } as ThemeConfigV1;
  if (source.description?.trim()) canonical.description = source.description.trim();
  const global = sortedStringMap(source.global);
  if (global) canonical.global = global;
  if (source.typography && (source.typography.fontFamily || source.typography.textScale !== undefined)) canonical.typography = {
    ...(source.typography.fontFamily ? { fontFamily: source.typography.fontFamily.trim() } : {}),
    ...(source.typography.textScale !== undefined ? { textScale: source.typography.textScale } : {}),
  };
  if (source.sizing && (source.sizing.audienceSize || source.sizing.spacingScale !== undefined)) canonical.sizing = { ...source.sizing };
  if (source.defaults?.controlSize) canonical.defaults = { controlSize: source.defaults.controlSize };
  if (source.background) canonical.background = structuredClone(source.background);
  if (source.components) {
    const components = Object.entries(source.components).sort(([left], [right]) => left.localeCompare(right)).flatMap(([tag, entry]) => {
      const tokens = sortedStringMap(entry.tokens);
      return tokens ? [[tag, { tokens }] as const] : [];
    });
    if (components.length > 0) canonical.components = Object.fromEntries(components);
  }
  return canonical;
}
