import type { ValidationItem } from "jb-validation";
import { getLocalizedText, type JBFormElementKind, type JBFormElementType, type JBFormElementV1, type JSONPrimitive, type JSONValue, type LocalizedText } from "../contract/form-document";
import type { FormIssue } from "../contract/form-issue";
import type { CommonFieldSupport, FormElementPropertyDefinition, InitialValueKind } from "./form-element-configuration";
import { compileValidationRule, validatePortableValidationRule, type ValidationRuleName } from "./validation-rule-registry";

export type FormElementValueType = "string" | "number-string" | "range" | "boolean" | "select" | "file" | "image" | "none";

export interface RuntimeValidationTarget {
  list: ValidationItem<unknown>[];
}

export type RuntimeFormElement = HTMLElement & {
  validation?: RuntimeValidationTarget;
  [key: string]: unknown;
};

export interface FormElementAdapterDefinition {
  type: JBFormElementType;
  packageName: string;
  tagName: string;
  elementKind: JBFormElementKind;
  isContent: boolean;
  isContainer: boolean;
  adapterVersion: 1;
  supportedSchemaVersions: readonly [1];
  valueType: FormElementValueType;
  eventNames: readonly string[];
  validationRules: readonly ValidationRuleName[];
  loadComponent: () => Promise<unknown>;
}

export interface FormElementAdapterContext {
  commonFields: CommonFieldSupport;
  initialValueKind: InitialValueKind;
  propertyDefinitions: readonly FormElementPropertyDefinition[];
}

export interface FormElementAdapter extends FormElementAdapterDefinition {
  validate(element: JBFormElementV1, context: FormElementAdapterContext): FormIssue[];
  serialize(element: JBFormElementV1): JBFormElementV1;
  deserialize(value: JBFormElementV1): JBFormElementV1;
  applyToRuntime(target: RuntimeFormElement, element: JBFormElementV1, locale: string, defaultLocale?: string): void;
}

const inputEvents = ["change", "input", "beforeinput", "focus", "blur", "keyup", "keydown", "enter"] as const;

const dateEvents = ["load", "init", "invalid", "change", "input", "beforeinput", "keyup", "keydown", "select", "enter", "focus", "blur"] as const;

const timeEvents = ["load", "init", "change", "input", "beforeinput", "keyup", "keydown", "enter", "focus", "blur"] as const;

const textValidation = ["minLength", "maxLength", "pattern", "allowedValues"] as const satisfies readonly ValidationRuleName[];

const rangedTextValidation = [...textValidation, "minValue", "maxValue"] as const satisfies readonly ValidationRuleName[];

const allowedValuesValidation = ["allowedValues"] as const satisfies readonly ValidationRuleName[];

const componentLoaders: Record<JBFormElementType, () => Promise<unknown>> = {
  text: () => Promise.resolve(),
  divider: () => Promise.resolve(),
  "section-heading": () => Promise.resolve(),
  image: () => Promise.resolve(),
  voice: () => Promise.resolve(),
  link: () => Promise.resolve(),
  "jb-input": () => import("jb-input"),
  "jb-number-input": () => import("jb-number-input"),
  "jb-range-input": () => import("jb-range-input"),
  "jb-mobile-input": () => import("jb-mobile-input"),
  "jb-password-input": () => import("jb-password-input"),
  "jb-payment-input": () => import("jb-payment-input"),
  "jb-national-input": () => import("jb-national-input"),
  "jb-date-input": () => import("jb-date-input"),
  "jb-time-input": () => import("jb-time-input"),
  "jb-pin-input": () => import("jb-pin-input"),
  "jb-textarea": () => import("jb-textarea"),
  // jb-select 8 publishes jb-option as a separate entry point. Preview loads
  // field dependencies lazily, so importing only the select entry would leave
  // its declarative options as unregistered HTML elements.
  "jb-select": () => Promise.all([import("jb-select"), import("jb-select/option")]),
  "jb-listbox": () => Promise.all([import("jb-select/listbox"), import("jb-checkbox")]),
  "jb-checkbox": () => import("jb-checkbox"),
  "jb-switch": () => import("jb-switch"),
  "jb-file-input": () => import("jb-file-input"),
  "jb-image-input": () => import("jb-image-input"),
  "jb-button": () => import("jb-button"),
  "jb-tab": () => import("jb-tab"),
  "jb-condition": () => import("jb-condition"),
  "jb-form-wizard": () => import("jb-form-wizard"),
  "jb-repeatable-group": async () => {
    // Repeatable controls are rendered by the framework rather than by a
    // document child, so load their design-system buttons alongside the
    // lightweight group host.
    await import("jb-button");
    if (!customElements.get("jb-repeatable-group")) customElements.define("jb-repeatable-group", class extends HTMLElement {});
  },
};

const definitions = [
  contentAdapterDefinition("text", "p"),
  contentAdapterDefinition("divider", "hr"),
  contentAdapterDefinition("section-heading", "h2"),
  contentAdapterDefinition("image", "img"),
  contentAdapterDefinition("voice", "audio"),
  contentAdapterDefinition("link", "a"),
  adapterDefinition("jb-input", "string", inputEvents, textValidation),
  adapterDefinition("jb-number-input", "number-string", inputEvents, rangedTextValidation),
  adapterDefinition("jb-range-input", "range", ["input", "change", "invalid"], []),
  adapterDefinition("jb-mobile-input", "string", inputEvents, textValidation),
  adapterDefinition("jb-password-input", "string", inputEvents, textValidation),
  adapterDefinition("jb-payment-input", "string", inputEvents, textValidation),
  adapterDefinition("jb-national-input", "string", inputEvents, textValidation),
  adapterDefinition("jb-date-input", "string", dateEvents, rangedTextValidation),
  adapterDefinition("jb-time-input", "string", timeEvents, textValidation),
  adapterDefinition("jb-pin-input", "string", [...inputEvents, "complete"], textValidation),
  adapterDefinition("jb-textarea", "string", ["load", "init", ...inputEvents], textValidation),
  adapterDefinition("jb-select", "select", ["load", "init", "change", "input", "keyup", "filter-change"], allowedValuesValidation),
  adapterDefinition("jb-listbox", "select", ["load", "init", "change", "input", "invalid", "filter-change"], allowedValuesValidation, "jb-select/listbox"),
  adapterDefinition("jb-checkbox", "boolean", ["change", "before-change"], allowedValuesValidation),
  adapterDefinition("jb-switch", "boolean", ["load", "init", "change", "before-change"], allowedValuesValidation),
  adapterDefinition("jb-file-input", "file", ["load", "init", "change", "delete", "download"], []),
  adapterDefinition("jb-image-input", "image", ["load", "init", "change", "imageSelected", "maxSizeExceed", "download-start", "invalid"], []),
  adapterDefinition("jb-button", "none", ["click"], []),
  containerAdapterDefinition("jb-tab", "jb-tab"),
  containerAdapterDefinition("jb-condition", "jb-condition"),
  containerAdapterDefinition("jb-form-wizard", "jb-form-wizard"),
  containerAdapterDefinition("jb-repeatable-group", "jb-repeatable-group"),
] as const satisfies readonly FormElementAdapterDefinition[];

function adapterDefinition(
  type: JBFormElementType,
  valueType: FormElementValueType,
  eventNames: readonly string[],
  validationRules: readonly ValidationRuleName[],
  packageName: string = type,
): FormElementAdapterDefinition {
  return {
    type,
    packageName,
    tagName: type,
    elementKind: "field",
    isContent: false,
    isContainer: false,
    adapterVersion: 1,
    supportedSchemaVersions: [1],
    valueType,
    eventNames,
    validationRules,
    loadComponent: componentLoaders[type],
  };
}

function contentAdapterDefinition(type: "text" | "divider" | "section-heading" | "image" | "voice" | "link", tagName: "p" | "hr" | "h2" | "img" | "audio" | "a"): FormElementAdapterDefinition {
  return {
    type,
    packageName: type,
    tagName,
    elementKind: "content",
    isContent: true,
    isContainer: false,
    adapterVersion: 1,
    supportedSchemaVersions: [1],
    valueType: "none",
    eventNames: [],
    validationRules: [],
    loadComponent: componentLoaders[type],
  };
}

function containerAdapterDefinition(type: "jb-tab" | "jb-condition" | "jb-form-wizard" | "jb-repeatable-group", tagName: "jb-tab" | "jb-condition" | "jb-form-wizard" | "jb-repeatable-group"): FormElementAdapterDefinition {
  return {
    type,
    packageName: type,
    tagName,
    elementKind: "container",
    isContent: false,
    isContainer: true,
    adapterVersion: 1,
    supportedSchemaVersions: [1],
    valueType: "none",
    eventNames: type === "jb-condition" ? ["condition-change"] : type === "jb-form-wizard" ? ["wizard-before-change", "wizard-change", "wizard-complete"] : type === "jb-repeatable-group" ? ["input", "change"] : ["change"],
    validationRules: [],
    loadComponent: componentLoaders[type],
  };
}

function issue(element: JBFormElementV1, code: string, path: string, message: string): FormIssue {
  const pointer = path.startsWith("/") ? path : `/${path.replaceAll(".", "/")}`;
  return {
    source: "registry",
    code,
    path: pointer,
    messageKey: code,
    message,
    elementId: element.id,
  };
}

function isLocalizedText(value: unknown): value is LocalizedText {
  if (typeof value !== "object" || value === null || Array.isArray(value) || !("translations" in value)) {
    return false;
  }
  const translations = (value as { translations?: unknown }).translations;
  return (
    typeof translations === "object" &&
    translations !== null &&
    !Array.isArray(translations) &&
    Object.keys(translations).length > 0 &&
    Object.values(translations).every(translation => typeof translation === "string")
  );
}

function validateInitialValue(element: JBFormElementV1, kind: InitialValueKind): FormIssue[] {
  if (element.initialValue === undefined) {
    return [];
  }
  const valid =
    kind === "boolean"
      ? typeof element.initialValue === "boolean"
      : kind === "range"
        ? typeof element.initialValue === "number" ||
          (Array.isArray(element.initialValue) && element.initialValue.length === 2 && element.initialValue.every(value => typeof value === "number" && Number.isFinite(value)))
      : kind === "select"
        ? ["string", "number", "boolean"].includes(typeof element.initialValue) || Array.isArray(element.initialValue) || element.initialValue === null
        : typeof element.initialValue === "string" || typeof element.initialValue === "number" || element.initialValue === null;
  return valid ? [] : [issue(element, "invalid-initial-value", "initialValue", `Initial value is not compatible with ${kind}.`)];
}

function validateSelectOptions(element: JBFormElementV1, value: JSONValue | undefined): FormIssue[] {
  if (!Array.isArray(value)) {
    return [issue(element, "invalid-options", "props.options", "Select options must be an array.")];
  }
  const ids = new Set<string>();
  return value.flatMap((candidate, index) => {
    if (typeof candidate !== "object" || candidate === null || Array.isArray(candidate)) {
      return [issue(element, "invalid-option", `props.options.${index}`, "Each option must be a JSON object.")];
    }
    const optionIssues: FormIssue[] = [];
    if (typeof candidate.id !== "string" || candidate.id.length === 0) {
      optionIssues.push(issue(element, "invalid-option-id", `props.options.${index}.id`, "Option id is required."));
    } else if (ids.has(candidate.id)) {
      optionIssues.push(issue(element, "duplicate-option-id", `props.options.${index}.id`, "Option ids must be unique within the element."));
    } else {
      ids.add(candidate.id);
    }
    if (!["string", "number", "boolean"].includes(typeof candidate.value)) {
      optionIssues.push(issue(element, "invalid-option-value", `props.options.${index}.value`, "Option value must be a string, number, or boolean."));
    }
    if (!isLocalizedText(candidate.label)) {
      optionIssues.push(issue(element, "invalid-option-label", `props.options.${index}.label`, "Option label needs at least one string translation."));
    }
    if (candidate.disabled !== undefined && typeof candidate.disabled !== "boolean") {
      optionIssues.push(issue(element, "invalid-option-disabled", `props.options.${index}.disabled`, "Option disabled must be boolean."));
    }
    return optionIssues;
  });
}

function validateProperty(element: JBFormElementV1, definition: FormElementPropertyDefinition): FormIssue[] {
  const value = element.props[definition.key];
  if (value === undefined) {
    return [];
  }
  if (definition.control === "options") {
    return validateSelectOptions(element, value);
  }
  if (definition.localized) {
    return isLocalizedText(value) ? [] : [issue(element, "invalid-localized-property", `props.${definition.key}`, `${definition.key} must contain portable translations.`)];
  }
  if (definition.control === "boolean") {
    return typeof value === "boolean" ? [] : [issue(element, "invalid-property-type", `props.${definition.key}`, `${definition.key} must be boolean.`)];
  }
  if (definition.control === "number") {
    if (typeof value !== "number" || !Number.isFinite(value)) {
      return [issue(element, "invalid-property-type", `props.${definition.key}`, `${definition.key} must be a finite number.`)];
    }
    if (definition.min !== undefined && value < definition.min) {
      return [issue(element, "property-below-minimum", `props.${definition.key}`, `${definition.key} must be at least ${definition.min}.`)];
    }
    if (definition.max !== undefined && value > definition.max) {
      return [issue(element, "property-above-maximum", `props.${definition.key}`, `${definition.key} must be at most ${definition.max}.`)];
    }
    return [];
  }
  if (definition.control === "string-list") {
    return Array.isArray(value) && value.every(candidate => typeof candidate === "string")
      ? []
      : [issue(element, "invalid-property-type", `props.${definition.key}`, `${definition.key} must be an array of strings.`)];
  }
  if (typeof value !== "string") {
    return [issue(element, "invalid-property-type", `props.${definition.key}`, `${definition.key} must be a string.`)];
  }
  if (definition.control === "select" && !definition.options?.some(option => option.value === value)) {
    return [issue(element, "invalid-property-option", `props.${definition.key}`, `${value} is not supported for ${definition.key}.`)];
  }
  return [];
}

function validateElement(definition: FormElementAdapterDefinition, element: JBFormElementV1, context: FormElementAdapterContext): FormIssue[] {
  const issues: FormIssue[] = [];
  if (element.type !== definition.type) {
    issues.push(issue(element, "adapter-type-mismatch", "type", `Expected ${definition.type}, received ${element.type}.`));
  }
  if (element.adapterVersion !== definition.adapterVersion) {
    issues.push(issue(element, "unsupported-adapter-version", "adapterVersion", `Adapter version ${element.adapterVersion} is not supported.`));
  }
  if (!/^[A-Za-z][A-Za-z0-9_-]{0,63}$/.test(element.name)) {
    issues.push(issue(element, "invalid-name", "name", "Name must begin with a letter and contain at most 64 portable characters."));
  }
  if (element.type === "jb-tab" || element.type === "jb-condition" || element.type === "jb-form-wizard") {
    const knownProps = new Set(context.propertyDefinitions.map(property => property.key));
    for (const key of Object.keys(element.props)) {
      if (!knownProps.has(key)) issues.push(issue(element, "unknown-property", `props.${key}`, `${key} is not an approved editable property for ${element.type}.`));
    }
    for (const property of context.propertyDefinitions) issues.push(...validateProperty(element, property));
    return issues;
  }
  for (const field of ["required", "disabled", "label", "placeholder"] as const) {
    if (element[field] !== undefined && !context.commonFields[field]) {
      issues.push(issue(element, "unsupported-common-field", field, `${field} is not supported by ${element.type}.`));
    }
  }
  if (element.initialValue !== undefined && !context.commonFields.initialValue) {
    issues.push(issue(element, "unsupported-common-field", "initialValue", `initialValue is not supported by ${element.type}.`));
  } else {
    issues.push(...validateInitialValue(element, context.initialValueKind));
  }
  for (const field of ["label", "placeholder"] as const) {
    if (element[field] !== undefined && !isLocalizedText(element[field])) {
      issues.push(issue(element, "invalid-localized-text", field, `${field} needs at least one string translation.`));
    }
  }
  const knownProps = new Set(context.propertyDefinitions.map(property => property.key));
  for (const key of Object.keys(element.props)) {
    if (!knownProps.has(key)) {
      issues.push(issue(element, "unknown-property", `props.${key}`, `${key} is not an approved editable property for ${element.type}.`));
    }
  }
  for (const property of context.propertyDefinitions) {
    issues.push(...validateProperty(element, property));
  }
  const ruleIds = new Set<string>();
  element.validation.forEach((rule, index) => {
    if (ruleIds.has(rule.id)) {
      issues.push(issue(element, "duplicate-validation-id", `validation.${index}.id`, "Validation rule ids must be unique within the element."));
    }
    ruleIds.add(rule.id);
    issues.push(...validatePortableValidationRule(rule, definition.validationRules, `/validation/${index}`, element.id));
  });
  return issues;
}

function toAttributeName(value: string): string {
  return value.replace(/[A-Z]/g, character => `-${character.toLowerCase()}`);
}

function setRuntimeValue(target: RuntimeFormElement, key: string, value: unknown): void {
  // The portable contract edits accepted types as a list, while the v4
  // component API receives a comma-separated string.
  if (key === "acceptTypes" && Array.isArray(value)) {
    value = value.filter(item => typeof item === "string").join(",");
  }
  const attributeName = toAttributeName(key);
  if (value === undefined || value === null) {
    target[key] = undefined;
    target.removeAttribute(attributeName);
    return;
  }
  target[key] = value;
  if (typeof value === "boolean") {
    target.toggleAttribute(attributeName, value);
  } else if (["string", "number"].includes(typeof value)) {
    target.setAttribute(attributeName, String(value));
  }
}

function resolveRuntimeValue(value: JSONValue, locale: string, defaultLocale: string): unknown {
  return isLocalizedText(value) ? getLocalizedText(value, locale, defaultLocale) : value;
}

function runtimeInitialValue(element: JBFormElementV1): JSONValue | undefined {
  if (element.type !== "jb-time-input" || typeof element.initialValue !== "string") {
    return element.initialValue;
  }
  const secondEnabled = element.props.secondEnabled === true;
  if (secondEnabled && /^\d{2}:\d{2}$/.test(element.initialValue)) {
    return `${element.initialValue}:00`;
  }
  if (!secondEnabled && /^\d{2}:\d{2}:\d{2}$/.test(element.initialValue)) {
    return element.initialValue.slice(0, 5);
  }
  return element.initialValue;
}

function isSafeLinkUrl(value: string): boolean {
  const trimmed = value.trim();
  if (trimmed.length === 0) return false;
  if (/^(?:[/?#]|\.\.?\/)/.test(trimmed)) return true;
  try {
    return ["http:", "https:", "mailto:", "tel:"].includes(new URL(trimmed).protocol);
  } catch {
    return false;
  }
}

function setNumberSeparatorRuntimeValue(target: RuntimeFormElement, key: "showThousandSeparator" | "thousandSeparator", value: unknown): void {
  // jb-number-input uses the same `thousand-separator` attribute both as a
  // boolean switch and as the separator text. Mirroring the separate builder
  // properties to attributes makes a configured separator turn the feature on
  // even when showThousandSeparator is false. Its two public properties are
  // independent, so assign them directly and remove misleading attributes.
  target[key] = value;
  target.removeAttribute(toAttributeName(key));
  target.removeAttribute("thousand-separator");
}

function renderSelectOptions(target: RuntimeFormElement, value: JSONValue | undefined, locale: string, defaultLocale: string, useCheckbox = false): void {
  target.querySelectorAll("[data-jb-form-option]").forEach(option => {
    option.remove();
  });
  if (!Array.isArray(value)) {
    return;
  }
  for (const candidate of value) {
    if (typeof candidate !== "object" || candidate === null || Array.isArray(candidate) || !("value" in candidate)) {
      continue;
    }
    const option = document.createElement("jb-option");
    option.dataset.jbFormOption = "";
    const optionValue = candidate.value as JSONPrimitive;
    (option as HTMLElement & { value?: JSONPrimitive }).value = optionValue;
    option.setAttribute("value", String(optionValue));
    option.toggleAttribute("disabled", candidate.disabled === true);
    const optionLabel = isLocalizedText(candidate.label) ? getLocalizedText(candidate.label, locale, defaultLocale) : String(optionValue);
    if (useCheckbox) {
      const checkbox = document.createElement("jb-checkbox") as HTMLElement & { disabled?: boolean };
      checkbox.setAttribute("label", optionLabel);
      checkbox.disabled = candidate.disabled === true;
      checkbox.toggleAttribute("disabled", candidate.disabled === true);
      option.append(checkbox);
    } else {
      option.textContent = optionLabel;
    }
    target.append(option);
  }
}

function applyToRuntime(target: RuntimeFormElement, element: JBFormElementV1, locale: string, defaultLocale = "en"): void {
  if (element.type === "divider") {
    target.setAttribute("aria-hidden", "true");
    const spacing = element.props.spacing;
    const spacingByName = { xs: "0.5rem", sm: "1rem", md: "1.75rem", lg: "2.5rem", xl: "4rem" } as const;
    target.style.marginBlock = typeof spacing === "string" && spacing in spacingByName ? spacingByName[spacing as keyof typeof spacingByName] : spacingByName.md;
    const lineType = element.props.lineType;
    const supportedLineTypes = new Set(["solid", "dashed", "dotted", "double", "none"]);
    target.style.border = "0";
    target.style.borderBlockStart = `0.0625rem ${typeof lineType === "string" && supportedLineTypes.has(lineType) ? lineType : "solid"} var(--jb-form-builder-line)`;
    return;
  }
  if (element.type === "section-heading") {
    target.textContent = element.props.content === undefined ? "" : String(resolveRuntimeValue(element.props.content, locale, defaultLocale));
    target.dataset.formContent = "section-heading";
    return;
  }
  if (element.type === "text") {
    const content = element.props.content;
    target.textContent = content === undefined ? "" : String(resolveRuntimeValue(content, locale, defaultLocale));
    const color = element.props.color;
    const fontSize = element.props.fontSize;
    const fontWeight = element.props.fontWeight;
    const textAlign = element.props.textAlign;
    const lineHeight = element.props.lineHeight;
    if (typeof color === "string") target.style.color = color;
    if (typeof fontSize === "number" && Number.isFinite(fontSize)) target.style.fontSize = `${fontSize}rem`;
    if (fontWeight === "normal" || fontWeight === "medium" || fontWeight === "semibold" || fontWeight === "bold") {
      target.style.fontWeight = fontWeight === "medium" ? "500" : fontWeight === "semibold" ? "600" : fontWeight === "bold" ? "700" : "400";
    }
    if (textAlign === "start" || textAlign === "center" || textAlign === "end") target.style.textAlign = textAlign;
    if (typeof lineHeight === "number" && Number.isFinite(lineHeight)) target.style.lineHeight = String(lineHeight);
    return;
  }
  if (element.type === "image") {
    const url = element.props.url;
    const alt = element.props.alt;
    if (typeof url === "string" && url.trim().length > 0) {
      target.setAttribute("src", url.trim());
      delete target.dataset.placeholder;
    } else {
      target.setAttribute("src", "/form/image-placeholder.svg");
      target.dataset.placeholder = "true";
    }
    target.setAttribute("alt", alt === undefined ? "" : String(resolveRuntimeValue(alt, locale, defaultLocale)));
    target.setAttribute("loading", "lazy");
    const size = element.props.size;
    const sizeByName = { auto: "auto", sm: "16rem", md: "28rem", lg: "42rem", full: "100%" } as const;
    if (typeof size === "string" && size in sizeByName) target.style.inlineSize = sizeByName[size as keyof typeof sizeByName];

    const aspectRatio = element.props.aspectRatio;
    const ratioByName = { auto: "auto", square: "1 / 1", landscape: "16 / 9", portrait: "4 / 5" } as const;
    if (typeof aspectRatio === "string" && aspectRatio in ratioByName) target.style.aspectRatio = ratioByName[aspectRatio as keyof typeof ratioByName];

    const objectFit = element.props.objectFit;
    if (objectFit === "contain" || objectFit === "cover" || objectFit === "fill" || objectFit === "scale-down") target.style.objectFit = objectFit;
    const objectPosition = element.props.objectPosition;
    if (objectPosition === "center" || objectPosition === "top" || objectPosition === "bottom") target.style.objectPosition = objectPosition;

    const alignment = element.props.alignment;
    if (alignment === "start") {
      target.style.marginInlineStart = "0";
      target.style.marginInlineEnd = "auto";
    } else if (alignment === "end") {
      target.style.marginInlineStart = "auto";
      target.style.marginInlineEnd = "0";
    } else if (alignment === "center") {
      target.style.marginInline = "auto";
    }

    const containerType = element.props.containerType;
    if (containerType === "rounded") {
      target.style.borderRadius = "0.875rem";
    } else if (containerType === "circle") {
      target.style.aspectRatio = "1 / 1";
      target.style.borderRadius = "50%";
      target.style.objectFit = "cover";
    } else if (containerType === "framed") {
      target.style.boxSizing = "border-box";
      target.style.padding = "0.5rem";
      target.style.border = "0.0625rem solid var(--jb-form-builder-line)";
      target.style.borderRadius = "0.875rem";
      target.style.background = "var(--jb-form-builder-surface)";
    }
    return;
  }
  if (element.type === "voice") {
    const url = element.props.url;
    if (typeof url === "string" && url.length > 0) {
      target.setAttribute("src", url);
    } else {
      target.removeAttribute("src");
    }
    target.setAttribute("controls", "");
    target.setAttribute("preload", "metadata");
    return;
  }
  if (element.type === "link") {
    const content = element.props.content;
    target.textContent = content === undefined ? "" : String(resolveRuntimeValue(content, locale, defaultLocale));
    const url = element.props.url;
    if (typeof url === "string" && isSafeLinkUrl(url)) {
      target.setAttribute("href", url.trim());
    } else {
      target.removeAttribute("href");
    }
    if (element.props.openInNewTab === true) {
      target.setAttribute("target", "_blank");
      target.setAttribute("rel", "noopener noreferrer");
    } else {
      target.removeAttribute("target");
      target.removeAttribute("rel");
    }
    return;
  }
  setRuntimeValue(target, "name", element.name);
  setRuntimeValue(target, "required", element.required);
  setRuntimeValue(target, "disabled", element.disabled);
  setRuntimeValue(target, "label", element.label ? getLocalizedText(element.label, locale, defaultLocale) : undefined);
  setRuntimeValue(target, "placeholder", element.placeholder ? getLocalizedText(element.placeholder, locale, defaultLocale) : undefined);
  for (const [key, value] of Object.entries(element.props)) {
    if (key === "options") {
      renderSelectOptions(target, value, locale, defaultLocale, element.type === "jb-listbox" && element.props.useCheckbox !== false);
    } else if (key === "content") {
      target.textContent = String(resolveRuntimeValue(value, locale, defaultLocale));
    } else if (element.type === "jb-number-input" && (key === "showThousandSeparator" || key === "thousandSeparator")) {
      setNumberSeparatorRuntimeValue(target, key, resolveRuntimeValue(value, locale, defaultLocale));
    } else {
      setRuntimeValue(target, key, resolveRuntimeValue(value, locale, defaultLocale));
    }
  }
  // Value parsing can depend on component props. For example, jb-time-input
  // validates HH:mm versus HH:mm:ss according to secondEnabled. Apply all
  // props before the initial value so valid configured values are not rejected.
  const initialValue = runtimeInitialValue(element);
  setRuntimeValue(target, "initialValue", initialValue);
  if (element.type === "jb-time-input" && initialValue !== undefined) {
    // jb-time-input initializes its nested jb-input when it is connected. A
    // value assigned while the renderer is still building its detached form
    // can therefore be cleared by that connected initialization. Reapply the
    // configured default after the complete form has been committed.
    queueMicrotask(() => {
      if (target.isConnected) target.initialValue = initialValue;
    });
  }
  if (target.validation) {
    target.validation.list = element.validation.map(rule => compileValidationRule(rule, locale, defaultLocale));
  }
}

function cloneElement(element: JBFormElementV1): JBFormElementV1 {
  return structuredClone(element);
}

function createAdapter(definition: FormElementAdapterDefinition): FormElementAdapter {
  return {
    ...definition,
    validate: (element, context) => validateElement(definition, element, context),
    serialize: cloneElement,
    deserialize: cloneElement,
    applyToRuntime,
  };
}

export const formElementAdapters: readonly FormElementAdapter[] = definitions.map(createAdapter);

export const adapterByType = new Map(formElementAdapters.map(adapter => [adapter.type, adapter]));
