import { useCallback, useEffect, useState } from "react";
import { i18n, JBDictionary, type JBI18N } from "jb-core/i18n";
import type { StorageIssue } from "../storage/storage-types";

export type FormAppLocale = "en" | "fa";
export type FormAppDirection = "ltr" | "rtl";

const formAppDictionarySource = {
  en: {
    productName: "JB Form",
    builder: "Builder",
    designer: "Designer",
    preview: "Preview",
    componentCatalog: "Components",
    catalogDescription: "Choose a field and add it to your form.",
    searchComponents: "Search components",
    formCanvas: "Form canvas",
    emptyFormTitle: "Your form is ready for its first field",
    emptyFormDescription: "Choose a component from the catalog. Fields stay in one clear column.",
    properties: "Properties",
    propertiesDescription: "Select a field to configure its shared settings.",
    noSelection: "Nothing selected",
    noSelectionDescription: "Select a field on the canvas to edit its name, label, and placeholder.",
    add: "Add",
    save: "Save",
    saveAs: "Save As",
    saving: "Saving…",
    saved: "Saved",
    saveFailed: "Save failed",
    storageBlocked: "Close other JB Form tabs and retry.",
    quotaExceeded: "Browser storage is full. Export the form or free space.",
    slugCollision: "Another saved form already uses this slug.",
    revisionConflict: "This form changed in another tab. Reload it before saving.",
    invalidForm: "Fix the form validation issues before saving.",
    corruptForm: "The saved form is corrupt or incompatible.",
    storageError: "The form could not be read or saved.",
    importJson: "Import JSON",
    importSuccess: "JSON imported into the draft. Save to persist it.",
    importFailure: "JSON import failed.",
    importDescription: "Paste a portable form document or choose a JSON file. The document is checked against the current form schema before import.",
    pasteJson: "Paste form JSON",
    pasteJsonPlaceholder: "Paste the exported form JSON here…",
    chooseJsonFile: "Choose JSON file",
    jsonSchemaValid: "Valid JSON — the document matches the form schema.",
    importDocument: "Import document",
    undo: "Undo",
    redo: "Redo",
    exportJson: "Export JSON",
    portableFormDocument: "Portable form document",
    exportDescription: "Review or copy the validated form JSON, then download the exact portable document.",
    exportCodeLabel: "Validated form JSON",
    copyCode: "Copy JSON",
    copiedCode: "JSON copied",
    downloadJson: "Download JSON",
    close: "Close",
    exportInvalidDescription: "This document cannot be exported until the following validation issues are fixed.",
    currentDraft: "Current draft",
    unsavedChanges: "Unsaved changes",
    untitledForm: "Untitled form",
    formSettings: "Form settings",
    formName: "Form name",
    slug: "Form slug",
    slugPreview: "Saved URL slug",
    slugOptional: "Optional. Leave empty to save only the current working draft.",
    slugInvalid: "Use an English route-safe slug.",
    linkedNamedForm: "Linked named form",
    unnamedDraft: "Not saved as a named form",
    settings: "Settings",
    cancel: "Cancel",
    locale: "Language",
    contentLocale: "Form content language",
    defaultLocale: "Default form language",
    supportedLocales: "Supported form languages",
    addLocale: "Add language",
    removeLocale: "Remove",
    direction: "Direction",
    ltr: "LTR",
    rtl: "RTL",
    localeCodeHint: "Use a BCP 47 code such as de or ar-EG.",
    localeInvalid: "Enter a valid BCP 47 language code.",
    localeAlreadyAdded: "That language is already supported.",
    english: "English",
    persian: "Persian",
    elementName: "Field name",
    elementNameDescription:"name of the field used in Data",
    label: "Label",
    placeholder: "Placeholder",
    required: "Required",
    disabled: "Disabled",
    initialValue: "Initial value",
    commonSettings: "Common settings",
    componentSettings: "Component settings",
    configure: "Configure",
    moveUp: "Move up",
    moveDown: "Move down",
    duplicate: "Duplicate",
    remove: "Remove",
    dragToReorder: "Drag to reorder",
    confirmRemoveTitle: "Remove this field?",
    confirmRemoveDescription: "The field configuration will be removed from the current draft. You can restore it with Undo.",
    confirmRemove: "Remove field",
    nameRequired: "Field name is required.",
    nameInvalid: "Start with a letter and use up to 64 letters, numbers, underscores, or hyphens.",
    addOption: "Add option",
    removeOption: "Remove option",
    optionLabel: "Option label",
    optionValue: "Option value",
    optionDisabled: "Option disabled",
    commaSeparated: "Separate multiple values with commas.",
    validationRules: "Validation rules",
    validationDescription: "Portable rules are stored as JSON. Regular expressions are compiled only by the trusted renderer.",
    ruleType: "Rule type",
    ruleValue: "Value",
    validationMessage: "Validation message",
    patternSource: "Pattern source",
    patternFlags: "Flags",
    allowedValues: "Allowed values",
    addRule: "Add rule",
    removeRule: "Remove rule",
    noValidationRules: "No custom validation rules.",
    addedAnnouncement: "added at position",
    movedAnnouncement: "moved to position",
    duplicatedAnnouncement: "duplicated at position",
    removedAnnouncement: "removed",
    of: "of",
    comingNext: "Persistence is added in the next implementation step.",
    desktopRequired: "Builder editing needs a larger screen",
    desktopRequiredDescription: "Use a viewport at least 64rem wide. Preview remains available on this device.",
    emptyDesigner: "Theme Designer comes in Phase 3",
    emptyDesignerDescription: "This route already preserves form identity and will become the theme workspace.",
    previewPending: "Preview renderer is the next route milestone",
    previewPendingDescription: "This page will reload saved JSON from IndexedDB and render it responsively.",
    previewReadyTitle: "Saved form preview",
    previewReadyDescription: "This form was reloaded independently from IndexedDB and rendered from its portable JSON.",
    submitForm: "Submit",
    resetForm: "Reset form",
    formPreparing: "Preparing the form…",
    validatingForm: "Checking the form…",
    validationReady: "Ready to submit.",
    formIsValid: "Everything looks good. The form is valid.",
    formHasErrors: "Some fields need your attention.",
    validationFailed: "Validation could not be completed.",
    backToForms: "All forms",
    createForm: "Create a form",
    continueDraft: "Continue current draft",
    savedForms: "Saved forms",
    noSavedForms: "No named forms have been saved yet.",
    loadingForms: "Loading saved forms…",
    storageUnavailable: "Browser storage is unavailable. You can still build in memory.",
    unknownForm: "This saved form could not be found.",
    noSavedDraft: "Save the current draft before opening this page.",
    loadForm: "Load",
    updated: "Updated",
    formHomeTitle: "Build forms with the JB Design System",
    formHomeDescription: "Compose accessible JB fields, configure portable JSON, and preview the exact saved result.",
    editorReady: "Core editing",
    phaseOne: "Phase 1",
    selected: "Selected",
    fields: "fields",
    field: "field",
    loading: "Loading builder",
    retry: "Retry",
  },
  fa: {
    productName: "فرم ساز",
    builder: "فرم‌ساز",
    designer: "طراح",
    preview: "پیش‌نمایش",
    componentCatalog: "اجزای فرم",
    catalogDescription: "یک فیلد را انتخاب و به فرم اضافه کنید.",
    searchComponents: "جستجوی اجزا",
    formCanvas: "بوم فرم",
    emptyFormTitle: "فرم شما برای اولین فیلد آماده است",
    emptyFormDescription: "یک جزء از فهرست انتخاب کنید. فیلدها در یک ستون قرار می‌گیرند.",
    properties: "ویژگی‌ها",
    propertiesDescription: "یک فیلد را برای تنظیم ویژگی‌های مشترک انتخاب کنید.",
    noSelection: "چیزی انتخاب نشده",
    noSelectionDescription: "یک فیلد را از بوم انتخاب کنید تا نام و برچسب آن را ویرایش کنید.",
    add: "افزودن",
    save: "ذخیره",
    saveAs: "ذخیره به‌عنوان",
    saving: "در حال ذخیره…",
    saved: "ذخیره‌شده",
    saveFailed: "ذخیره ناموفق بود",
    storageBlocked: "سایر زبانه‌های فرم جی‌بی را ببندید و دوباره تلاش کنید.",
    quotaExceeded: "فضای مرورگر پر است. از فرم خروجی بگیرید یا فضا آزاد کنید.",
    slugCollision: "فرم ذخیره‌شده دیگری از این شناسه نشانی استفاده می‌کند.",
    revisionConflict: "این فرم در زبانه دیگری تغییر کرده است. پیش از ذخیره آن را دوباره بارگذاری کنید.",
    invalidForm: "پیش از ذخیره، خطاهای اعتبارسنجی فرم را برطرف کنید.",
    corruptForm: "فرم ذخیره‌شده خراب یا ناسازگار است.",
    storageError: "فرم خوانده یا ذخیره نشد.",
    importJson: "ورود JSON",
    importSuccess: "JSON در پیش‌نویس وارد شد. برای ذخیره‌سازی، ذخیره را بزنید.",
    importFailure: "ورود JSON ناموفق بود.",
    importDescription: "JSON فرم را جای‌گذاری کنید یا یک فایل JSON انتخاب کنید. سند پیش از ورود با ساختار فعلی فرم بررسی می‌شود.",
    pasteJson: "جای‌گذاری JSON فرم",
    pasteJsonPlaceholder: "JSON خروجی فرم را اینجا جای‌گذاری کنید…",
    chooseJsonFile: "انتخاب فایل JSON",
    jsonSchemaValid: "JSON معتبر است و با ساختار فرم مطابقت دارد.",
    importDocument: "ورود سند",
    undo: "واگرد",
    redo: "بازانجام",
    exportJson: "خروجی JSON",
    portableFormDocument: "سند قابل‌انتقال فرم",
    exportDescription: "JSON اعتبارسنجی‌شده فرم را بررسی یا کپی کنید و سپس همان سند قابل‌انتقال را دانلود کنید.",
    exportCodeLabel: "JSON اعتبارسنجی‌شده فرم",
    copyCode: "کپی JSON",
    copiedCode: "JSON کپی شد",
    downloadJson: "دانلود JSON",
    close: "بستن",
    exportInvalidDescription: "تا زمانی که خطاهای اعتبارسنجی زیر برطرف نشوند، این سند قابل خروجی‌گرفتن نیست.",
    currentDraft: "پیش‌نویس فعلی",
    unsavedChanges: "تغییرات ذخیره‌نشده",
    untitledForm: "فرم بدون عنوان",
    formSettings: "تنظیمات فرم",
    formName: "نام فرم",
    slug: "شناسه نشانی فرم",
    slugPreview: "شناسه نشانی ذخیره‌شده",
    slugOptional: "اختیاری است. برای ذخیره فقط به‌عنوان پیش‌نویس فعلی، خالی بگذارید.",
    slugInvalid: "یک شناسه انگلیسی مناسب نشانی وارد کنید.",
    linkedNamedForm: "متصل به فرم نام‌دار",
    unnamedDraft: "به‌عنوان فرم نام‌دار ذخیره نشده",
    settings: "تنظیمات",
    cancel: "انصراف",
    locale: "زبان",
    contentLocale: "زبان محتوای فرم",
    defaultLocale: "زبان پیش‌فرض فرم",
    supportedLocales: "زبان‌های پشتیبانی‌شده فرم",
    addLocale: "افزودن زبان",
    removeLocale: "حذف",
    direction: "جهت",
    ltr: "چپ به راست",
    rtl: "راست به چپ",
    localeCodeHint: "کد BCP 47 مانند de یا ar-EG را وارد کنید.",
    localeInvalid: "یک کد زبان معتبر BCP 47 وارد کنید.",
    localeAlreadyAdded: "این زبان قبلاً اضافه شده است.",
    english: "انگلیسی",
    persian: "فارسی",
    elementName: "نام فیلد",
    elementNameDescription:"این نام در خروجی داده مورد استفاده قرار می‌ گیرد",
    label: "برچسب(لیبل)",
    placeholder: "متن راهنما",
    required: "الزامی",
    disabled: "غیرفعال",
    initialValue: "مقدار اولیه",
    commonSettings: "تنظیمات مشترک",
    componentSettings: "تنظیمات جزء",
    configure: "تنظیم",
    moveUp: "انتقال به بالا",
    moveDown: "انتقال به پایین",
    duplicate: "تکثیر",
    remove: "حذف",
    dragToReorder: "برای جابه‌جایی بکشید",
    confirmRemoveTitle: "این فیلد حذف شود؟",
    confirmRemoveDescription: "تنظیمات فیلد از پیش‌نویس فعلی حذف می‌شود. می‌توانید آن را با واگردانی برگردانید.",
    confirmRemove: "حذف فیلد",
    nameRequired: "نام فیلد الزامی است.",
    nameInvalid: "نام را با حرف آغاز کنید و حداکثر از ۶۴ حرف، عدد، خط زیر یا خط تیره استفاده کنید.",
    addOption: "افزودن گزینه",
    removeOption: "حذف گزینه",
    optionLabel: "برچسب گزینه",
    optionValue: "مقدار گزینه",
    optionDisabled: "گزینه غیرفعال",
    commaSeparated: "چند مقدار را با ویرگول جدا کنید.",
    validationRules: "قواعد اعتبارسنجی",
    validationDescription: "قواعد قابل‌انتقال به‌صورت JSON ذخیره می‌شوند. عبارت منظم فقط در رندرکننده امن کامپایل می‌شود.",
    ruleType: "نوع قاعده",
    ruleValue: "مقدار",
    validationMessage: "پیام اعتبارسنجی",
    patternSource: "الگوی عبارت منظم",
    patternFlags: "پرچم‌ها",
    allowedValues: "مقادیر مجاز",
    addRule: "افزودن قاعده",
    removeRule: "حذف قاعده",
    noValidationRules: "قاعده اعتبارسنجی سفارشی وجود ندارد.",
    addedAnnouncement: "در جایگاه افزوده شد",
    movedAnnouncement: "به جایگاه منتقل شد",
    duplicatedAnnouncement: "در جایگاه تکثیر شد",
    removedAnnouncement: "حذف شد",
    of: "از",
    comingNext: "ذخیره‌سازی در مرحله بعدی پیاده‌سازی اضافه می‌شود.",
    desktopRequired: "ویرایش فرم به نمایشگر بزرگ‌تر نیاز دارد",
    desktopRequiredDescription: "از عرض حداقل ۶۴rem استفاده کنید. پیش‌نمایش روی این دستگاه در دسترس است.",
    emptyDesigner: "طراح پوسته در فاز سوم اضافه می‌شود",
    emptyDesignerDescription: "این مسیر هویت فرم را حفظ می‌کند و فضای طراحی پوسته خواهد شد.",
    previewPending: "رندر پیش‌نمایش، مرحله بعدی مسیرها است",
    previewPendingDescription: "این صفحه JSON ذخیره‌شده را از IndexedDB می‌خواند و واکنش‌گرا نمایش می‌دهد.",
    previewReadyTitle: "پیش‌نمایش فرم ذخیره‌شده",
    previewReadyDescription: "این فرم به‌طور مستقل از IndexedDB خوانده و از JSON قابل‌انتقال آن رندر شده است.",
    submitForm: "ارسال",
    resetForm: "بازنشانی فرم",
    formPreparing: "در حال آماده‌سازی فرم…",
    validatingForm: "در حال بررسی فرم…",
    validationReady: "آماده ارسال است.",
    formIsValid: "همه‌چیز درست است. فرم معتبر است.",
    formHasErrors: "برخی فیلدها نیاز به بررسی دارند.",
    validationFailed: "اعتبارسنجی کامل نشد.",
    backToForms: "همه فرم‌ها",
    createForm: "ساخت فرم",
    continueDraft: "ادامه پیش‌نویس",
    savedForms: "فرم‌های ذخیره‌شده",
    noSavedForms: "هنوز فرم نام‌داری ذخیره نشده است.",
    loadingForms: "در حال بارگذاری فرم‌ها…",
    storageUnavailable: "فضای ذخیره مرورگر در دسترس نیست. همچنان می‌توانید در حافظه فرم بسازید.",
    unknownForm: "این فرم ذخیره‌شده پیدا نشد.",
    noSavedDraft: "پیش از بازکردن این صفحه، پیش‌نویس فعلی را ذخیره کنید.",
    loadForm: "بارگذاری",
    updated: "به‌روزرسانی",
    formHomeTitle: "فرم‌سازی با سیستم طراحی JB",
    formHomeDescription: "فیلدهای دسترس‌پذیر JB را بچینید، JSON را تنظیم کنید و نتیجه ذخیره‌شده را ببینید.",
    editorReady: "ویرایش فرم",
    phaseOne: "فاز اول",
    selected: "انتخاب‌شده",
    fields: "فیلد",
    field: "فیلد",
    loading: "در حال بارگذاری فرم‌ساز",
    retry: "تلاش دوباره",
  },
} as const;

export type FormMessageKey = keyof (typeof formAppDictionarySource)["en"];
export type FormMessages = Record<FormMessageKey, string>;
export const formAppMessages: Record<FormAppLocale, FormMessages> = formAppDictionarySource;

const formMessageKeys = Object.keys(formAppDictionarySource.en) as FormMessageKey[];

/**
 * The form application routes are client-only islands, so this adapter follows
 * the documented JB pattern and owns one long-lived dictionary instance.
 *
 * The framework-independent renderer has a separate lazy i18n boundary because
 * its module must remain safe to evaluate while preparing for future SSR.
 */
export const formAppDictionary = new JBDictionary<FormMessages>(formAppDictionarySource);

function resolveFormMessages(dictionary: JBDictionary<FormMessages>, i18n: JBI18N): FormMessages {
  return Object.fromEntries(formMessageKeys.map(key => [key, dictionary.get(i18n, key)])) as FormMessages;
}

export function getStorageIssueMessage(messages: FormMessages, issue: StorageIssue | null): string {
  if (!issue) {
    return messages.storageError;
  }
  switch (issue.code) {
    case "storage-blocked":
      return messages.storageBlocked;
    case "storage-unavailable":
      return messages.storageUnavailable;
    case "quota-exceeded":
      return messages.quotaExceeded;
    case "slug-collision":
      return messages.slugCollision;
    case "revision-conflict":
      return messages.revisionConflict;
    case "validation-failed":
      return messages.invalidForm;
    case "corrupt-record":
    case "incompatible-record":
      return messages.corruptForm;
    default:
      return messages.storageError;
  }
}

function localeDirection(locale: FormAppLocale): FormAppDirection {
  return locale === "fa" ? "rtl" : "ltr";
}

function configureJBI18n(locale: FormAppLocale): FormMessages {
  const direction = localeDirection(locale);

  document.documentElement.lang = locale;
  document.documentElement.dir = direction;
  // jb-core resolves the calendar, region, and numbering-system defaults.
  // Passing the locale string also ensures every locale-aware JB component,
  // including jb-range-input, receives the same canonical configuration.
  i18n.setLocale(locale);

  return resolveFormMessages(formAppDictionary, i18n);
}

export function useFormLocale(initialLocale: FormAppLocale = "en") {
  const [locale, setLocale] = useState<FormAppLocale>(initialLocale);
  const [messages, setMessages] = useState<FormMessages>(formAppMessages[initialLocale]);

  useEffect(() => {
    setMessages(configureJBI18n(locale));
  }, [locale]);

  const t = useCallback((key: FormMessageKey) => messages[key], [messages]);

  return {
    locale,
    direction: localeDirection(locale),
    setLocale,
    messages,
    t,
  };
}
