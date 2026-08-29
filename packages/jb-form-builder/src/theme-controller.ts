import { walkFormElements, type JBFormDocumentV1 } from "./contract/form-document";
import { canonicalizeThemeConfig, type ThemeConfigV1 } from "./contract/theme-config";
import { registryByType } from "./registry/form-element-registry";
import type { RuntimeJBForm } from "./types";

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
  for (const [tagName, component] of Object.entries(theme.components ?? {})) {
    for (const element of form.querySelectorAll<HTMLElement>(tagName)) {
      for (const [token, value] of Object.entries(component.tokens)) element.style.setProperty(token, value);
    }
  }
}

export function prepareThemeConfig(value: unknown): ThemeConfigV1 {
  return canonicalizeThemeConfig(value);
}
