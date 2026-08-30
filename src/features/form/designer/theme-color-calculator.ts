import {
  JBColor,
  createThemeColor,
  getNeutralColor,
  type ColorGroupsKey,
  type OklchParams,
} from "jb-core/theme";

export const THEME_COLOR_GROUPS = ["primary", "secondary", "green", "red", "yellow"] as const;
export type ThemeColorGroup = typeof THEME_COLOR_GROUPS[number];

export const BASE_THEME_COLOR_TOKENS = [
  "--jb-primary",
  "--jb-secondary",
  "--jb-green",
  "--jb-red",
  "--jb-yellow",
  "--jb-neutral",
] as const;

export type BaseThemeColorToken = typeof BASE_THEME_COLOR_TOKENS[number];
export type ThemeColorValues = Record<string, string | null | undefined>;

const groupProperties = ["main", "light", "dark", "contrast", "subtle", "hover", "pressed"] as const;

function colorValue(color: JBColor): string {
  const lightness = Number(color.lightness.toFixed(4));
  const chroma = Number(color.chroma.toFixed(4));
  const hue = Number(color.hue.toFixed(2));
  return `oklch(${lightness} ${chroma} ${hue})`;
}

function toOklch(value: string): OklchParams | null {
  const source = value.trim().toLowerCase();
  const oklch = /^oklch\(\s*([\d.]+)(%)?\s+([\d.]+)\s+([\d.]+)(?:deg)?(?:\s*\/[^)]+)?\s*\)$/.exec(source);
  if (oklch) {
    const lightness = Number(oklch[1]) / (oklch[2] ? 100 : 1);
    return { lightness, chroma: Number(oklch[3]), hue: Number(oklch[4]) };
  }

  let channels: number[] | null = null;
  if (source.startsWith("#")) {
    const hex = source.slice(1);
    if ([3, 4, 6, 8].includes(hex.length) && /^[\da-f]+$/.test(hex)) {
      const expanded = hex.length <= 4 ? [...hex].map(character => character + character).join("") : hex;
      channels = [0, 2, 4].map(start => Number.parseInt(expanded.slice(start, start + 2), 16));
    }
  } else {
    const rgb = /^rgba?\(([^)]+)\)$/.exec(source);
    if (rgb) {
      const body = rgb[1].split("/")[0].replaceAll(",", " ").trim().split(/\s+/).slice(0, 3);
      if (body.length === 3) channels = body.map(channel => channel.endsWith("%") ? Number.parseFloat(channel) * 2.55 : Number.parseFloat(channel));
    }
  }
  if (!channels || channels.some(channel => !Number.isFinite(channel))) return null;

  const linear = channels.map(channel => {
    const normalized = Math.min(255, Math.max(0, channel)) / 255;
    return normalized <= 0.04045 ? normalized / 12.92 : ((normalized + 0.055) / 1.055) ** 2.4;
  });
  const [red, green, blue] = linear;
  const lRoot = Math.cbrt(0.4122214708 * red + 0.5363325363 * green + 0.0514459929 * blue);
  const mRoot = Math.cbrt(0.2119034982 * red + 0.6806995451 * green + 0.1073969566 * blue);
  const sRoot = Math.cbrt(0.0883024619 * red + 0.2817188376 * green + 0.6299787005 * blue);
  const lightness = 0.2104542553 * lRoot + 0.793617785 * mRoot - 0.0040720468 * sRoot;
  const a = 1.9779984951 * lRoot - 2.428592205 * mRoot + 0.4505937099 * sRoot;
  const b = 0.0259040371 * lRoot + 0.7827717662 * mRoot - 0.808675766 * sRoot;
  return {
    lightness,
    chroma: Math.sqrt(a * a + b * b),
    hue: (Math.atan2(b, a) * 180 / Math.PI + 360) % 360,
  };
}

function calculateSemanticGroup(group: ThemeColorGroup, value: string): ThemeColorValues {
  const color = toOklch(value);
  if (!color) return { [`--jb-${group}`]: value };
  const generated = createThemeColor({ [group]: color } as Partial<Record<ColorGroupsKey, OklchParams>>)[group];
  if (!generated) return { [`--jb-${group}`]: value };

  return Object.fromEntries(groupProperties.map(property => {
    const generatedColor = generated[property];
    return [generatedColor.variableName!, property === "main" ? value : colorValue(generatedColor)];
  }));
}

function calculateNeutralGroup(value: string): ThemeColorValues {
  const color = toOklch(value);
  if (!color) return { "--jb-neutral": value };
  const tokens: ThemeColorValues = { "--jb-neutral": value };
  for (let index = 0; index <= 10; index += 1) {
    const rampColor = getNeutralColor(index);
    const neutral = new JBColor({
      lightness: rampColor.lightness,
      chroma: Math.min(0.04, rampColor.chroma * 0.55 + color.chroma * 0.16),
      hue: color.hue,
    }, `--jb-neutral-${index}`);
    tokens[`--jb-neutral-${index}`] = colorValue(neutral);
  }
  return tokens;
}

export function calculateColorGroup(token: BaseThemeColorToken, value: string): ThemeColorValues {
  if (token === "--jb-neutral") return calculateNeutralGroup(value);
  return calculateSemanticGroup(token.slice("--jb-".length) as ThemeColorGroup, value);
}

/** Adds missing calculated shades while preserving explicit expert overrides. */
export function withCalculatedThemeColors(values: ThemeColorValues): ThemeColorValues {
  const calculated: ThemeColorValues = {};
  for (const token of BASE_THEME_COLOR_TOKENS) {
    const value = values[token];
    if (typeof value === "string" && value.trim()) Object.assign(calculated, calculateColorGroup(token, value));
  }
  return { ...calculated, ...values };
}

/** Rebuilds every derived shade from the current base colors. */
export function recalculateAllThemeColors(values: ThemeColorValues): ThemeColorValues {
  const next = { ...values };
  for (const token of BASE_THEME_COLOR_TOKENS) {
    const value = values[token];
    if (typeof value === "string" && value.trim()) Object.assign(next, calculateColorGroup(token, value));
  }
  return next;
}
