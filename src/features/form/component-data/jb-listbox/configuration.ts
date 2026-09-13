import { configuration, label, localizedDefault, textProperty, hiddenTextProperty, textareaProperty, urlProperty, numberProperty, ROOT_FONT_SIZE_PX, remPixelValueAdapter, colorProperty, booleanProperty, selectProperty, stringListProperty, sizeOptions, checkboxVariantOptions, checkboxColorOptions, inputModeOptions, inputTypeOptions, inputProperties, inputDefaults, inputCommon, valueControlCommon, booleanControlCommon } from "../configuration-helpers";

export const componentConfiguration = configuration(
    {
      ...valueControlCommon,
      placeholder: false,
    },
    "select",
    {
      multiple: false,
      useCheckbox: true,
      options: [
        {
          id: "option_1",
          value: "option_1",
          label: localizedDefault("Option 1", "\u06af\u0632\u06cc\u0646\u0647 \u06f1"),
          disabled: false,
        },
      ],
    },
    [
      textProperty("message", "Helper message", "\u067e\u06cc\u0627\u0645 \u0631\u0627\u0647\u0646\u0645\u0627", true),
      booleanProperty("multiple", "Multiple selection", "\u0627\u0646\u062a\u062e\u0627\u0628 \u0686\u0646\u062f\u06af\u0627\u0646\u0647"),
      booleanProperty("useCheckbox", "Use checkbox", "\u0627\u0633\u062a\u0641\u0627\u062f\u0647 \u0627\u0632 \u0686\u06a9\u200c\u0628\u0627\u06a9\u0633"),
      {
        key: "options",
        label: label("Options", "\u06af\u0632\u06cc\u0646\u0647\u200c\u0647\u0627"),
        control: "options",
      },
    ],
  );

