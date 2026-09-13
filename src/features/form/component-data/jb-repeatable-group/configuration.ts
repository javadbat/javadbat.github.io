import { configuration, label, localizedDefault, textProperty, hiddenTextProperty, textareaProperty, urlProperty, numberProperty, ROOT_FONT_SIZE_PX, remPixelValueAdapter, colorProperty, booleanProperty, selectProperty, stringListProperty, sizeOptions, checkboxVariantOptions, checkboxColorOptions, inputModeOptions, inputTypeOptions, inputProperties, inputDefaults, inputCommon, valueControlCommon, booleanControlCommon } from "../configuration-helpers";

export const componentConfiguration = configuration(
    { required: false, disabled: false, initialValue: false, label: false, placeholder: false },
    "none",
    {
      repeatCount: 1,
      minItems: 1,
      maxItems: 10,
      allowAdd: false,
      itemBackground: "#f8fafc",
      itemBackgroundHover: "#eef4ff",
      itemBorderColor: "#d9e2f0",
      itemBorderType: "solid",
    },
    [
      numberProperty("repeatCount", "Initial repetitions", "\u062a\u0639\u062f\u0627\u062f \u062a\u06a9\u0631\u0627\u0631 \u0627\u0648\u0644\u06cc\u0647", { min: 0, step: 1 }),
      booleanProperty("allowAdd", "Let respondent add items", "\u0627\u062c\u0627\u0632\u0647 \u0627\u0641\u0632\u0648\u062f\u0646 \u0645\u0648\u0631\u062f \u0628\u0647 \u06a9\u0627\u0631\u0628\u0631"),
      numberProperty("minItems", "Minimum items", "\u062d\u062f\u0627\u0642\u0644 \u0645\u0648\u0627\u0631\u062f", { min: 0, step: 1 }),
      numberProperty("maxItems", "Maximum items", "\u062d\u062f\u0627\u06a9\u062b\u0631 \u0645\u0648\u0627\u0631\u062f", { min: 0, step: 1 }),
      colorProperty("itemBackground", "Item background", "\u067e\u0633\u200c\u0632\u0645\u06cc\u0646\u0647 \u0645\u0648\u0631\u062f"),
      colorProperty("itemBackgroundHover", "Item background on hover", "\u067e\u0633\u200c\u0632\u0645\u06cc\u0646\u0647 \u0645\u0648\u0631\u062f \u0647\u0646\u06af\u0627\u0645 \u0647\u0627\u0648\u0631"),
      colorProperty("itemBorderColor", "Item border color", "\u0631\u0646\u06af \u062d\u0627\u0634\u06cc\u0647 \u0645\u0648\u0631\u062f"),
      selectProperty("itemBorderType", "Item border type", "\u0646\u0648\u0639 \u062d\u0627\u0634\u06cc\u0647 \u0645\u0648\u0631\u062f", [
        { value: "solid", label: label("Solid", "\u067e\u06cc\u0648\u0633\u062a\u0647") },
        { value: "dashed", label: label("Dashed", "\u062e\u0637\u200c\u0686\u06cc\u0646") },
        { value: "dotted", label: label("Dotted", "\u0646\u0642\u0637\u0647\u200c\u0686\u06cc\u0646") },
        { value: "none", label: label("None", "\u0628\u062f\u0648\u0646 \u062d\u0627\u0634\u06cc\u0647") },
      ]),
    ],
  );

