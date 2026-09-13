import { configuration, label, localizedDefault, textProperty, hiddenTextProperty, textareaProperty, urlProperty, numberProperty, ROOT_FONT_SIZE_PX, remPixelValueAdapter, colorProperty, booleanProperty, selectProperty, stringListProperty, sizeOptions, checkboxVariantOptions, checkboxColorOptions, inputModeOptions, inputTypeOptions, inputProperties, inputDefaults, inputCommon, valueControlCommon, booleanControlCommon } from "../configuration-helpers";

export const componentConfiguration = configuration(
    { required: false, disabled: false, initialValue: false, label: false, placeholder: false },
    "none",
    { content: localizedDefault("Section", "\u0628\u062e\u0634"), level: "h2" },
    [
      textProperty("content", "Heading", "\u0639\u0646\u0648\u0627\u0646 \u0628\u062e\u0634", true),
      selectProperty("level", "Heading level", "\u0633\u0637\u062d \u0639\u0646\u0648\u0627\u0646", [
        { value: "h2", label: label("Heading 2", "\u0639\u0646\u0648\u0627\u0646 \u06f2") },
        { value: "h3", label: label("Heading 3", "\u0639\u0646\u0648\u0627\u0646 \u06f3") },
        { value: "h4", label: label("Heading 4", "\u0639\u0646\u0648\u0627\u0646 \u06f4") },
      ]),
    ],
  );

