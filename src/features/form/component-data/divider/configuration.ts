import { configuration, label, localizedDefault, textProperty, hiddenTextProperty, textareaProperty, urlProperty, numberProperty, ROOT_FONT_SIZE_PX, remPixelValueAdapter, colorProperty, booleanProperty, selectProperty, stringListProperty, sizeOptions, checkboxVariantOptions, checkboxColorOptions, inputModeOptions, inputTypeOptions, inputProperties, inputDefaults, inputCommon, valueControlCommon, booleanControlCommon } from "../configuration-helpers";

export const componentConfiguration = configuration(
    { required: false, disabled: false, initialValue: false, label: false, placeholder: false },
    "none",
    { spacing: "md", lineType: "solid" },
    [
      selectProperty("spacing", "Spacing", "\u0641\u0627\u0635\u0644\u0647", sizeOptions),
      selectProperty("lineType", "Line type", "\u0646\u0648\u0639 \u062e\u0637", [
        { value: "solid", label: label("Solid", "\u067e\u06cc\u0648\u0633\u062a\u0647") },
        { value: "dashed", label: label("Dashed", "\u062e\u0637\u200c\u0686\u06cc\u0646") },
        { value: "dotted", label: label("Dotted", "\u0646\u0642\u0637\u0647\u200c\u0686\u06cc\u0646") },
        { value: "double", label: label("Double", "\u062f\u0648\u062a\u0627\u06cc\u06cc") },
        { value: "none", label: label("No line", "\u0628\u062f\u0648\u0646 \u062e\u0637") },
      ]),
    ],
  );

