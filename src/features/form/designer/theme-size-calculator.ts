export const BASE_THEME_SIZE_TOKENS = [
  "--jb-control-height-md",
  "--jb-radius",
] as const;

export type BaseThemeSizeToken = typeof BASE_THEME_SIZE_TOKENS[number];
export type ThemeSizeValues = Record<string, string | null | undefined>;

const sizeFamilies = {
  "--jb-control-height-md": {
    "--jb-control-height-xs": 0.6,
    "--jb-control-height-sm": 0.8,
    "--jb-control-height-md": 1,
    "--jb-control-height-lg": 1.2,
    "--jb-control-height-xl": 1.6,
  },
  "--jb-radius": {
    "--jb-radius-xs": 0.5,
    "--jb-radius-sm": 0.75,
    "--jb-radius": 1,
    "--jb-radius-lg": 1.25,
    "--jb-radius-xl": 1.5,
  },
} as const;

function scaledCssLength(value: string, multiplier: number): string | null {
  const match = /^\s*(-?(?:\d+\.?\d*|\.\d+))\s*([a-z%]+)\s*$/i.exec(value);
  if (!match) return null;
  const amount = Number(match[1]);
  if (!Number.isFinite(amount)) return null;
  const scaled = Number((amount * multiplier).toFixed(4));
  return `${scaled}${match[2]}`;
}

/** Builds the jb-core default size ratios around a user-selected base length. */
export function calculateSizeGroup(token: BaseThemeSizeToken, value: string): ThemeSizeValues {
  const calculated: ThemeSizeValues = { [token]: value || null };
  for (const [familyToken, multiplier] of Object.entries(sizeFamilies[token])) {
    const scaled = scaledCssLength(value, multiplier);
    if (scaled != null) calculated[familyToken] = scaled;
  }
  return calculated;
}

/** Updates a base length, optionally keeping its size family synchronized. */
export function updateBaseThemeSize(
  values: ThemeSizeValues,
  token: BaseThemeSizeToken,
  value: string,
  variantsLinked: boolean,
): ThemeSizeValues {
  return variantsLinked
    ? { ...values, ...calculateSizeGroup(token, value) }
    : { ...values, [token]: value || null };
}

/** Adds missing calculated sizes while preserving explicit expert overrides. */
export function withCalculatedThemeSizes(values: ThemeSizeValues): ThemeSizeValues {
  const calculated: ThemeSizeValues = {};
  for (const token of BASE_THEME_SIZE_TOKENS) {
    const value = values[token];
    if (typeof value === "string" && value.trim()) Object.assign(calculated, calculateSizeGroup(token, value));
  }
  return { ...calculated, ...values };
}

/** Rebuilds every derived size from the current base lengths. */
export function recalculateAllThemeSizes(values: ThemeSizeValues): ThemeSizeValues {
  const next = { ...values };
  for (const token of BASE_THEME_SIZE_TOKENS) {
    const value = values[token];
    if (typeof value === "string" && value.trim()) Object.assign(next, calculateSizeGroup(token, value));
  }
  return next;
}
