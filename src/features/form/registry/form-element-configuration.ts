import type { JBFormElementType, JSONValue } from "../domain/form-document";

export type PropertyControl = "text" | "number" | "boolean" | "select" | "string-list" | "options";

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

export type InitialValueKind = "string" | "boolean" | "select" | "range";

export interface FormElementConfiguration {
  commonFields: CommonFieldSupport;
  initialValueKind: InitialValueKind;
  defaultProps: Record<string, JSONValue>;
  propertyDefinitions: readonly FormElementPropertyDefinition[];
}

const label = (en: string, fa: string): PropertyLabel => ({ en, fa });

const textProperty = (key: string, en: string, fa: string, localized = false): FormElementPropertyDefinition => ({
  key,
  label: label(en, fa),
  control: "text",
  localized,
});

const numberProperty = (key: string, en: string, fa: string, options: Pick<FormElementPropertyDefinition, "min" | "max" | "step"> = {}): FormElementPropertyDefinition => ({
  key,
  label: label(en, fa),
  control: "number",
  ...options,
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
  textProperty("message", "Helper message", "پیام راهنما", true),
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
    textProperty("format", "Display format", "قالب نمایش"),
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
          label: { translations: { en: "Option 1" } },
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
          label: { translations: { en: "Option 1" } },
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
    { acceptTypes: [], placeholderTitle: { translations: { en: "Choose a file" } } },
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
      numberProperty("maxFileSize", "Maximum file size (bytes)", "بیشترین اندازه فایل (بایت)", { min: 0, step: 1 }),
      textProperty("uploadAdapter", "Upload adapter identifier", "شناسه رابط بارگذاری"),
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
      content: { translations: { en: "Submit" } },
      type: "submit",
      color: "primary",
      variant: "solid",
      size: "md",
      isLoading: false,
      loadingText: { translations: { en: "Please wait" } },
      square: false,
    },
    [
      textProperty("content", "Content", "متن دکمه", true),
      selectProperty("type", "Button type", "نوع دکمه", [
        { value: "button", label: label("Button", "دکمه") },
        { value: "submit", label: label("Submit", "ارسال") },
        { value: "reset", label: label("Reset", "بازنشانی") },
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
