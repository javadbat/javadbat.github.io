import { configuration, label, localizedDefault, textProperty, hiddenTextProperty, textareaProperty, urlProperty, numberProperty, ROOT_FONT_SIZE_PX, remPixelValueAdapter, colorProperty, booleanProperty, selectProperty, stringListProperty, sizeOptions, checkboxVariantOptions, checkboxColorOptions, inputModeOptions, inputTypeOptions, inputProperties, inputDefaults, inputCommon, valueControlCommon, booleanControlCommon } from "../configuration-helpers";

export const componentConfiguration = configuration(
    { required: false, disabled: false, initialValue: false, label: false, placeholder: false },
    "string",
    { url: "" },
    [urlProperty("url", "Audio URL", "\u0646\u0634\u0627\u0646\u06cc \u0635\u062f\u0627")],
  );

