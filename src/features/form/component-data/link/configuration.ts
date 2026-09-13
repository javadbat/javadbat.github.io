import { configuration, label, localizedDefault, textProperty, hiddenTextProperty, textareaProperty, urlProperty, numberProperty, ROOT_FONT_SIZE_PX, remPixelValueAdapter, colorProperty, booleanProperty, selectProperty, stringListProperty, sizeOptions, checkboxVariantOptions, checkboxColorOptions, inputModeOptions, inputTypeOptions, inputProperties, inputDefaults, inputCommon, valueControlCommon, booleanControlCommon } from "../configuration-helpers";

export const componentConfiguration = configuration(
    { required: false, disabled: false, initialValue: false, label: false, placeholder: false },
    "none",
    {
      content: localizedDefault("Link", "\u067e\u06cc\u0648\u0646\u062f"),
      url: "",
      openInNewTab: false,
    },
    [
      textProperty("content", "Text", "\u0645\u062a\u0646", true),
      urlProperty("url", "URL", "\u0646\u0634\u0627\u0646\u06cc"),
      booleanProperty("openInNewTab", "Open in new tab", "\u0628\u0627\u0632 \u06a9\u0631\u062f\u0646 \u062f\u0631 \u0632\u0628\u0627\u0646\u0647 \u062c\u062f\u06cc\u062f"),
    ],
  );

