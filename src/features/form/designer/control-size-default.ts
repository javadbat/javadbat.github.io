import { registryByType } from "jb-form-builder/registry/form-element-registry";
import { walkFormElements, type JBFormDocumentV1 } from "../domain/form-document";
import type { ThemeControlSize } from "./theme-config";

/** Applies the theme default only to components that expose an editable size property. */
export function withControlSizeDefault(documentValue: JBFormDocumentV1, size: ThemeControlSize): JBFormDocumentV1 {
  const documentCopy = structuredClone(documentValue);
  for (const element of walkFormElements(documentCopy.elements)) {
    const supportsSize = registryByType
      .get(element.type)
      ?.propertyDefinitions.some(property => property.key === "size");
    if (supportsSize && (!("size" in element.props) || element.props.size === null || element.props.size === "")) {
      element.props.size = size;
    }
  }
  return documentCopy;
}
