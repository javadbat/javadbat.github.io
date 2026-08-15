import { observer } from "mobx-react-lite";
import { JBButton } from "jb-button/react";
import { JBCheckbox } from "jb-checkbox/react";
import { JBInput } from "jb-input/react";
import { getLocalizedText, type JSONValue } from "../../domain/form-document";
import type { FormMessages } from "../../i18n/locale-adapter";
import { useBuilderStore } from "../store/BuilderStoreContext";
import { asSelectOptions, inputValue, type PortableSelectOption } from "./configuration-values";
import styles from "./ConfigurationPanel.module.css";

interface SelectOptionsEditorProps {
  locale: string;
  defaultLocale: string;
  messages: FormMessages;
  label: string;
}

export const SelectOptionsEditor = observer(function SelectOptionsEditor({ locale, defaultLocale, messages, label }: SelectOptionsEditorProps) {
  const store = useBuilderStore();
  const options = asSelectOptions(store.selectedElement?.props.options);

  const commit = (nextOptions: PortableSelectOption[]) => {
    store.updateSelectedProp("options", nextOptions as unknown as JSONValue);
  };

  const updateOption = (index: number, patch: Partial<PortableSelectOption>) => {
    commit(options.map((option, optionIndex) => (optionIndex === index ? { ...option, ...patch } : option)));
  };

  const updateOptionLabel = (index: number, value: string) => {
    const option = options[index];
    if (!option) {
      return;
    }
    updateOption(index, {
      label: {
        translations: {
          ...option.label.translations,
          [locale]: value,
        },
      },
    });
  };

  const addOption = () => {
    const position = options.length + 1;
    commit([
      ...options,
      {
        id: crypto.randomUUID(),
        value: `option_${position}`,
        label: { translations: { [locale]: `Option ${position}` } },
        disabled: false,
      },
    ]);
  };

  return (
    <div className={styles.optionEditor}>
      <div className={styles.optionEditorHeader}>
        <strong>{label}</strong>
        <JBButton size="sm" variant="outline" onClick={addOption}>
          {messages.addOption}
        </JBButton>
      </div>
      {options.map((option, index) => (
        <div className={styles.optionRow} key={option.id}>
          <JBInput
            size="sm"
            name={`optionLabel-${option.id}`}
            label={messages.optionLabel}
            value={getLocalizedText(option.label, locale, defaultLocale)}
            onInput={event => updateOptionLabel(index, inputValue(event as unknown as Event))}
          />
          <JBInput
            size="sm"
            name={`optionValue-${option.id}`}
            label={messages.optionValue}
            value={option.value}
            onInput={event => updateOption(index, { value: inputValue(event as unknown as Event) })}
          />
          <JBCheckbox
            size="sm"
            name={`optionDisabled-${option.id}`}
            label={messages.optionDisabled}
            value={option.disabled}
            onChange={event => updateOption(index, { disabled: Boolean(event.target.value) })}
          />
          <JBButton size="sm" variant="ghost" onClick={() => commit(options.filter((_, optionIndex) => optionIndex !== index))}>
            {messages.removeOption}
          </JBButton>
        </div>
      ))}
    </div>
  );
});
