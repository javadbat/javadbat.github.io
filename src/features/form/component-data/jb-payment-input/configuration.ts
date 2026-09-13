import { configuration, label, localizedDefault, textProperty, hiddenTextProperty, textareaProperty, urlProperty, numberProperty, ROOT_FONT_SIZE_PX, remPixelValueAdapter, colorProperty, booleanProperty, selectProperty, stringListProperty, sizeOptions, checkboxVariantOptions, checkboxColorOptions, inputModeOptions, inputTypeOptions, inputProperties, inputDefaults, inputCommon, valueControlCommon, booleanControlCommon } from "../configuration-helpers";

export const componentConfiguration = configuration(inputCommon, "string", { ...inputDefaults, inputType: "CARD", separator: " " }, [
    ...inputProperties,
    selectProperty("inputType", "Payment type", "\u0646\u0648\u0639 \u067e\u0631\u062f\u0627\u062e\u062a", [
      { value: "CARD", label: label("Card", "\u06a9\u0627\u0631\u062a") },
      { value: "SHABA", label: label("SHABA", "\u0634\u0628\u0627") },
    ]),
    textProperty("separator", "Separator", "\u062c\u062f\u0627\u06a9\u0646\u0646\u062f\u0647"),
  ]);

