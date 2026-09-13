import { configuration, label, localizedDefault, textProperty, hiddenTextProperty, textareaProperty, urlProperty, numberProperty, ROOT_FONT_SIZE_PX, remPixelValueAdapter, colorProperty, booleanProperty, selectProperty, stringListProperty, sizeOptions, checkboxVariantOptions, checkboxColorOptions, inputModeOptions, inputTypeOptions, inputProperties, inputDefaults, inputCommon, valueControlCommon, booleanControlCommon } from "../configuration-helpers";

export const componentConfiguration = configuration(
    { required: false, disabled: false, initialValue: false, label: false, placeholder: false },
    "none",
    {
      orientation: "horizontal",
      size: "md",
      nullable: false,
      defaultValue: "tab_1",
      ariaLabel: localizedDefault("Form sections", "\u0628\u062e\u0634\u200c\u0647\u0627\u06cc \u0641\u0631\u0645"),
    },
    [
      selectProperty("orientation", "Orientation", "\u062c\u0647\u062a", [
        { value: "horizontal", label: label("Horizontal", "\u0627\u0641\u0642\u06cc") },
        { value: "vertical", label: label("Vertical", "\u0639\u0645\u0648\u062f\u06cc") },
      ]),
      selectProperty("size", "Size", "\u0627\u0646\u062f\u0627\u0632\u0647", sizeOptions),
      booleanProperty("nullable", "Allow no active tab", "\u0627\u062c\u0627\u0632\u0647 \u0628\u062f\u0648\u0646 \u062a\u0628 \u0641\u0639\u0627\u0644"),
      textProperty("defaultValue", "Initially active tab value", "\u0645\u0642\u062f\u0627\u0631 \u062a\u0628 \u0641\u0639\u0627\u0644 \u0627\u0648\u0644\u06cc\u0647"),
      hiddenTextProperty("ariaLabel", "Accessible tab-list label", "\u0628\u0631\u0686\u0633\u0628 \u062f\u0633\u062a\u0631\u0633\u200c\u067e\u0630\u06cc\u0631\u06cc \u0641\u0647\u0631\u0633\u062a \u062a\u0628", true),
    ],
  );

