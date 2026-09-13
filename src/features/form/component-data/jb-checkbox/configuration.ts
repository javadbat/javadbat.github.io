import { configuration, label, localizedDefault, textProperty, hiddenTextProperty, textareaProperty, urlProperty, numberProperty, ROOT_FONT_SIZE_PX, remPixelValueAdapter, colorProperty, booleanProperty, selectProperty, stringListProperty, sizeOptions, checkboxVariantOptions, checkboxColorOptions, inputModeOptions, inputTypeOptions, inputProperties, inputDefaults, inputCommon, valueControlCommon, booleanControlCommon } from "../configuration-helpers";

export const componentConfiguration = configuration(booleanControlCommon, "boolean", { size: "md", variant: "solid", color: "primary" }, [
    textProperty("message", "Helper message", "\u067e\u06cc\u0627\u0645 \u0631\u0627\u0647\u0646\u0645\u0627", true),
    selectProperty("size", "Size", "\u0627\u0646\u062f\u0627\u0632\u0647", sizeOptions),
    selectProperty("variant", "Variant", "\u06af\u0648\u0646\u0647", checkboxVariantOptions),
    selectProperty("color", "Color", "\u0631\u0646\u06af", checkboxColorOptions),
  ]);

