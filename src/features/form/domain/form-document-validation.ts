import Ajv2020, { type ErrorObject } from "ajv/dist/2020.js";
import formDocumentSchema from "../../../pages/form/_docs/schema/v1/form-document.schema.json";
import type { FormIssue } from "./form-issue";
import { isConditionElement, isContainerElement, isTabElement, type JBFormDocumentV1, type JBFormElementV1, type LocalizedText } from "./form-document";
import { registryByType } from "../registry/form-element-registry";

export interface FormDocumentValidationResult {
  valid: boolean;
  document?: JBFormDocumentV1;
  issues: FormIssue[];
}

const ajv = new Ajv2020({
  allErrors: true,
  allowUnionTypes: true,
  strict: true,
  validateFormats: true,
});

ajv.addFormat("uuid", /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i);
ajv.addFormat("date-time", {
  type: "string",
  validate: (value: string) => /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?(?:Z|[+-]\d{2}:\d{2})$/.test(value) && Number.isFinite(Date.parse(value)),
});

const validateSchema = ajv.compile<JBFormDocumentV1>(formDocumentSchema);

function schemaIssue(error: ErrorObject): FormIssue {
  return {
    source: "schema",
    code: `schema_${error.keyword}`,
    path: error.instancePath || "/",
    messageKey: `form.schema.${error.keyword}`,
    message: error.message ?? "The form document is invalid.",
    details: error.params,
  };
}

function semanticIssue(code: string, path: string, message: string, elementId?: string): FormIssue {
  return {
    source: "semantic",
    code,
    path,
    messageKey: `form.semantic.${code}`,
    message,
    elementId,
  };
}

function localizedTextLocales(value: LocalizedText | undefined): string[] {
  return value ? Object.keys(value.translations) : [];
}

function validateSemanticDocument(document: JBFormDocumentV1): FormIssue[] {
  const issues: FormIssue[] = [];
  const declaredLocales = new Set(Object.keys(document.localization.locales));
  if (!declaredLocales.has(document.localization.defaultLocale)) {
    issues.push(semanticIssue("missing_default_locale", "/localization/defaultLocale", "The default locale must be declared in localization.locales."));
  }

  const localizedValues: Array<[string, LocalizedText | undefined]> = [
    ["/metadata/name", document.metadata.name],
    ["/metadata/description", document.metadata.description],
  ];
  const visitLocalizedValues = (element: JBFormElementV1, path: string): void => {
    if (isTabElement(element)) {
      element.tabs.forEach((tab, tabIndex) => {
        localizedValues.push([`${path}/tabs/${tabIndex}/label`, tab.label]);
        tab.children.forEach((child, childIndex) => visitLocalizedValues(child, `${path}/tabs/${tabIndex}/children/${childIndex}`));
      });
    } else if (isConditionElement(element)) {
      element.children.forEach((child, childIndex) => visitLocalizedValues(child, `${path}/children/${childIndex}`));
    } else {
      localizedValues.push([`${path}/label`, element.label], [`${path}/placeholder`, element.placeholder]);
    }
  };
  document.elements.forEach((element, index) => visitLocalizedValues(element, `/elements/${index}`));
  for (const [path, value] of localizedValues) {
    for (const locale of localizedTextLocales(value)) {
      if (!declaredLocales.has(locale)) {
        issues.push(semanticIssue("undeclared_translation_locale", `${path}/translations/${locale}`, `${locale} must be declared in localization.locales.`));
      }
    }
  }

  const elementIds = new Set<string>();
  const validateElement = (element: JBFormElementV1, path: string): void => {
    if (elementIds.has(element.id)) {
      issues.push(semanticIssue("duplicate_element_id", `${path}/id`, "Element ids must be unique within a form.", element.id));
    }
    elementIds.add(element.id);
    const adapter = registryByType.get(element.type);
    if (!adapter) {
      issues.push(semanticIssue("unknown_element_type", `${path}/type`, `${element.type} is not registered.`, element.id));
      return;
    }
    issues.push(
      ...adapter.validate(element, adapter).map(issue => ({
        ...issue,
        path: `${path}${issue.path}`,
      })),
    );
    if (!isContainerElement(element)) return;
    if (isConditionElement(element)) {
      element.children.forEach((child, childIndex) => validateElement(child, `${path}/children/${childIndex}`));
      return;
    }
    const tabIds = new Set<string>();
    const tabValues = new Set<string>();
    element.tabs.forEach((tab, tabIndex) => {
      const tabPath = `${path}/tabs/${tabIndex}`;
      if (tabIds.has(tab.id)) issues.push(semanticIssue("duplicate_tab_id", `${tabPath}/id`, "Tab ids must be unique within their container.", element.id));
      if (tabValues.has(tab.value)) issues.push(semanticIssue("duplicate_tab_value", `${tabPath}/value`, "Tab values must be unique within their container.", element.id));
      tabIds.add(tab.id);
      tabValues.add(tab.value);
      tab.children.forEach((child, childIndex) => validateElement(child, `${tabPath}/children/${childIndex}`));
    });
    const defaultValue = element.props.defaultValue;
    if (typeof defaultValue === "string" && !tabValues.has(defaultValue)) {
      issues.push(semanticIssue("unknown_default_tab", `${path}/props/defaultValue`, "The initially active tab must reference an existing tab value.", element.id));
    }
    if (!element.props.nullable && element.tabs.every(tab => tab.disabled)) {
      issues.push(semanticIssue("no_enabled_tab", `${path}/tabs`, "A non-nullable tab container needs at least one enabled tab.", element.id));
    }
  };
  document.elements.forEach((element, index) => validateElement(element, `/elements/${index}`));

  const conditionContainers = document.elements.filter(isConditionElement);
  const ownersByFieldName = new Map<string, Set<string | null>>();
  const addFieldOwner = (element: JBFormElementV1, owner: string | null): void => {
    if (isContainerElement(element) || registryByType.get(element.type)?.valueType === "none") return;
    const name = element.name;
    const owners = ownersByFieldName.get(name) ?? new Set<string | null>();
    owners.add(owner);
    ownersByFieldName.set(name, owners);
  };
  for (const element of document.elements) {
    if (isConditionElement(element)) {
      element.children.forEach(child => addFieldOwner(child, element.id));
    } else if (isTabElement(element)) {
      element.tabs.forEach(tab => tab.children.forEach(child => addFieldOwner(child, null)));
    } else {
      addFieldOwner(element, null);
    }
  }
  const dependencies = new Map(conditionContainers.map(container => [container.id, new Set<string>()]));
  conditionContainers.forEach(container => {
    const ruleIds = new Set<string>();
    container.conditions.rules.forEach((rule, ruleIndex) => {
      const rulePath = `/elements/${document.elements.indexOf(container)}/conditions/rules/${ruleIndex}`;
      if (ruleIds.has(rule.id)) issues.push(semanticIssue("duplicate_condition_rule_id", `${rulePath}/id`, "Condition rule ids must be unique within their container.", container.id));
      ruleIds.add(rule.id);
      if (rule.operator !== "isEmpty" && rule.operator !== "isNotEmpty" && rule.value === undefined) {
        issues.push(semanticIssue("missing_condition_value", `${rulePath}/value`, `${rule.operator} requires a comparison value.`, container.id));
      }
      const owners = ownersByFieldName.get(rule.fieldName);
      if (!owners) {
        issues.push(semanticIssue("unknown_condition_field", `${rulePath}/fieldName`, `${rule.fieldName} does not match a form field name.`, container.id));
        return;
      }
      for (const owner of owners) {
        if (owner === container.id) issues.push(semanticIssue("self_condition_reference", `${rulePath}/fieldName`, "A conditional container cannot depend on one of its own fields.", container.id));
        else if (owner) dependencies.get(container.id)?.add(owner);
      }
    });
  });
  const visiting = new Set<string>();
  const visited = new Set<string>();
  const visitDependency = (containerId: string): boolean => {
    if (visiting.has(containerId)) return true;
    if (visited.has(containerId)) return false;
    visiting.add(containerId);
    const cyclic = Array.from(dependencies.get(containerId) ?? []).some(visitDependency);
    visiting.delete(containerId);
    visited.add(containerId);
    return cyclic;
  };
  for (const container of conditionContainers) {
    if (visitDependency(container.id)) issues.push(semanticIssue("cyclic_condition_dependency", `/elements/${document.elements.indexOf(container)}/conditions`, "Conditional containers cannot form a dependency cycle.", container.id));
  }

  return issues;
}

export function validateFormDocument(value: unknown): FormDocumentValidationResult {
  if (!validateSchema(value)) {
    return {
      valid: false,
      issues: (validateSchema.errors ?? []).map(schemaIssue),
    };
  }
  const document = value as JBFormDocumentV1;
  const issues = validateSemanticDocument(document);
  return {
    valid: issues.length === 0,
    document: issues.length === 0 ? document : undefined,
    issues,
  };
}
