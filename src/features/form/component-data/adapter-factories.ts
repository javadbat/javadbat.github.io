import type { JBFormElementKind, JBFormElementType } from "jb-form-builder/contract";
import type { FormElementAdapterDefinition, FormElementValueType } from "./form-element-adapter";
import type { ValidationRuleName } from "jb-form-builder/registry/validation-rule-registry";
import { componentLoaders } from "./component-loaders";

export const inputEvents = ["change", "input", "beforeinput", "focus", "blur", "keyup", "keydown", "enter"] as const;
export const dateEvents = ["load", "init", "invalid", "change", "input", "beforeinput", "keyup", "keydown", "select", "enter", "focus", "blur"] as const;
export const timeEvents = ["load", "init", "change", "input", "beforeinput", "keyup", "keydown", "enter", "focus", "blur"] as const;
export const textValidation = ["minLength", "maxLength", "pattern", "allowedValues"] as const satisfies readonly ValidationRuleName[];
export const rangedTextValidation = [...textValidation, "minValue", "maxValue"] as const satisfies readonly ValidationRuleName[];
export const allowedValuesValidation = ["allowedValues"] as const satisfies readonly ValidationRuleName[];

export function adapterDefinition(
  type: JBFormElementType,
  valueType: FormElementValueType,
  eventNames: readonly string[],
  validationRules: readonly ValidationRuleName[],
  packageName: string = type,
): FormElementAdapterDefinition {
  return {
    type, packageName, tagName: type, elementKind: "field", isContent: false, isContainer: false,
    adapterVersion: 1, supportedSchemaVersions: [1], valueType, eventNames, validationRules,
    loadComponent: componentLoaders[type],
  };
}

export function contentAdapterDefinition(type: "text" | "divider" | "section-heading" | "image" | "voice" | "link", tagName: "p" | "hr" | "h2" | "img" | "audio" | "a"): FormElementAdapterDefinition {
  return { type, packageName: type, tagName, elementKind: "content", isContent: true, isContainer: false, adapterVersion: 1, supportedSchemaVersions: [1], valueType: "none", eventNames: [], validationRules: [], loadComponent: componentLoaders[type] };
}

export function containerAdapterDefinition(type: "jb-tab" | "jb-condition" | "jb-form-wizard" | "jb-repeatable-group", tagName: "jb-tab" | "jb-condition" | "jb-form-wizard" | "jb-repeatable-group"): FormElementAdapterDefinition {
  return { type, packageName: type, tagName, elementKind: "container", isContent: false, isContainer: true, adapterVersion: 1, supportedSchemaVersions: [1], valueType: "none", eventNames: type === "jb-condition" ? ["condition-change"] : type === "jb-form-wizard" ? ["wizard-before-change", "wizard-change", "wizard-complete"] : type === "jb-repeatable-group" ? ["input", "change"] : ["change"], validationRules: [], loadComponent: componentLoaders[type] };
}
