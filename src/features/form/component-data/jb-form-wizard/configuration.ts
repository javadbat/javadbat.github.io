import { configuration, label, localizedDefault, textProperty, hiddenTextProperty, textareaProperty, urlProperty, numberProperty, ROOT_FONT_SIZE_PX, remPixelValueAdapter, colorProperty, booleanProperty, selectProperty, stringListProperty, sizeOptions, checkboxVariantOptions, checkboxColorOptions, inputModeOptions, inputTypeOptions, inputProperties, inputDefaults, inputCommon, valueControlCommon, booleanControlCommon } from "../configuration-helpers";

export const componentConfiguration = configuration(
    { required: false, disabled: false, initialValue: false, label: false, placeholder: false },
    "none",
    {
      validationMode: "current",
      previousLabel: localizedDefault("Previous", "\u0642\u0628\u0644\u06cc"),
      nextLabel: localizedDefault("Next", "\u0628\u0639\u062f\u06cc"),
      completeLabel: localizedDefault("Complete", "\u062a\u06a9\u0645\u06cc\u0644"),
    },
    [
      selectProperty("validationMode", "Forward validation", "\u0627\u0639\u062a\u0628\u0627\u0631\u0633\u0646\u062c\u06cc \u062d\u0631\u06a9\u062a \u0631\u0648 \u0628\u0647 \u062c\u0644\u0648", [
        { value: "current", label: label("Validate current step", "\u0627\u0639\u062a\u0628\u0627\u0631\u0633\u0646\u062c\u06cc \u0645\u0631\u062d\u0644\u0647 \u0641\u0639\u0644\u06cc") },
        { value: "none", label: label("Do not validate", "\u0628\u062f\u0648\u0646 \u0627\u0639\u062a\u0628\u0627\u0631\u0633\u0646\u062c\u06cc") },
      ]),
      textProperty("previousLabel", "Previous button label", "\u0628\u0631\u0686\u0633\u0628 \u062f\u06a9\u0645\u0647 \u0642\u0628\u0644\u06cc", true),
      textProperty("nextLabel", "Next button label", "\u0628\u0631\u0686\u0633\u0628 \u062f\u06a9\u0645\u0647 \u0628\u0639\u062f\u06cc", true),
      textProperty("completeLabel", "Complete button label", "\u0628\u0631\u0686\u0633\u0628 \u062f\u06a9\u0645\u0647 \u062a\u06a9\u0645\u06cc\u0644", true),
    ],
  );

