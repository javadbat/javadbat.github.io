import { configuration, label, localizedDefault, textProperty, hiddenTextProperty, textareaProperty, urlProperty, numberProperty, ROOT_FONT_SIZE_PX, remPixelValueAdapter, colorProperty, booleanProperty, selectProperty, stringListProperty, sizeOptions, checkboxVariantOptions, checkboxColorOptions, inputModeOptions, inputTypeOptions, inputProperties, inputDefaults, inputCommon, valueControlCommon, booleanControlCommon } from "../configuration-helpers";

export const componentConfiguration = configuration(
    {
      required: false,
      disabled: true,
      initialValue: false,
      label: false,
      placeholder: false,
    },
    "string",
    {
      content: localizedDefault("Next", "\u0627\u0631\u0633\u0627\u0644"),
      type: "button",
      action: "next",
      color: "primary",
      variant: "solid",
      size: "md",
      isLoading: false,
      loadingText: localizedDefault("Please wait", "\u0644\u0637\u0641\u0627\u064b \u0635\u0628\u0631 \u06a9\u0646\u06cc\u062f"),
      square: false,
    },
    [
      textProperty("content", "Content", "\u0645\u062a\u0646 \u062f\u06a9\u0645\u0647", true),
      selectProperty("type", "Button type", "\u0646\u0648\u0639 \u062f\u06a9\u0645\u0647", [
        { value: "button", label: label("Button", "\u062f\u06a9\u0645\u0647") },
      ]),
      selectProperty("action", "Action", "\u0639\u0645\u0644\u06a9\u0631\u062f", [
        { value: "next", label: label("Next tab", "\u062a\u0628 \u0628\u0639\u062f\u06cc") },
        { value: "previous", label: label("Previous tab", "\u062a\u0628 \u0642\u0628\u0644\u06cc") },
        { value: "custom", label: label("Custom (handled by programmer)", "\u0633\u0641\u0627\u0631\u0634\u06cc (\u062a\u0648\u0633\u0637 \u0628\u0631\u0646\u0627\u0645\u0647\u200c\u0646\u0648\u06cc\u0633)") },
      ]),
      selectProperty("color", "Color", "\u0631\u0646\u06af", [
        { value: "primary", label: label("Primary", "\u0627\u0635\u0644\u06cc") },
        { value: "secondary", label: label("Secondary", "\u062b\u0627\u0646\u0648\u06cc\u0647") },
        { value: "positive", label: label("Positive", "\u0645\u062b\u0628\u062a") },
        { value: "danger", label: label("Danger", "\u062e\u0637\u0631") },
        { value: "warning", label: label("Warning", "\u0647\u0634\u062f\u0627\u0631") },
        { value: "light", label: label("Light", "\u0631\u0648\u0634\u0646") },
        { value: "dark", label: label("Dark", "\u062a\u06cc\u0631\u0647") },
      ]),
      selectProperty("variant", "Variant", "\u06af\u0648\u0646\u0647", [
        { value: "solid", label: label("Solid", "\u062a\u0648\u067e\u0631") },
        { value: "outline", label: label("Outline", "\u062e\u0637\u06cc") },
        { value: "ghost", label: label("Ghost", "\u0634\u0641\u0627\u0641") },
        { value: "text", label: label("Text", "\u0645\u062a\u0646\u06cc") },
      ]),
      selectProperty("size", "Size", "\u0627\u0646\u062f\u0627\u0632\u0647", sizeOptions),
      booleanProperty("isLoading", "Loading", "\u062f\u0631 \u062d\u0627\u0644 \u0628\u0627\u0631\u06af\u0630\u0627\u0631\u06cc"),
      textProperty("loadingText", "Loading text", "\u0645\u062a\u0646 \u0628\u0627\u0631\u06af\u0630\u0627\u0631\u06cc", true),
      booleanProperty("square", "Square", "\u0645\u0631\u0628\u0639"),
    ],
  );

