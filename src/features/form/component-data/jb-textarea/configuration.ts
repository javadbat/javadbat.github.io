import { configuration, label, localizedDefault, textProperty, hiddenTextProperty, textareaProperty, urlProperty, numberProperty, ROOT_FONT_SIZE_PX, remPixelValueAdapter, colorProperty, booleanProperty, selectProperty, stringListProperty, sizeOptions, checkboxVariantOptions, checkboxColorOptions, inputModeOptions, inputTypeOptions, inputProperties, inputDefaults, inputCommon, valueControlCommon, booleanControlCommon } from "../configuration-helpers";

export const componentConfiguration = configuration(valueControlCommon, "string", { autoHeight: true }, [
    textProperty("message", "Helper message", "\u067e\u06cc\u0627\u0645 \u0631\u0627\u0647\u0646\u0645\u0627", true),
    booleanProperty("autoHeight", "Automatic height", "\u0627\u0631\u062a\u0641\u0627\u0639 \u062e\u0648\u062f\u06a9\u0627\u0631"),
  ]);

