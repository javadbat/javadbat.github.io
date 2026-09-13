import { configuration, label, localizedDefault, textProperty, hiddenTextProperty, textareaProperty, urlProperty, numberProperty, ROOT_FONT_SIZE_PX, remPixelValueAdapter, colorProperty, booleanProperty, selectProperty, stringListProperty, sizeOptions, checkboxVariantOptions, checkboxColorOptions, inputModeOptions, inputTypeOptions, inputProperties, inputDefaults, inputCommon, valueControlCommon, booleanControlCommon } from "../configuration-helpers";

export const componentConfiguration = configuration(
    {
      ...booleanControlCommon,
      label: false,
    },
    "boolean",
    { isLoading: false },
    [
      textProperty("trueTitle", "True title", "\u0639\u0646\u0648\u0627\u0646 \u0631\u0648\u0634\u0646", true),
      textProperty("falseTitle", "False title", "\u0639\u0646\u0648\u0627\u0646 \u062e\u0627\u0645\u0648\u0634", true),
      booleanProperty("isLoading", "Loading", "\u062f\u0631 \u062d\u0627\u0644 \u0628\u0627\u0631\u06af\u0630\u0627\u0631\u06cc"),
    ],
  );

