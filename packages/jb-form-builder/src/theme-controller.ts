import { walkFormElements, type JBFormDocumentV1 } from "./contract/form-document";
import { canonicalizeThemeConfig, type ThemeBackground, type ThemeConfigV1 } from "./contract/theme-config";
import { registryByType } from "./registry/form-element-registry";
import type { RuntimeJBForm } from "./types";

export interface ResolvedThemeBackground {
  type: ThemeBackground["type"];
  color: string;
  image?: string;
  size?: string;
  position?: string;
  repeat?: string;
  opacity?: number;
}

function patternSvg(patternId: string, foreground: string, opacity: number): string {
  const drawings: Record<string, string> = {
    "science-doodles": '<path d="M18 28h24M30 16v24M76 18l16 16-16 16M126 18a12 12 0 1 0 0 24 12 12 0 0 0 0-24Z" fill="none" stroke="currentColor" stroke-width="5" stroke-linecap="round"/>',
    "academic-waves": '<path d="M0 28c24-20 48-20 72 0s48 20 72 0 48-20 72 0M0 76c24-20 48-20 72 0s48 20 72 0 48-20 72 0" fill="none" stroke="currentColor" stroke-width="5"/>',
    "calm-dots": '<circle cx="24" cy="24" r="6" fill="currentColor"/><circle cx="72" cy="72" r="4" fill="currentColor"/><circle cx="120" cy="24" r="3" fill="currentColor"/>',
    "warm-chevrons": '<path d="m8 24 28 28 28-28M80 24l28 28 28-28M8 88l28 28 28-28M80 88l28 28 28-28" fill="none" stroke="currentColor" stroke-width="7" stroke-linecap="round" stroke-linejoin="round"/>',
  };
  const drawing = drawings[patternId] ?? drawings["calm-dots"];
  const safeForeground = foreground.replace(/[&"'<>]/g, character => ({ "&": "&amp;", '"': "&quot;", "'": "&apos;", "<": "&lt;", ">": "&gt;" })[character]!);
  return `<svg xmlns="http://www.w3.org/2000/svg" width="144" height="144" viewBox="0 0 144 144" style="color:${safeForeground}" opacity="${opacity}">${drawing}</svg>`;
}

/** Resolves portable background data to renderer-owned CSS without external asset lookup. */
export function resolveThemeBackground(background: ThemeBackground): ResolvedThemeBackground {
  if (background.type === "color") return { type: "color", color: background.color };
  if (background.type === "pattern") {
    const opacity = Math.min(100, Math.max(0, background.opacity ?? 100)) / 100;
    const svg = patternSvg(background.patternId, background.foregroundColor ?? "#000000", opacity);
    return {
      type: "pattern",
      color: background.color ?? "transparent",
      image: `url("data:image/svg+xml,${encodeURIComponent(svg)}")`,
      size: `${Math.max(24, 144 * ((background.scale ?? 100) / 100))}px`,
      position: "center",
      repeat: "repeat",
      opacity: 1,
    };
  }
  const image = `url(${JSON.stringify(background.source)})`;
  return {
    type: "image",
    color: background.fallbackColor ?? "transparent",
    image: background.overlayColor ? `linear-gradient(${background.overlayColor}, ${background.overlayColor}), ${image}` : image,
    size: background.fit ?? "cover",
    position: background.position ?? "center",
    repeat: "no-repeat",
    opacity: Math.min(100, Math.max(0, background.opacity ?? 100)) / 100,
  };
}

export function applyThemeDefaults(documentValue: JBFormDocumentV1, theme: ThemeConfigV1 | null): JBFormDocumentV1 {
  const documentCopy = structuredClone(documentValue);
  const size = theme?.defaults?.controlSize;
  if (!size) return documentCopy;
  for (const element of walkFormElements(documentCopy.elements)) {
    const supportsSize = registryByType.get(element.type)?.propertyDefinitions.some(property => property.key === "size");
    if (supportsSize && (!element.props.size || element.props.size === "")) element.props.size = size;
  }
  return documentCopy;
}

export function applyThemeToRuntime(form: RuntimeJBForm, theme: ThemeConfigV1 | null): void {
  if (!theme) return;
  for (const [token, value] of Object.entries(theme.global ?? {})) form.style.setProperty(token, value);
  if (theme.typography?.fontFamily) form.style.fontFamily = theme.typography.fontFamily;
  if (theme.typography?.textScale !== undefined) form.style.fontSize = `${theme.typography.textScale}rem`;
  if (theme.sizing?.spacingScale !== undefined) form.style.setProperty("--jb-form-spacing-scale", String(theme.sizing.spacingScale));
  if (theme.background) {
    const background = resolveThemeBackground(theme.background);
    form.dataset.themeBackground = background.type;
    form.style.setProperty("--jb-form-background-color", background.color);
    if (background.image) form.style.setProperty("--jb-form-background-image", background.image);
    if (background.size) form.style.setProperty("--jb-form-background-size", background.size);
    if (background.position) form.style.setProperty("--jb-form-background-position", background.position);
    if (background.repeat) form.style.setProperty("--jb-form-background-repeat", background.repeat);
    if (background.opacity !== undefined) form.style.setProperty("--jb-form-background-opacity", String(background.opacity));
  }
  for (const [tagName, component] of Object.entries(theme.components ?? {})) {
    for (const element of form.querySelectorAll<HTMLElement>(tagName)) {
      for (const [token, value] of Object.entries(component.tokens)) element.style.setProperty(token, value);
    }
  }
}

export function prepareThemeConfig(value: unknown): ThemeConfigV1 {
  return canonicalizeThemeConfig(value);
}
