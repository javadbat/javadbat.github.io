import { FormRouteMenu } from "./FormRouteMenu";
import { FormI18nProvider } from "../i18n/FormI18nProvider";

/** The landing page owns one locale boundary, shared by its React menu and Astro content. */
export function FormRouteMenuIsland() {
  return <FormI18nProvider><FormRouteMenu currentPage="landing" /></FormI18nProvider>;
}
