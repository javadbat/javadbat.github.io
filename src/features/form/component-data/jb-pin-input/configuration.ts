import { configuration, label, localizedDefault, textProperty, hiddenTextProperty, textareaProperty, urlProperty, numberProperty, ROOT_FONT_SIZE_PX, remPixelValueAdapter, colorProperty, booleanProperty, selectProperty, stringListProperty, sizeOptions, checkboxVariantOptions, checkboxColorOptions, inputModeOptions, inputTypeOptions, inputProperties, inputDefaults, inputCommon, valueControlCommon, booleanControlCommon } from "../configuration-helpers";

export const componentConfiguration = configuration(
    {
      ...valueControlCommon,
      placeholder: false,
    },
    "string",
    { charLength: 4, inputmode: "numeric", autofocus: false },
    [
      textProperty("message", "Helper message", "\u067e\u06cc\u0627\u0645 \u0631\u0627\u0647\u0646\u0645\u0627", true),
      numberProperty("charLength", "Character count", "\u062a\u0639\u062f\u0627\u062f \u0646\u0648\u06cc\u0633\u0647", {
        min: 1,
        max: 12,
        step: 1,
      }),
      selectProperty(
        "inputmode",
        "Input mode",
        "\u062d\u0627\u0644\u062a \u0648\u0631\u0648\u062f\u06cc",
        inputModeOptions.map(([value, en, fa]) => ({
          value,
          label: label(en, fa),
        })),
      ),
      booleanProperty("autofocus", "Autofocus", "\u0641\u0648\u06a9\u0648\u0633 \u062e\u0648\u062f\u06a9\u0627\u0631"),
    ],
  );

