import { configuration, label, localizedDefault, textProperty, hiddenTextProperty, textareaProperty, urlProperty, numberProperty, ROOT_FONT_SIZE_PX, remPixelValueAdapter, colorProperty, booleanProperty, selectProperty, stringListProperty, sizeOptions, checkboxVariantOptions, checkboxColorOptions, inputModeOptions, inputTypeOptions, inputProperties, inputDefaults, inputCommon, valueControlCommon, booleanControlCommon } from "../configuration-helpers";

export const componentConfiguration = configuration(
    {
      ...valueControlCommon,
      initialValue: false,
      placeholder: false,
    },
    "string",
    { multiple: false, acceptTypes: "image/*" },
    [
      textProperty("message", "Helper message", "\u067e\u06cc\u0627\u0645 \u0631\u0627\u0647\u0646\u0645\u0627", true),
      booleanProperty("multiple", "Multiple images", "\u0686\u0646\u062f \u062a\u0635\u0648\u06cc\u0631"),
      textProperty("acceptTypes", "Accepted image types", "\u0646\u0648\u0639 \u062a\u0635\u0648\u06cc\u0631\u0647\u0627\u06cc \u0645\u062c\u0627\u0632"),
      numberProperty("maxFileSize", "Maximum file size (MB)", "\u0628\u06cc\u0634\u062a\u0631\u06cc\u0646 \u0627\u0646\u062f\u0627\u0632\u0647 \u0641\u0627\u06cc\u0644 (\u0645\u06af\u0627\u0628\u0627\u06cc\u062a)", { min: 0, step: 0.1 }),
      { ...urlProperty("uploadEndpoint", "Upload endpoint", "\u0646\u0634\u0627\u0646\u06cc endpoint \u0628\u0627\u0631\u06af\u0630\u0627\u0631\u06cc"), builderVisible: false },
    ],
  );

