import { useTranslation } from "react-i18next";
import type { Dispatch, SetStateAction } from "react";
import { JBButton } from "jb-button/react";
import { JBInput } from "jb-input/react";
import { JBOption } from "jb-select/option/react";
import { JBSelect } from "jb-select/react";
import type { LocaleDefinition } from "../../domain/form-document";
import styles from "./FormSettingsModal.module.css";

interface LocaleEditorProps {
  locales: Record<string, LocaleDefinition>;
  defaultLocale: string;
  newLocale: string;
  localeError: string;

  setLocales: Dispatch<SetStateAction<Record<string, LocaleDefinition>>>;
  setNewLocale: Dispatch<SetStateAction<string>>;
  onAdd: () => void;
  onRemove: (locale: string) => void;
}

export function LocaleEditor(props: LocaleEditorProps) {
  const { t } = useTranslation("formSettingsModal");
  const { locales, defaultLocale, newLocale, localeError, setLocales, setNewLocale, onAdd, onRemove } = props;
  return (
    <div className={styles.localeEditor}>
      <p className={styles.settingsSectionTitle}>{t("supportedLocales")}</p>
      <div className={styles.localeList}>
        {Object.entries(locales).map(([locale, definition]) => (
          <div className={styles.localeRow} key={locale}>
            <strong>{locale}</strong>
            <JBSelect<LocaleDefinition["direction"]>
              name={`direction-${locale}`}
              label={t("direction")}
              value={definition.direction}
              onChange={event => setLocales(current => ({ ...current, [locale]: { direction: event.target.value === "rtl" ? "rtl" : "ltr" } }))}
            >
              <JBOption value="ltr">{t("ltr")}</JBOption>
              <JBOption value="rtl">{t("rtl")}</JBOption>
            </JBSelect>
            <JBButton variant="ghost" disabled={locale === defaultLocale || Object.keys(locales).length <= 1} onClick={() => onRemove(locale)}>
              {t("removeLocale")}
            </JBButton>
          </div>
        ))}
      </div>
      <div className={styles.addLocaleRow}>
        <JBInput
          name="newLocale"
          label={t("addLocale")}
          value={newLocale}
          message={localeError || t("localeCodeHint")}
          onInput={event => setNewLocale(String((event.target as unknown as { value?: unknown }).value ?? ""))}
        />
        <JBButton variant="outline" onClick={onAdd}>
          {t("addLocale")}
        </JBButton>
      </div>
    </div>
  );
}
