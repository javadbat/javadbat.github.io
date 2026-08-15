import { i18n } from "jb-core/i18n";
import type { JBFormDocumentV1 } from "../../domain/form-document";
import type { FormIssue } from "../../domain/form-issue";

export interface ActiveFormLocale {
  locale: string;
  direction: "ltr" | "rtl";
}

export function resolveFormLocale(document: JBFormDocumentV1, override: string | null): ActiveFormLocale {
  const locale = override?.trim() || document.localization.defaultLocale;
  const direction = document.localization.locales[locale]?.direction ?? document.localization.locales[document.localization.defaultLocale]?.direction ?? "ltr";
  return { locale, direction };
}

export async function configureFormLocale(activeLocale: ActiveFormLocale, autoImport: boolean): Promise<FormIssue[]> {
  if (!autoImport) {
    // Manual dependency mode means manual i18n ownership as well. The renderer
    // still applies lang/dir to its host, but it does not import or mutate the
    // global jb-core i18n singleton.
    return [];
  }
  try {
    document.documentElement.lang = activeLocale.locale;
    document.documentElement.dir = activeLocale.direction;
    // jb-core@0.33 is safe to import outside the browser and owns locale
    // defaults, normalization, and subscriber notification.
    i18n.setLocale(activeLocale.locale);
    return [];
  } catch (error) {
    return [
      {
        source: "renderer",
        code: "locale_configuration_failed",
        path: "/localization",
        messageKey: "form.renderer.localeConfigurationFailed",
        message: error instanceof Error ? `The form locale could not be configured: ${error.message}` : "The form locale could not be configured.",
      },
    ];
  }
}
