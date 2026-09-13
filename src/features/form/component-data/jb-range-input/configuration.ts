import { configuration, label, localizedDefault, textProperty, hiddenTextProperty, textareaProperty, urlProperty, numberProperty, ROOT_FONT_SIZE_PX, remPixelValueAdapter, colorProperty, booleanProperty, selectProperty, stringListProperty, sizeOptions, checkboxVariantOptions, checkboxColorOptions, inputModeOptions, inputTypeOptions, inputProperties, inputDefaults, inputCommon, valueControlCommon, booleanControlCommon } from "../configuration-helpers";

export const componentConfiguration = configuration(
    {
      required: true,
      disabled: true,
      initialValue: true,
      label: true,
      placeholder: false,
    },
    "range",
    {
      mode: "single",
      startPoint: 0,
      min: 0,
      max: 10,
      step: 1,
      tickStep: 1,
      showTickLabels: false,
      disableBalloonRotation: false,
      size: "md",
    },
    [
      textProperty("message", "Helper message", "\u067e\u06cc\u0627\u0645 \u0631\u0627\u0647\u0646\u0645\u0627", true),
      selectProperty("mode", "Mode", "\u062d\u0627\u0644\u062a", [
        { value: "single", label: label("Single value", "\u0645\u0642\u062f\u0627\u0631 \u062a\u06a9\u06cc") },
        { value: "range", label: label("Range", "\u0628\u0627\u0632\u0647") },
      ]),
      numberProperty("startPoint", "Start point", "\u0646\u0642\u0637\u0647 \u0634\u0631\u0648\u0639"),
      numberProperty("min", "Minimum value", "\u06a9\u0645\u062a\u0631\u06cc\u0646 \u0645\u0642\u062f\u0627\u0631"),
      numberProperty("max", "Maximum value", "\u0628\u06cc\u0634\u062a\u0631\u06cc\u0646 \u0645\u0642\u062f\u0627\u0631"),
      numberProperty("step", "Step", "\u06af\u0627\u0645", { min: 0 }),
      numberProperty("tickStep", "Tick step", "\u06af\u0627\u0645 \u0646\u0634\u0627\u0646\u0647\u200c\u0647\u0627", { min: 0 }),
      numberProperty("minorTickStep", "Minor tick step", "\u06af\u0627\u0645 \u0646\u0634\u0627\u0646\u0647\u200c\u0647\u0627\u06cc \u0641\u0631\u0639\u06cc", { min: 0 }),
      booleanProperty("showTickLabels", "Show tick labels", "\u0646\u0645\u0627\u06cc\u0634 \u0628\u0631\u0686\u0633\u0628 \u0646\u0634\u0627\u0646\u0647\u200c\u0647\u0627"),
      booleanProperty("showPersianNumber", "Show Persian digits", "\u0646\u0645\u0627\u06cc\u0634 \u0627\u0631\u0642\u0627\u0645 \u0641\u0627\u0631\u0633\u06cc"),
      booleanProperty("disableBalloonRotation", "Disable balloon rotation", "\u063a\u06cc\u0631\u0641\u0639\u0627\u0644 \u06a9\u0631\u062f\u0646 \u0686\u0631\u062e\u0634 \u0628\u0627\u0644\u0646"),
      selectProperty("size", "Size", "\u0627\u0646\u062f\u0627\u0632\u0647", sizeOptions),
    ],
  );

