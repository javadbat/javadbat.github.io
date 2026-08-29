import { describe, expect, it } from "vitest";
import { registryByType } from "jb-form-builder/registry/form-element-registry";
import { validateFormDocument } from "jb-form-builder/contract/validation";
import { walkFormElements, type JBFormDocumentV1 } from "../domain/form-document";
import { withControlSizeDefault } from "./control-size-default";
import { DESIGNER_SAMPLE_FORM } from "./sample-form";

describe("withControlSizeDefault", () => {
  it("adds size only to elements whose registry configuration supports it", () => {
    const document: JBFormDocumentV1 = structuredClone(DESIGNER_SAMPLE_FORM);
    document.elements = [
      {
        id: "b720ca8a-38e6-4be3-8a86-9046a304ee33",
        type: "section-heading",
        adapterVersion: 1,
        name: "heading",
        props: { content: { translations: { en: "Details" } }, level: "h2" },
        validation: [],
      },
      {
        id: "990b078b-6735-4e6d-9eb8-fe8dd4c92fb8",
        type: "jb-condition",
        adapterVersion: 1,
        name: "conditionalFields",
        props: {},
        validation: [],
        conditions: { match: "all", rules: [] },
        children: [
          {
            id: "86cc4734-92d4-439c-a78c-a21ba30eb298",
            type: "jb-textarea",
            adapterVersion: 1,
            name: "notes",
            props: { autoHeight: true },
            validation: [],
          },
          {
            id: "dc4847ca-2d78-4d99-bd43-5010b955008f",
            type: "jb-input",
            adapterVersion: 1,
            name: "summary",
            props: { type: "text", inputmode: "text", autocomplete: "off" },
            validation: [],
          },
        ],
      },
    ];

    const result = withControlSizeDefault(document, "lg");
    const [heading, condition, textarea, input] = walkFormElements(result.elements);

    expect(heading.props).not.toHaveProperty("size");
    expect(condition.props).not.toHaveProperty("size");
    expect(textarea.props).not.toHaveProperty("size");
    expect(input.props.size).toBe("lg");
    expect(validateFormDocument(result).issues.filter(issue => issue.code === "unknown-property")).toEqual([]);
  });

  it("preserves explicit component sizes and does not mutate the source document", () => {
    const document = structuredClone(DESIGNER_SAMPLE_FORM);
    const input = document.elements[0];
    expect(registryByType.get(input.type)?.propertyDefinitions.some(property => property.key === "size")).toBe(true);
    input.props.size = "sm";

    const result = withControlSizeDefault(document, "lg");

    expect(result.elements[0].props.size).toBe("sm");
    expect(document.elements[0].props.size).toBe("sm");
    expect(result).not.toBe(document);
  });
});
