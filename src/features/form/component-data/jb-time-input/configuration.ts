import { configuration, label, localizedDefault, textProperty, hiddenTextProperty, textareaProperty, urlProperty, numberProperty, ROOT_FONT_SIZE_PX, remPixelValueAdapter, colorProperty, booleanProperty, selectProperty, stringListProperty, sizeOptions, checkboxVariantOptions, checkboxColorOptions, inputModeOptions, inputTypeOptions, inputProperties, inputDefaults, inputCommon, valueControlCommon, booleanControlCommon } from "../configuration-helpers";

export const componentConfiguration = configuration(
    valueControlCommon,
    "string",
    {
      secondEnabled: false,
      frontalZero: true,
      optionalUnits: [],
      showPersianNumber: false,
    },
    [
      textProperty("message", "Helper message", "\u067e\u06cc\u0627\u0645 \u0631\u0627\u0647\u0646\u0645\u0627", true),
      booleanProperty("secondEnabled", "Enable seconds", "\u0641\u0639\u0627\u0644\u200c\u0633\u0627\u0632\u06cc \u062b\u0627\u0646\u06cc\u0647"),
      booleanProperty("frontalZero", "Leading zero", "\u0635\u0641\u0631 \u0627\u0628\u062a\u062f\u0627\u06cc\u06cc"),
      stringListProperty("optionalUnits", "Optional units", "\u0648\u0627\u062d\u062f\u0647\u0627\u06cc \u0627\u062e\u062a\u06cc\u0627\u0631\u06cc"),
      booleanProperty("showPersianNumber", "Show Persian digits", "\u0646\u0645\u0627\u06cc\u0634 \u0627\u0631\u0642\u0627\u0645 \u0641\u0627\u0631\u0633\u06cc"),
      textProperty("closeButtonText", "Close button text", "\u0645\u062a\u0646 \u062f\u06a9\u0645\u0647 \u0628\u0633\u062a\u0646", true),
    ],
  );

