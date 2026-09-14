import { COMPONENT_PROPERTY_MIGRATIONS } from "./component-property-migrations";
import { getContainerChildren, isContainerElement, type JBFormDocumentV1, type JBFormElementV1, type JSONValue } from "./form-document";

type PropertyMigration = { readonly from: string; readonly to: string; readonly invert?: boolean };
const migrations: Partial<Record<string, readonly PropertyMigration[]>> = COMPONENT_PROPERTY_MIGRATIONS;

/** Upgrade known legacy properties on a detached document; explicit new keys win. */
export function migrateComponentProperties(document: JBFormDocumentV1): JBFormDocumentV1 {
  const result = structuredClone(document);
  const visit = (element: JBFormElementV1): void => {
    for (const rule of migrations[element.type] ?? []) {
      if (!Object.hasOwn(element.props, rule.from)) continue;
      let value: JSONValue = element.props[rule.from];
      if (rule.invert && typeof value === "boolean") value = !value;
      if (rule.to === "accept" && Array.isArray(value) && value.every(item => typeof item === "string")) value = value.join(",");
      if (!Object.hasOwn(element.props, rule.to)) element.props[rule.to] = value;
      delete element.props[rule.from];
    }
    if (isContainerElement(element)) getContainerChildren(element).forEach(visit);
  };
  result.elements.forEach(visit);
  return result;
}
