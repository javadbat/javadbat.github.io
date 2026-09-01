import { FormRouteMenu } from "./FormRouteMenu";
import { useFormLocale } from "../i18n/locale-adapter";

export const FORM_ROUTE_LOCALE_CHANGE_EVENT = "jb-form:locale-change";

/** Hydrated shared navigation used by the otherwise-static `/form` landing page. */
export function FormRouteMenuIsland() {
  const { locale, setLocale, messages } = useFormLocale("en");
  return (
    <FormRouteMenu
      currentPage="landing"
      messages={messages}
      language={locale}
      onLanguageChange={language => {
        if (language !== "en" && language !== "fa") return;
        setLocale(language);
        window.dispatchEvent(new CustomEvent(FORM_ROUTE_LOCALE_CHANGE_EVENT, { detail: { locale: language } }));
      }}
    />
  );
}
