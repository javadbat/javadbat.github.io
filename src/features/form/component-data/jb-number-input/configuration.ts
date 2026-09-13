import { configuration, label, localizedDefault, textProperty, hiddenTextProperty, textareaProperty, urlProperty, numberProperty, ROOT_FONT_SIZE_PX, remPixelValueAdapter, colorProperty, booleanProperty, selectProperty, stringListProperty, sizeOptions, checkboxVariantOptions, checkboxColorOptions, inputModeOptions, inputTypeOptions, inputProperties, inputDefaults, inputCommon, valueControlCommon, booleanControlCommon } from "../configuration-helpers";

export const componentConfiguration = configuration(
    inputCommon,
    "string",
    {
      ...inputDefaults,
      acceptNegative: false,
      decimalPrecision: 0,
      showThousandSeparator: false,
      thousandSeparator: ",",
      step: 1,
      showPersianNumber: false,
      showControlButton: true,
    },
    [
      ...inputProperties,
      numberProperty("minValue", "Minimum value", "\u06a9\u0645\u062a\u0631\u06cc\u0646 \u0645\u0642\u062f\u0627\u0631"),
      numberProperty("maxValue", "Maximum value", "\u0628\u06cc\u0634\u062a\u0631\u06cc\u0646 \u0645\u0642\u062f\u0627\u0631"),
      booleanProperty("acceptNegative", "Accept negative", "\u067e\u0630\u06cc\u0631\u0634 \u0645\u0642\u062f\u0627\u0631 \u0645\u0646\u0641\u06cc"),
      numberProperty("decimalPrecision", "Decimal precision", "\u062f\u0642\u062a \u0627\u0639\u0634\u0627\u0631", {
        min: 0,
        max: 20,
        step: 1,
      }),
      booleanProperty("showThousandSeparator", "Show thousand separator", "\u0646\u0645\u0627\u06cc\u0634 \u062c\u062f\u0627\u06a9\u0646\u0646\u062f\u0647 \u0647\u0632\u0627\u0631\u06af\u0627\u0646"),
      textProperty("thousandSeparator", "Thousand separator", "\u062c\u062f\u0627\u06a9\u0646\u0646\u062f\u0647 \u0647\u0632\u0627\u0631\u06af\u0627\u0646"),
      numberProperty("step", "Step", "\u06af\u0627\u0645", { min: 0 }),
      booleanProperty("showPersianNumber", "Show Persian digits", "\u0646\u0645\u0627\u06cc\u0634 \u0627\u0631\u0642\u0627\u0645 \u0641\u0627\u0631\u0633\u06cc"),
      booleanProperty("showControlButton", "Show control buttons", "\u0646\u0645\u0627\u06cc\u0634 \u062f\u06a9\u0645\u0647\u200c\u0647\u0627\u06cc \u06a9\u0646\u062a\u0631\u0644"),
    ],
  );

