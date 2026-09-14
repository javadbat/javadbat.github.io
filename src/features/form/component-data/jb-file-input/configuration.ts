import { configuration, label, localizedDefault, textProperty, hiddenTextProperty, textareaProperty, urlProperty, numberProperty, ROOT_FONT_SIZE_PX, remPixelValueAdapter, colorProperty, booleanProperty, selectProperty, stringListProperty, sizeOptions, checkboxVariantOptions, checkboxColorOptions, inputModeOptions, inputTypeOptions, inputProperties, inputDefaults, inputCommon, valueControlCommon, booleanControlCommon } from "../configuration-helpers";

export const componentConfiguration = configuration(
    {
      ...valueControlCommon,
      disabled: true,
      initialValue: false,
      label: true,
      placeholder: false,
    },
    "string",
    // jb-file-input applies this MIME allow-list when accept is empty;
    // keep the effective latest-package default in the portable document so
    // Preview and exported plans describe the actual runtime API.
    { accept: "application/msword, application/vnd.ms-excel, application/vnd.ms-powerpoint, text/plain, application/pdf, image/*" },
    [
      textProperty("message", "Helper message", "\u067e\u06cc\u0627\u0645 \u0631\u0627\u0647\u0646\u0645\u0627", true),
      textProperty("accept", "Accepted file types", "\u0646\u0648\u0639 \u0641\u0627\u06cc\u0644\u200c\u0647\u0627\u06cc \u0645\u062c\u0627\u0632"),
      numberProperty("maxSize", "Maximum file size (KB)", "\u0628\u06cc\u0634\u062a\u0631\u06cc\u0646 \u0627\u0646\u062f\u0627\u0632\u0647 \u0641\u0627\u06cc\u0644 (\u06a9\u06cc\u0644\u0648\u0628\u0627\u06cc\u062a)", { min: 0, step: 1 }),
      { ...urlProperty("uploadEndpoint", "Upload endpoint", "\u0646\u0634\u0627\u0646\u06cc endpoint \u0628\u0627\u0631\u06af\u0630\u0627\u0631\u06cc"), builderVisible: false },
    ],
  );
