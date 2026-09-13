import { configuration, label, localizedDefault, textProperty, hiddenTextProperty, textareaProperty, urlProperty, numberProperty, ROOT_FONT_SIZE_PX, remPixelValueAdapter, colorProperty, booleanProperty, selectProperty, stringListProperty, sizeOptions, checkboxVariantOptions, checkboxColorOptions, inputModeOptions, inputTypeOptions, inputProperties, inputDefaults, inputCommon, valueControlCommon, booleanControlCommon } from "../configuration-helpers";

export const componentConfiguration = configuration(
    valueControlCommon,
    "select",
    {
      multiple: false,
      size: "md",
      popoverPosition: "fixed",
      hideClear: false,
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
      textProperty("searchPlaceholder", "Search placeholder", "\u0645\u062a\u0646 \u0631\u0627\u0647\u0646\u0645\u0627\u06cc \u062c\u0633\u062a\u062c\u0648", true),
      booleanProperty("multiple", "Multiple selection", "\u0627\u0646\u062a\u062e\u0627\u0628 \u0686\u0646\u062f\u06af\u0627\u0646\u0647"),
      selectProperty("size", "Size", "\u0627\u0646\u062f\u0627\u0632\u0647", sizeOptions),
      selectProperty("popoverPosition", "Popover position", "\u062c\u0627\u06cc\u06af\u0627\u0647 \u067e\u0646\u062c\u0631\u0647 \u0627\u0646\u062a\u062e\u0627\u0628", [
        { value: "fixed", label: label("Fixed", "\u062b\u0627\u0628\u062a") },
        { value: "absolute", label: label("Absolute", "\u0645\u0637\u0644\u0642") },
      ]),
      booleanProperty("hideClear", "Hide clear button", "\u067e\u0646\u0647\u0627\u0646\u200c\u06a9\u0631\u062f\u0646 \u067e\u0627\u06a9\u200c\u06a9\u0631\u062f\u0646"),
      {
        key: "options",
        label: label("Options", "\u06af\u0632\u06cc\u0646\u0647\u200c\u0647\u0627"),
        control: "options",
      },
    ],
  );

