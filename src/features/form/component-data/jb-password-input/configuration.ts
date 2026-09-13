import { configuration, label, localizedDefault, textProperty, hiddenTextProperty, textareaProperty, urlProperty, numberProperty, ROOT_FONT_SIZE_PX, remPixelValueAdapter, colorProperty, booleanProperty, selectProperty, stringListProperty, sizeOptions, checkboxVariantOptions, checkboxColorOptions, inputModeOptions, inputTypeOptions, inputProperties, inputDefaults, inputCommon, valueControlCommon, booleanControlCommon } from "../configuration-helpers";

export const componentConfiguration = configuration(inputCommon, "string", { ...inputDefaults, type: "password", autocomplete: "current-password" }, [
    ...inputProperties,
    numberProperty("minLength", "Minimum length", "\u06a9\u0645\u062a\u0631\u06cc\u0646 \u0637\u0648\u0644", {
      min: 0,
      step: 1,
    }),
  ]);

