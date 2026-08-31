import {
  JB_FORM_SCHEMA_V1,
  localizedText,
  type JBFormDocumentV1,
  type JBFormElementV1,
} from "../domain/form-document";

const createdAt = "2026-08-29T00:00:00.000Z";

function field(
  id: string,
  type: JBFormElementV1["type"],
  name: string,
  label: string,
  placeholder: string | undefined,
  props: Record<string, never | string | number | boolean | object | unknown[]> = {},
  required = false,
): JBFormElementV1 {
  return {
    id,
    type,
    adapterVersion: 1,
    name,
    label: localizedText(label),
    ...(placeholder ? { placeholder: localizedText(placeholder) } : {}),
    ...(required ? { required: true } : {}),
    props,
    validation: [],
  } as JBFormElementV1;
}

export const DESIGNER_SAMPLE_FORM: JBFormDocumentV1 = {
  $schema: JB_FORM_SCHEMA_V1,
  schemaVersion: 1,
  id: "cbe1cce8-c05c-4b71-a48e-6e80ed12d12f",
  slug: "science-club-permission",
  metadata: {
    name: localizedText("Science club permission"),
    description: localizedText("Please complete this form so your child can participate in our after-school science club."),
    createdAt,
    updatedAt: createdAt,
  },
  localization: {
    defaultLocale: "en",
    locales: { en: { direction: "ltr" } },
  },
  elements: [
    field(
      "60ff0ca4-faea-47dc-bfbb-e91202dfac8a",
      "jb-input",
      "studentName",
      "Student name",
      "Enter student's full name",
      { size: "lg", type: "text" },
      true,
    ),
    field(
      "59e4f269-d37f-440b-94b9-762af6f6b13e",
      "jb-select",
      "ageGroup",
      "Age group",
      "Select age group",
      {
        size: "lg",
        multiple: false,
        popoverPosition: "fixed",
        hideClear: true,
        options: [
          { id: "age-6-8", value: "6-8", label: localizedText("6–8 years"), disabled: false },
          { id: "age-9-11", value: "9-11", label: localizedText("9–11 years"), disabled: false },
          { id: "age-12-14", value: "12-14", label: localizedText("12–14 years"), disabled: false },
        ],
      },
      true,
    ),
    field(
      "c050ae5e-2059-4288-afb3-42136656bda4",
      "jb-input",
      "guardianEmail",
      "Guardian email",
      "Enter guardian email address",
      { size: "lg", type: "email" },
      true,
    ),
    field(
      "fc8b7a1c-a240-4e21-a2d3-d22990b02bb4",
      "jb-checkbox",
      "permission",
      "I give permission for my child to participate in the science club",
      undefined,
      { size: "lg", variant: "filled-outline", color: "positive" },
      true,
    ),
    {
      id: "dfab3bbc-1a1d-4211-ad8e-1dcf498ce58b",
      type: "jb-button",
      adapterVersion: 1,
      name: "submitPermission",
      props: {
        content: { translations: { en: "Send permission" } },
        type: "button",
        action: "custom",
        color: "primary",
        variant: "solid",
        size: "lg",
        isLoading: false,
        loadingText: { translations: { en: "Sending" } },
        square: false,
      },
      validation: [],
    },
  ],
  theme: null,
};
