import { configuration, label, localizedDefault, textProperty, hiddenTextProperty, textareaProperty, urlProperty, numberProperty, ROOT_FONT_SIZE_PX, remPixelValueAdapter, colorProperty, booleanProperty, selectProperty, stringListProperty, sizeOptions, checkboxVariantOptions, checkboxColorOptions, inputModeOptions, inputTypeOptions, inputProperties, inputDefaults, inputCommon, valueControlCommon, booleanControlCommon } from "../configuration-helpers";

export const componentConfiguration = configuration(
    { required: false, disabled: false, initialValue: false, label: false, placeholder: false },
    "string",
    {
      url: "",
      alt: localizedDefault("", ""),
      size: "full",
      containerType: "plain",
      aspectRatio: "auto",
      objectFit: "contain",
      objectPosition: "center",
      alignment: "center",
    },
    [
      urlProperty("url", "Image URL", "\u0646\u0634\u0627\u0646\u06cc \u062a\u0635\u0648\u06cc\u0631"),
      textProperty("alt", "Alternative text", "\u0645\u062a\u0646 \u062c\u0627\u06cc\u06af\u0632\u06cc\u0646", true),
      selectProperty("size", "Size", "\u0627\u0646\u062f\u0627\u0632\u0647", [
        { value: "auto", label: label("Original", "\u0627\u0635\u0644\u06cc") },
        { value: "sm", label: label("Small", "\u06a9\u0648\u0686\u06a9") },
        { value: "md", label: label("Medium", "\u0645\u062a\u0648\u0633\u0637") },
        { value: "lg", label: label("Large", "\u0628\u0632\u0631\u06af") },
        { value: "full", label: label("Full width", "\u062a\u0645\u0627\u0645\u200c\u0639\u0631\u0636") },
      ]),
      selectProperty("containerType", "Container", "\u0646\u0648\u0639 \u0642\u0627\u0628", [
        { value: "plain", label: label("Plain", "\u0633\u0627\u062f\u0647") },
        { value: "rounded", label: label("Rounded", "\u06af\u0648\u0634\u0647\u200c\u06af\u0631\u062f") },
        { value: "circle", label: label("Circle", "\u062f\u0627\u06cc\u0631\u0647") },
        { value: "framed", label: label("Framed", "\u0642\u0627\u0628\u200c\u062f\u0627\u0631") },
      ]),
      selectProperty("aspectRatio", "Aspect ratio", "\u0646\u0633\u0628\u062a \u062a\u0635\u0648\u06cc\u0631", [
        { value: "auto", label: label("Automatic", "\u062e\u0648\u062f\u06a9\u0627\u0631") },
        { value: "square", label: label("Square (1:1)", "\u0645\u0631\u0628\u0639 (\u06f1:\u06f1)") },
        { value: "landscape", label: label("Landscape (16:9)", "\u0627\u0641\u0642\u06cc (\u06f1\u06f6:\u06f9)") },
        { value: "portrait", label: label("Portrait (4:5)", "\u0639\u0645\u0648\u062f\u06cc (\u06f4:\u06f5)") },
      ]),
      selectProperty("objectFit", "Image adjustment", "\u0646\u062d\u0648\u0647 \u062c\u0627\u06cc\u200c\u06af\u06cc\u0631\u06cc \u062a\u0635\u0648\u06cc\u0631", [
        { value: "contain", label: label("Fit inside", "\u0646\u0645\u0627\u06cc\u0634 \u06a9\u0627\u0645\u0644") },
        { value: "cover", label: label("Fill and crop", "\u067e\u0631 \u06a9\u0631\u062f\u0646 \u0648 \u0628\u0631\u0634") },
        { value: "fill", label: label("Stretch", "\u06a9\u0634\u06cc\u062f\u0646") },
        { value: "scale-down", label: label("Scale down", "\u06a9\u0648\u0686\u06a9\u200c\u0633\u0627\u0632\u06cc") },
      ]),
      selectProperty("objectPosition", "Image position", "\u0645\u0648\u0642\u0639\u06cc\u062a \u062a\u0635\u0648\u06cc\u0631", [
        { value: "center", label: label("Center", "\u0648\u0633\u0637") },
        { value: "top", label: label("Top", "\u0628\u0627\u0644\u0627") },
        { value: "bottom", label: label("Bottom", "\u067e\u0627\u06cc\u06cc\u0646") },
      ]),
      selectProperty("alignment", "Container alignment", "\u062a\u0631\u0627\u0632 \u0642\u0627\u0628", [
        { value: "start", label: label("Start", "\u0627\u0628\u062a\u062f\u0627") },
        { value: "center", label: label("Center", "\u0648\u0633\u0637") },
        { value: "end", label: label("End", "\u0627\u0646\u062a\u0647\u0627") },
      ]),
    ],
  );

