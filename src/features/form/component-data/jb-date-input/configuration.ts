import { configuration, label, localizedDefault, textProperty, hiddenTextProperty, textareaProperty, urlProperty, numberProperty, ROOT_FONT_SIZE_PX, remPixelValueAdapter, colorProperty, booleanProperty, selectProperty, stringListProperty, sizeOptions, checkboxVariantOptions, checkboxColorOptions, inputModeOptions, inputTypeOptions, inputProperties, inputDefaults, inputCommon, valueControlCommon, booleanControlCommon } from "../configuration-helpers";

export const componentConfiguration = configuration(valueControlCommon, "string", { showPersianNumber: false }, [
    textProperty("message", "Helper message", "\u067e\u06cc\u0627\u0645 \u0631\u0627\u0647\u0646\u0645\u0627", true),
    textProperty("inputType", "Input type", "\u0646\u0648\u0639 \u0648\u0631\u0648\u062f\u06cc"),
    textProperty("valueType", "Value type", "\u0646\u0648\u0639 \u0645\u0642\u062f\u0627\u0631"),
    hiddenTextProperty("format", "Display format", "\u0642\u0627\u0644\u0628 \u0646\u0645\u0627\u06cc\u0634"),
    textProperty("min", "Minimum date", "\u06a9\u0645\u062a\u0631\u06cc\u0646 \u062a\u0627\u0631\u06cc\u062e"),
    textProperty("max", "Maximum date", "\u0628\u06cc\u0634\u062a\u0631\u06cc\u0646 \u062a\u0627\u0631\u06cc\u062e"),
    selectProperty("dir", "Calendar direction", "\u062c\u0647\u062a \u062a\u0642\u0648\u06cc\u0645", [
      { value: "ltr", label: label("Left to right", "\u0686\u067e \u0628\u0647 \u0631\u0627\u0633\u062a") },
      { value: "rtl", label: label("Right to left", "\u0631\u0627\u0633\u062a \u0628\u0647 \u0686\u067e") },
    ]),
    booleanProperty("showPersianNumber", "Show Persian digits", "\u0646\u0645\u0627\u06cc\u0634 \u0627\u0631\u0642\u0627\u0645 \u0641\u0627\u0631\u0633\u06cc"),
    textProperty("calendarDefaultView", "Calendar default view", "\u0646\u0645\u0627\u06cc \u067e\u06cc\u0634\u200c\u0641\u0631\u0636 \u062a\u0642\u0648\u06cc\u0645"),
  ]);
