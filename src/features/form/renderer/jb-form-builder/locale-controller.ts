import type { JBFormDocumentV1 } from "../../domain/form-document";
import type { FormIssue } from "../../domain/form-issue";

export interface ActiveFormLocale {
  locale: string;
  direction: "ltr" | "rtl";
}

let i18nModulePromise: Promise<typeof import("jb-core/i18n")> | undefined;

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
    // jb-core/i18n currently touches document during module initialization.
    // Keeping this import inside the client render path makes the surrounding
    // renderer architecture straightforward to make fully SSR-safe later.
    document.documentElement.lang = activeLocale.locale;
    document.documentElement.dir = activeLocale.direction;
    i18nModulePromise ??= import("jb-core/i18n");
    const { i18n } = await i18nModulePromise;
    i18n.setLocale(new Intl.Locale(activeLocale.locale));
    return [];
  } catch (error) {
    i18nModulePromise = undefined;
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
