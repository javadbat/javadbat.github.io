import { configuration, label, localizedDefault, textProperty, hiddenTextProperty, textareaProperty, urlProperty, numberProperty, ROOT_FONT_SIZE_PX, remPixelValueAdapter, colorProperty, booleanProperty, selectProperty, stringListProperty, sizeOptions, checkboxVariantOptions, checkboxColorOptions, inputModeOptions, inputTypeOptions, inputProperties, inputDefaults, inputCommon, valueControlCommon, booleanControlCommon } from "../configuration-helpers";

export const componentConfiguration = configuration(
    { required: false, disabled: false, initialValue: false, label: false, placeholder: false },
    "string",
    {
      content: localizedDefault("Text", "\u0645\u062a\u0646"),
    },
    [
      textareaProperty("content", "Text", "\u0645\u062a\u0646", true),
      colorProperty("color", "Color", "\u0631\u0646\u06af"),
      numberProperty("fontSize", "Font size (px)", "\u0627\u0646\u062f\u0627\u0632\u0647 \u0645\u062a\u0646 (px)", {
        min: 0.5,
        max: 6,
        step: 0.125,
        valueAdapter: remPixelValueAdapter,
      }),
      selectProperty("fontWeight", "Font weight", "\u0636\u062e\u0627\u0645\u062a \u0645\u062a\u0646", [
        { value: "normal", label: label("Normal", "\u0645\u0639\u0645\u0648\u0644\u06cc") },
        { value: "medium", label: label("Medium", "\u0645\u062a\u0648\u0633\u0637") },
        { value: "semibold", label: label("Semi-bold", "\u0646\u06cc\u0645\u0647\u200c\u067e\u0631\u0631\u0646\u06af") },
        { value: "bold", label: label("Bold", "\u067e\u0631\u0631\u0646\u06af") },
      ]),
      selectProperty("textAlign", "Alignment", "\u062a\u0631\u0627\u0632 \u0645\u062a\u0646", [
        { value: "start", label: label("Start", "\u0627\u0628\u062a\u062f\u0627") },
        { value: "center", label: label("Center", "\u0648\u0633\u0637") },
        { value: "end", label: label("End", "\u0627\u0646\u062a\u0647\u0627") },
      ]),
      numberProperty("lineHeight", "Line height", "\u0627\u0631\u062a\u0641\u0627\u0639 \u062e\u0637", { min: 1, max: 3, step: 0.1 }),
    ],
  );

