# Form interface translations

`i18n.ts` creates the form application's i18next instance and defines its supported languages and English fallback. `resources.ts` registers dictionaries as separate namespaces. Dictionary files contain copy only.

Mount `FormI18nProvider` once at each React page root. It provides that instance through `I18nextProvider`, restores the saved preference, and subscribes once to `languageChanged` to update `jb-core/i18n`, HTML language/direction, and local storage. Components never repeat this synchronization.

Components import the standard React i18next hook:

```tsx
const { t } = useTranslation("builderHeader");
const { t: tCommon } = useTranslation("common");

return <button title={t("saved")}>{tCommon("save")}</button>;
```

Use the component namespace for its own copy and a shared namespace for reused copy. Do not flatten dictionaries, build message objects, or pass translation dictionaries or translators through component props. Pure formatting helpers can accept a namespace-specific `TFunction`.

The language selector calls `i18n.changeLanguage(language)`. Only components that need language or direction read `i18n` from `useTranslation`; ordinary copy consumers only use `t`. Use native interpolation, such as `t("designerControlHeightLabel", { size })`, with `{{size}}` in the dictionary.

The Astro landing page renders dictionary text statically, then uses the same `formI18n` instance and its `languageChanged` event for DOM updates. Its menu island mounts the page provider. It does not read browser preferences or configure JB separately.

Form content localization is document data: `document.localization`, the builder's editing locale, and the preview's selected content language. It is independent of interface language. Changing a form's content language does not change the editor's UI preference.
