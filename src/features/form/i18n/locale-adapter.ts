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
    english: "English",
    persian: "Persian",
    elementName: "Field name",
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
    confirmRemoveDescription: "This action cannot be undone in Phase 1. The field configuration will be removed from the current draft.",
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
    emptyDesigner: "Theme Designer comes in Phase 2",
    emptyDesignerDescription: "This route already preserves form identity and will become the theme workspace.",
    previewPending: "Preview renderer is the next route milestone",
    previewPendingDescription: "This page will reload saved JSON from IndexedDB and render it responsively.",
    previewReadyTitle: "Saved form preview",
    previewReadyDescription: "This form was reloaded independently from IndexedDB and rendered from its portable JSON.",
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
    productName: "فرم جی‌بی",
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
    english: "انگلیسی",
    persian: "فارسی",
    elementName: "نام فیلد",
    label: "برچسب",
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
    confirmRemoveDescription: "در فاز اول این کار قابل بازگشت نیست. تنظیمات فیلد از پیش‌نویس فعلی حذف می‌شود.",
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
    emptyDesigner: "طراح پوسته در فاز دوم اضافه می‌شود",
    emptyDesignerDescription: "این مسیر هویت فرم را حفظ می‌کند و فضای طراحی پوسته خواهد شد.",
    previewPending: "رندر پیش‌نمایش، مرحله بعدی مسیرها است",
    previewPendingDescription: "این صفحه JSON ذخیره‌شده را از IndexedDB می‌خواند و واکنش‌گرا نمایش می‌دهد.",
    previewReadyTitle: "پیش‌نمایش فرم ذخیره‌شده",
    previewReadyDescription: "این فرم به‌طور مستقل از IndexedDB خوانده و از JSON قابل‌انتقال آن رندر شده است.",
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
  i18n.setLocale(locale === "fa" ? new Intl.Locale("fa", { calendar: "persian", region: "IR" }) : new Intl.Locale("en", { calendar: "gregory", region: "US" }));

  return resolveFormMessages(formAppDictionary, i18n);
}

export function useFormLocale(initialLocale: FormAppLocale = "en") {
  const [locale, setLocale] = useState<FormAppLocale>(initialLocale);
  const [messages, setMessages] = useState<FormMessages>(formAppDictionary.dictionary[initialLocale]);

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
