import Ajv2020, { type ErrorObject } from "ajv/dist/2020.js";
import formDocumentSchema from "../../../pages/form/_docs/schema/v1/form-document.schema.json";
import type { FormIssue } from "./form-issue";
import type { JBFormDocumentV1, LocalizedText } from "./form-document";
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
  document.elements.forEach((element, index) => {
    localizedValues.push([`/elements/${index}/label`, element.label], [`/elements/${index}/placeholder`, element.placeholder]);
  });
  for (const [path, value] of localizedValues) {
    for (const locale of localizedTextLocales(value)) {
      if (!declaredLocales.has(locale)) {
        issues.push(semanticIssue("undeclared_translation_locale", `${path}/translations/${locale}`, `${locale} must be declared in localization.locales.`));
      }
    }
  }

  const elementIds = new Set<string>();
  document.elements.forEach((element, index) => {
    if (elementIds.has(element.id)) {
      issues.push(semanticIssue("duplicate_element_id", `/elements/${index}/id`, "Element ids must be unique within a form.", element.id));
    }
    elementIds.add(element.id);
    const adapter = registryByType.get(element.type);
    if (!adapter) {
      issues.push(semanticIssue("unknown_element_type", `/elements/${index}/type`, `${element.type} is not registered.`, element.id));
      return;
    }
    issues.push(
      ...adapter.validate(element, adapter).map(issue => ({
        ...issue,
        path: `/elements/${index}${issue.path}`,
      })),
    );
  });

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
