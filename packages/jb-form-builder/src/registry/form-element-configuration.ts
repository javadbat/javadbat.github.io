import type { JBFormElementType, JSONValue } from "../contract/form-document";

export type PropertyControl = "text" | "textarea" | "url" | "number" | "color" | "boolean" | "select" | "string-list" | "options";

export interface PropertyLabel {
  en: string;
  fa: string;
}

export interface PropertyOption {
  value: string;
  label: PropertyLabel;
}

export interface FormElementPropertyDefinition {
  key: string;
  label: PropertyLabel;
  control: PropertyControl;
  localized?: boolean;
  builderVisible?: boolean;
  min?: number;
  max?: number;
  step?: number;
  options?: readonly PropertyOption[];
}

export interface CommonFieldSupport {
  required: boolean;
  disabled: boolean;
  initialValue: boolean;
  label: boolean;
  placeholder: boolean;
}

export type InitialValueKind = "string" | "boolean" | "select" | "range" | "none";

export interface FormElementConfiguration {
  commonFields: CommonFieldSupport;
  initialValueKind: InitialValueKind;
  defaultProps: Record<string, JSONValue>;
  propertyDefinitions: readonly FormElementPropertyDefinition[];
}

const label = (en: string, fa: string): PropertyLabel => ({ en, fa });

const localizedDefault = (en: string, fa: string): JSONValue => ({ translations: { en, fa } });

const textProperty = (key: string, en: string, fa: string, localized = false): FormElementPropertyDefinition => ({
  key,
  label: label(en, fa),
  control: "text",
  localized,
});

const hiddenTextProperty = (key: string, en: string, fa: string, localized = false): FormElementPropertyDefinition => ({
  ...textProperty(key, en, fa, localized),
  builderVisible: false,
});

const textareaProperty = (key: string, en: string, fa: string, localized = false): FormElementPropertyDefinition => ({
  key,
  label: label(en, fa),
  control: "textarea",
  localized,
});

const urlProperty = (key: string, en: string, fa: string): FormElementPropertyDefinition => ({
  key,
  label: label(en, fa),
  control: "url",
});

const numberProperty = (key: string, en: string, fa: string, options: Pick<FormElementPropertyDefinition, "min" | "max" | "step"> = {}): FormElementPropertyDefinition => ({
  key,
  label: label(en, fa),
  control: "number",
  ...options,
});

const colorProperty = (key: string, en: string, fa: string): FormElementPropertyDefinition => ({
  key,
  label: label(en, fa),
  control: "color",
});

const booleanProperty = (key: string, en: string, fa: string): FormElementPropertyDefinition => ({
  key,
  label: label(en, fa),
  control: "boolean",
});

const selectProperty = (key: string, en: string, fa: string, options: readonly PropertyOption[]): FormElementPropertyDefinition => ({
  key,
  label: label(en, fa),
  control: "select",
  options,
});

const stringListProperty = (key: string, en: string, fa: string): FormElementPropertyDefinition => ({
  key,
  label: label(en, fa),
  control: "string-list",
});

const sizeOptions = ["xs", "sm", "md", "lg", "xl"].map(value => ({
  value,
  label: label(value.toUpperCase(), value.toUpperCase()),
}));

const inputModeOptions = [
  ["text", "Text", "متن"],
  ["numeric", "Numeric", "عددی"],
  ["decimal", "Decimal", "اعشاری"],
  ["tel", "Telephone", "تلفن"],
  ["email", "Email", "ایمیل"],
  ["url", "URL", "نشانی وب"],
] as const;

const inputTypeOptions = [
  ["text", "Text", "متن"],
  ["number", "Number", "عدد"],
  ["password", "Password", "گذرواژه"],
  ["tel", "Telephone", "تلفن"],
  ["email", "Email", "ایمیل"],
  ["url", "URL", "نشانی وب"],
  ["search", "Search", "جستجو"],
] as const;

const inputProperties = [
  textProperty("message", "Helper message", " (زیر کادر)پیام راهنما", true),
  selectProperty("size", "Size", "اندازه", sizeOptions),
  selectProperty(
    "type",
    "Input type",
    "نوع ورودی",
    inputTypeOptions.map(([value, en, fa]) => ({
      value,
      label: label(en, fa),
    })),
  ),
  selectProperty(
    "inputmode",
    "Input mode",
    "حالت ورودی",
    inputModeOptions.map(([value, en, fa]) => ({
      value,
      label: label(en, fa),
    })),
  ),
  textProperty("autocomplete", "Autocomplete", "تکمیل خودکار"),
] as const;

const inputDefaults: Record<string, JSONValue> = {
  size: "md",
  type: "text",
  inputmode: "text",
  autocomplete: "off",
};

const inputCommon: CommonFieldSupport = {
  required: true,
  disabled: true,
  initialValue: true,
  label: true,
  placeholder: true,
};

const valueControlCommon: CommonFieldSupport = {
  required: true,
  disabled: true,
  initialValue: true,
  label: true,
  placeholder: true,
};

const booleanControlCommon: CommonFieldSupport = {
  required: true,
  disabled: true,
  initialValue: true,
  label: true,
  placeholder: false,
};

const configuration = (
  commonFields: CommonFieldSupport,
  initialValueKind: InitialValueKind,
  defaultProps: Record<string, JSONValue>,
  propertyDefinitions: readonly FormElementPropertyDefinition[],
): FormElementConfiguration => ({
  commonFields,
  initialValueKind,
  defaultProps,
  propertyDefinitions,
});

export const configurationByType: Record<JBFormElementType, FormElementConfiguration> = {
  divider: configuration(
    { required: false, disabled: false, initialValue: false, label: false, placeholder: false },
    "none",
    { spacing: "md" },
    [selectProperty("spacing", "Spacing", "فاصله", sizeOptions)],
  ),
  "section-heading": configuration(
    { required: false, disabled: false, initialValue: false, label: false, placeholder: false },
    "none",
    { content: localizedDefault("Section", "بخش"), level: "h2" },
    [
      textProperty("content", "Heading", "عنوان بخش", true),
      selectProperty("level", "Heading level", "سطح عنوان", [
        { value: "h2", label: label("Heading 2", "عنوان ۲") },
        { value: "h3", label: label("Heading 3", "عنوان ۳") },
        { value: "h4", label: label("Heading 4", "عنوان ۴") },
      ]),
    ],
  ),
  text: configuration(
    { required: false, disabled: false, initialValue: false, label: false, placeholder: false },
    "string",
    {
      content: localizedDefault("Text", "متن"),
    },
    [
      textareaProperty("content", "Text", "متن", true),
      colorProperty("color", "Color", "رنگ"),
      numberProperty("fontSize", "Font size (rem)", "اندازه متن (rem)", { min: 0.5, max: 6, step: 0.125 }),
      selectProperty("fontWeight", "Font weight", "ضخامت متن", [
        { value: "normal", label: label("Normal", "معمولی") },
        { value: "medium", label: label("Medium", "متوسط") },
        { value: "semibold", label: label("Semi-bold", "نیمه‌پررنگ") },
        { value: "bold", label: label("Bold", "پررنگ") },
      ]),
      selectProperty("textAlign", "Alignment", "تراز متن", [
        { value: "start", label: label("Start", "ابتدا") },
        { value: "center", label: label("Center", "وسط") },
        { value: "end", label: label("End", "انتها") },
      ]),
      numberProperty("lineHeight", "Line height", "ارتفاع خط", { min: 1, max: 3, step: 0.1 }),
    ],
  ),
  image: configuration(
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
      urlProperty("url", "Image URL", "نشانی تصویر"),
      textProperty("alt", "Alternative text", "متن جایگزین", true),
      selectProperty("size", "Size", "اندازه", [
        { value: "auto", label: label("Original", "اصلی") },
        { value: "sm", label: label("Small", "کوچک") },
        { value: "md", label: label("Medium", "متوسط") },
        { value: "lg", label: label("Large", "بزرگ") },
        { value: "full", label: label("Full width", "تمام‌عرض") },
      ]),
      selectProperty("containerType", "Container", "نوع قاب", [
        { value: "plain", label: label("Plain", "ساده") },
        { value: "rounded", label: label("Rounded", "گوشه‌گرد") },
        { value: "circle", label: label("Circle", "دایره") },
        { value: "framed", label: label("Framed", "قاب‌دار") },
      ]),
      selectProperty("aspectRatio", "Aspect ratio", "نسبت تصویر", [
        { value: "auto", label: label("Automatic", "خودکار") },
        { value: "square", label: label("Square (1:1)", "مربع (۱:۱)") },
        { value: "landscape", label: label("Landscape (16:9)", "افقی (۱۶:۹)") },
        { value: "portrait", label: label("Portrait (4:5)", "عمودی (۴:۵)") },
      ]),
      selectProperty("objectFit", "Image adjustment", "نحوه جای‌گیری تصویر", [
        { value: "contain", label: label("Fit inside", "نمایش کامل") },
        { value: "cover", label: label("Fill and crop", "پر کردن و برش") },
        { value: "fill", label: label("Stretch", "کشیدن") },
        { value: "scale-down", label: label("Scale down", "کوچک‌سازی") },
      ]),
      selectProperty("objectPosition", "Image position", "موقعیت تصویر", [
        { value: "center", label: label("Center", "وسط") },
        { value: "top", label: label("Top", "بالا") },
        { value: "bottom", label: label("Bottom", "پایین") },
      ]),
      selectProperty("alignment", "Container alignment", "تراز قاب", [
        { value: "start", label: label("Start", "ابتدا") },
        { value: "center", label: label("Center", "وسط") },
        { value: "end", label: label("End", "انتها") },
      ]),
    ],
  ),
  voice: configuration(
    { required: false, disabled: false, initialValue: false, label: false, placeholder: false },
    "string",
    { url: "" },
    [urlProperty("url", "Audio URL", "نشانی صدا")],
  ),
  link: configuration(
    { required: false, disabled: false, initialValue: false, label: false, placeholder: false },
    "none",
    {
      content: localizedDefault("Link", "پیوند"),
      url: "",
      openInNewTab: false,
    },
    [
      textProperty("content", "Text", "متن", true),
      urlProperty("url", "URL", "نشانی"),
      booleanProperty("openInNewTab", "Open in new tab", "باز کردن در زبانه جدید"),
    ],
  ),
  "jb-tab": configuration(
    { required: false, disabled: false, initialValue: false, label: false, placeholder: false },
    "none",
    {
      orientation: "horizontal",
      size: "md",
      nullable: false,
      defaultValue: "tab_1",
      ariaLabel: localizedDefault("Form sections", "بخش‌های فرم"),
    },
    [
      selectProperty("orientation", "Orientation", "جهت", [
        { value: "horizontal", label: label("Horizontal", "افقی") },
        { value: "vertical", label: label("Vertical", "عمودی") },
      ]),
      selectProperty("size", "Size", "اندازه", sizeOptions),
      booleanProperty("nullable", "Allow no active tab", "اجازه بدون تب فعال"),
      textProperty("defaultValue", "Initially active tab value", "مقدار تب فعال اولیه"),
      hiddenTextProperty("ariaLabel", "Accessible tab-list label", "برچسب دسترس‌پذیری فهرست تب", true),
    ],
  ),
  "jb-condition": configuration(
    { required: false, disabled: false, initialValue: false, label: false, placeholder: false },
    "none",
    {},
    [],
  ),
  "jb-form-wizard": configuration(
    { required: false, disabled: false, initialValue: false, label: false, placeholder: false },
    "none",
    {
      validationMode: "current",
      previousLabel: localizedDefault("Previous", "قبلی"),
      nextLabel: localizedDefault("Next", "بعدی"),
      completeLabel: localizedDefault("Complete", "تکمیل"),
    },
    [
      selectProperty("validationMode", "Forward validation", "اعتبارسنجی حرکت رو به جلو", [
        { value: "current", label: label("Validate current step", "اعتبارسنجی مرحله فعلی") },
        { value: "none", label: label("Do not validate", "بدون اعتبارسنجی") },
      ]),
      textProperty("previousLabel", "Previous button label", "برچسب دکمه قبلی", true),
      textProperty("nextLabel", "Next button label", "برچسب دکمه بعدی", true),
      textProperty("completeLabel", "Complete button label", "برچسب دکمه تکمیل", true),
    ],
  ),
  "jb-repeatable-group": configuration(
    { required: false, disabled: false, initialValue: false, label: false, placeholder: false },
    "none",
    {
      repeatCount: 1,
      minItems: 1,
      maxItems: 10,
      allowAdd: false,
      itemBackground: "#f8fafc",
      itemBackgroundHover: "#eef4ff",
      itemBorderColor: "#d9e2f0",
      itemBorderType: "solid",
    },
    [
      numberProperty("repeatCount", "Initial repetitions", "تعداد تکرار اولیه", { min: 0, step: 1 }),
      booleanProperty("allowAdd", "Let respondent add items", "اجازه افزودن مورد به کاربر"),
      numberProperty("minItems", "Minimum items", "حداقل موارد", { min: 0, step: 1 }),
      numberProperty("maxItems", "Maximum items", "حداکثر موارد", { min: 0, step: 1 }),
      colorProperty("itemBackground", "Item background", "پس‌زمینه مورد"),
      colorProperty("itemBackgroundHover", "Item background on hover", "پس‌زمینه مورد هنگام هاور"),
      colorProperty("itemBorderColor", "Item border color", "رنگ حاشیه مورد"),
      selectProperty("itemBorderType", "Item border type", "نوع حاشیه مورد", [
        { value: "solid", label: label("Solid", "پیوسته") },
        { value: "dashed", label: label("Dashed", "خط‌چین") },
        { value: "dotted", label: label("Dotted", "نقطه‌چین") },
        { value: "none", label: label("None", "بدون حاشیه") },
      ]),
    ],
  ),
  "jb-input": configuration(inputCommon, "string", inputDefaults, inputProperties),
  "jb-number-input": configuration(
    inputCommon,
    "string",
    {
      ...inputDefaults,
      acceptNegative: false,
      decimalPrecision: 0,
      showThousandSeparator: false,
      thousandSeparator: ",",
      step: 1,
      showPersianNumber: false,
      showControlButton: true,
    },
    [
      ...inputProperties,
      numberProperty("minValue", "Minimum value", "کمترین مقدار"),
      numberProperty("maxValue", "Maximum value", "بیشترین مقدار"),
      booleanProperty("acceptNegative", "Accept negative", "پذیرش مقدار منفی"),
      numberProperty("decimalPrecision", "Decimal precision", "دقت اعشار", {
        min: 0,
        max: 20,
        step: 1,
      }),
      booleanProperty("showThousandSeparator", "Show thousand separator", "نمایش جداکننده هزارگان"),
      textProperty("thousandSeparator", "Thousand separator", "جداکننده هزارگان"),
      numberProperty("step", "Step", "گام", { min: 0 }),
      booleanProperty("showPersianNumber", "Show Persian digits", "نمایش ارقام فارسی"),
      booleanProperty("showControlButton", "Show control buttons", "نمایش دکمه‌های کنترل"),
    ],
  ),
  "jb-range-input": configuration(
    {
      required: true,
      disabled: true,
      initialValue: true,
      label: true,
      placeholder: false,
    },
    "range",
    {
      mode: "single",
      startPoint: 0,
      min: 0,
      max: 10,
      step: 1,
      tickStep: 1,
      showTickLabels: false,
      disableBalloonRotation: false,
      size: "md",
    },
    [
      textProperty("message", "Helper message", "پیام راهنما", true),
      selectProperty("mode", "Mode", "حالت", [
        { value: "single", label: label("Single value", "مقدار تکی") },
        { value: "range", label: label("Range", "بازه") },
      ]),
      numberProperty("startPoint", "Start point", "نقطه شروع"),
      numberProperty("min", "Minimum value", "کمترین مقدار"),
      numberProperty("max", "Maximum value", "بیشترین مقدار"),
      numberProperty("step", "Step", "گام", { min: 0 }),
      numberProperty("tickStep", "Tick step", "گام نشانه‌ها", { min: 0 }),
      numberProperty("minorTickStep", "Minor tick step", "گام نشانه‌های فرعی", { min: 0 }),
      booleanProperty("showTickLabels", "Show tick labels", "نمایش برچسب نشانه‌ها"),
      booleanProperty("showPersianNumber", "Show Persian digits", "نمایش ارقام فارسی"),
      booleanProperty("disableBalloonRotation", "Disable balloon rotation", "غیرفعال کردن چرخش بالن"),
      selectProperty("size", "Size", "اندازه", sizeOptions),
    ],
  ),
  "jb-mobile-input": configuration(inputCommon, "string", { ...inputDefaults, inputmode: "tel", autocomplete: "tel" }, inputProperties),
  "jb-password-input": configuration(inputCommon, "string", { ...inputDefaults, type: "password", autocomplete: "current-password" }, [
    ...inputProperties,
    numberProperty("minLength", "Minimum length", "کمترین طول", {
      min: 0,
      step: 1,
    }),
  ]),
  "jb-payment-input": configuration(inputCommon, "string", { ...inputDefaults, inputType: "CARD", separator: " " }, [
    ...inputProperties,
    selectProperty("inputType", "Payment type", "نوع پرداخت", [
      { value: "CARD", label: label("Card", "کارت") },
      { value: "SHABA", label: label("SHABA", "شبا") },
    ]),
    textProperty("separator", "Separator", "جداکننده"),
  ]),
  "jb-national-input": configuration(inputCommon, "string", { ...inputDefaults, inputmode: "numeric" }, inputProperties),
  "jb-date-input": configuration(valueControlCommon, "string", { showPersianNumber: false }, [
    textProperty("message", "Helper message", "پیام راهنما", true),
    textProperty("inputType", "Input type", "نوع ورودی"),
    textProperty("valueType", "Value type", "نوع مقدار"),
    hiddenTextProperty("format", "Display format", "قالب نمایش"),
    textProperty("min", "Minimum date", "کمترین تاریخ"),
    textProperty("max", "Maximum date", "بیشترین تاریخ"),
    selectProperty("direction", "Calendar direction", "جهت تقویم", [
      { value: "ltr", label: label("Left to right", "چپ به راست") },
      { value: "rtl", label: label("Right to left", "راست به چپ") },
    ]),
    booleanProperty("showPersianNumber", "Show Persian digits", "نمایش ارقام فارسی"),
    textProperty("calendarDefaultView", "Calendar default view", "نمای پیش‌فرض تقویم"),
  ]),
  "jb-time-input": configuration(
    valueControlCommon,
    "string",
    {
      secondEnabled: false,
      frontalZero: true,
      optionalUnits: [],
      showPersianNumber: false,
    },
    [
      textProperty("message", "Helper message", "پیام راهنما", true),
      booleanProperty("secondEnabled", "Enable seconds", "فعال‌سازی ثانیه"),
      booleanProperty("frontalZero", "Leading zero", "صفر ابتدایی"),
      stringListProperty("optionalUnits", "Optional units", "واحدهای اختیاری"),
      booleanProperty("showPersianNumber", "Show Persian digits", "نمایش ارقام فارسی"),
      textProperty("closeButtonText", "Close button text", "متن دکمه بستن", true),
    ],
  ),
  "jb-pin-input": configuration(
    {
      ...valueControlCommon,
      placeholder: false,
    },
    "string",
    { charLength: 4, inputmode: "numeric", autofocus: false },
    [
      textProperty("message", "Helper message", "پیام راهنما", true),
      numberProperty("charLength", "Character count", "تعداد نویسه", {
        min: 1,
        max: 12,
        step: 1,
      }),
      selectProperty(
        "inputmode",
        "Input mode",
        "حالت ورودی",
        inputModeOptions.map(([value, en, fa]) => ({
          value,
          label: label(en, fa),
        })),
      ),
      booleanProperty("autofocus", "Autofocus", "فوکوس خودکار"),
    ],
  ),
  "jb-textarea": configuration(valueControlCommon, "string", { autoHeight: true }, [
    textProperty("message", "Helper message", "پیام راهنما", true),
    booleanProperty("autoHeight", "Automatic height", "ارتفاع خودکار"),
  ]),
  "jb-select": configuration(
    valueControlCommon,
    "select",
    {
      multiple: false,
      size: "md",
      popoverPosition: "fixed",
      hideClear: false,
      options: [
        {
          id: "option_1",
          value: "option_1",
          label: localizedDefault("Option 1", "گزینه ۱"),
          disabled: false,
        },
      ],
    },
    [
      textProperty("message", "Helper message", "پیام راهنما", true),
      textProperty("searchPlaceholder", "Search placeholder", "متن راهنمای جستجو", true),
      booleanProperty("multiple", "Multiple selection", "انتخاب چندگانه"),
      selectProperty("size", "Size", "اندازه", sizeOptions),
      selectProperty("popoverPosition", "Popover position", "جایگاه پنجره انتخاب", [
        { value: "fixed", label: label("Fixed", "ثابت") },
        { value: "absolute", label: label("Absolute", "مطلق") },
      ]),
      booleanProperty("hideClear", "Hide clear button", "پنهان‌کردن پاک‌کردن"),
      {
        key: "options",
        label: label("Options", "گزینه‌ها"),
        control: "options",
      },
    ],
  ),
  "jb-listbox": configuration(
    {
      ...valueControlCommon,
      placeholder: false,
    },
    "select",
    {
      multiple: false,
      useCheckbox: true,
      options: [
        {
          id: "option_1",
          value: "option_1",
          label: localizedDefault("Option 1", "گزینه ۱"),
          disabled: false,
        },
      ],
    },
    [
      textProperty("message", "Helper message", "پیام راهنما", true),
      booleanProperty("multiple", "Multiple selection", "انتخاب چندگانه"),
      booleanProperty("useCheckbox", "Use checkbox", "استفاده از چک‌باکس"),
      {
        key: "options",
        label: label("Options", "گزینه‌ها"),
        control: "options",
      },
    ],
  ),
  "jb-checkbox": configuration(booleanControlCommon, "boolean", { size: "md" }, [
    textProperty("message", "Helper message", "پیام راهنما", true),
    selectProperty("size", "Size", "اندازه", sizeOptions),
  ]),
  "jb-switch": configuration(
    {
      ...booleanControlCommon,
      label: false,
    },
    "boolean",
    { isLoading: false },
    [
      textProperty("trueTitle", "True title", "عنوان روشن", true),
      textProperty("falseTitle", "False title", "عنوان خاموش", true),
      booleanProperty("isLoading", "Loading", "در حال بارگذاری"),
    ],
  ),
  "jb-file-input": configuration(
    {
      ...valueControlCommon,
      disabled: true,
      initialValue: false,
      label: false,
      placeholder: false,
    },
    "string",
    { acceptTypes: [], placeholderTitle: localizedDefault("Choose a file", "انتخاب فایل") },
    [stringListProperty("acceptTypes", "Accepted file types", "نوع فایل‌های مجاز"), textProperty("placeholderTitle", "Placeholder title", "عنوان جای‌نگهدار", true)],
  ),
  "jb-image-input": configuration(
    {
      ...valueControlCommon,
      initialValue: false,
      placeholder: false,
    },
    "string",
    { multiple: false, acceptTypes: ["image/*"] },
    [
      textProperty("message", "Helper message", "پیام راهنما", true),
      booleanProperty("multiple", "Multiple images", "چند تصویر"),
      stringListProperty("acceptTypes", "Accepted image types", "نوع تصویرهای مجاز"),
      numberProperty("maxFileSize", "Maximum file size (MB)", "بیشترین اندازه فایل (مگابایت)", { min: 0, step: 0.1 }),
      hiddenTextProperty("uploadAdapter", "Upload adapter identifier", "شناسه رابط بارگذاری"),
    ],
  ),
  "jb-button": configuration(
    {
      required: false,
      disabled: true,
      initialValue: false,
      label: false,
      placeholder: false,
    },
    "string",
    {
      content: localizedDefault("Next", "ارسال"),
      type: "button",
      action: "next",
      color: "primary",
      variant: "solid",
      size: "md",
      isLoading: false,
      loadingText: localizedDefault("Please wait", "لطفاً صبر کنید"),
      square: false,
    },
    [
      textProperty("content", "Content", "متن دکمه", true),
      selectProperty("type", "Button type", "نوع دکمه", [
        { value: "button", label: label("Button", "دکمه") },
      ]),
      selectProperty("action", "Action", "عملکرد", [
        { value: "next", label: label("Next tab", "تب بعدی") },
        { value: "previous", label: label("Previous tab", "تب قبلی") },
        { value: "custom", label: label("Custom (handled by programmer)", "سفارشی (توسط برنامه‌نویس)") },
      ]),
      selectProperty("color", "Color", "رنگ", [
        { value: "primary", label: label("Primary", "اصلی") },
        { value: "secondary", label: label("Secondary", "ثانویه") },
        { value: "positive", label: label("Positive", "مثبت") },
        { value: "danger", label: label("Danger", "خطر") },
        { value: "warning", label: label("Warning", "هشدار") },
        { value: "light", label: label("Light", "روشن") },
        { value: "dark", label: label("Dark", "تیره") },
      ]),
      selectProperty("variant", "Variant", "گونه", [
        { value: "solid", label: label("Solid", "توپر") },
        { value: "outline", label: label("Outline", "خطی") },
        { value: "ghost", label: label("Ghost", "شفاف") },
        { value: "text", label: label("Text", "متنی") },
      ]),
      selectProperty("size", "Size", "اندازه", sizeOptions),
      booleanProperty("isLoading", "Loading", "در حال بارگذاری"),
      textProperty("loadingText", "Loading text", "متن بارگذاری", true),
      booleanProperty("square", "Square", "مربع"),
    ],
  ),
};
