import type { Dispatch, SetStateAction } from "react";
import { JBButton } from "jb-button/react";
import { JBInput } from "jb-input/react";
import { JBOption } from "jb-select/option/react";
import { JBSelect } from "jb-select/react";
import type { LocaleDefinition } from "../../domain/form-document";
import type { FormMessages } from "../../i18n/locale-adapter";
import styles from "./FormSettingsModal.module.css";

interface LocaleEditorProps {
  locales: Record<string, LocaleDefinition>;
  defaultLocale: string;
  newLocale: string;
  newLocaleDirection: LocaleDefinition["direction"];
  localeError: string;
  messages: FormMessages;
  setLocales: Dispatch<SetStateAction<Record<string, LocaleDefinition>>>;
  setNewLocale: Dispatch<SetStateAction<string>>;
  setNewLocaleDirection: Dispatch<SetStateAction<LocaleDefinition["direction"]>>;
  onAdd: () => void;
  onRemove: (locale: string) => void;
}

export function LocaleEditor(props: LocaleEditorProps) {
  const { locales, defaultLocale, newLocale, newLocaleDirection, localeError, messages, setLocales, setNewLocale, setNewLocaleDirection, onAdd, onRemove } = props;
  return (
    <div className={styles.localeEditor}>
      <p className={styles.settingsSectionTitle}>{messages.supportedLocales}</p>
      <div className={styles.localeList}>
        {Object.entries(locales).map(([locale, definition]) => (
          <div className={styles.localeRow} key={locale}>
            <strong>{locale}</strong>
            <JBSelect<LocaleDefinition["direction"]>
              name={`direction-${locale}`}
              label={messages.direction}
              value={definition.direction}
              onChange={event => setLocales(current => ({ ...current, [locale]: { direction: event.target.value === "rtl" ? "rtl" : "ltr" } }))}
            >
              <JBOption value="ltr">{messages.ltr}</JBOption>
              <JBOption value="rtl">{messages.rtl}</JBOption>
            </JBSelect>
            <JBButton variant="ghost" disabled={locale === defaultLocale || Object.keys(locales).length <= 1} onClick={() => onRemove(locale)}>
              {messages.removeLocale}
            </JBButton>
          </div>
        ))}
      </div>
      <div className={styles.addLocaleRow}>
        <JBInput
          name="newLocale"
          label={messages.addLocale}
          value={newLocale}
          message={localeError || messages.localeCodeHint}
          onInput={event => setNewLocale(String((event.target as unknown as { value?: unknown }).value ?? ""))}
        />
        <JBSelect<LocaleDefinition["direction"]>
          name="newLocaleDirection"
          label={messages.direction}
          value={newLocaleDirection}
          onChange={event => setNewLocaleDirection(event.target.value === "rtl" ? "rtl" : "ltr")}
        >
          <JBOption value="ltr">{messages.ltr}</JBOption>
          <JBOption value="rtl">{messages.rtl}</JBOption>
        </JBSelect>
        <JBButton variant="outline" onClick={onAdd}>
          {messages.addLocale}
        </JBButton>
      </div>
    </div>
  );
}
