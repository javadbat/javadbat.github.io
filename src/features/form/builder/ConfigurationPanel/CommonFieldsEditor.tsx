import { observer } from "mobx-react-lite";
import { useRef } from "react";
import { JBCheckbox } from "jb-checkbox/react";
import { JBInput } from "jb-input/react";
import { JBOption } from "jb-select/option/react";
import { JBSelect } from "jb-select/react";
import { getLocalizedText } from "../../domain/form-document";
import type { FormMessages } from "../../i18n/locale-adapter";
import type { FormElementRegistryEntry } from "../../registry/form-element-registry";
import { useBuilderStore } from "../store/BuilderStoreContext";
import { CollapsibleConfigurationSection } from "../CollapsibleConfigurationSection/CollapsibleConfigurationSection";
import { inputValue } from "./configuration-values";
import styles from "./ConfigurationPanel.module.css";

interface CommonFieldsEditorProps {
  entry: FormElementRegistryEntry;
  locale: string;
  defaultLocale: string;
  messages: FormMessages;
}

export const CommonFieldsEditor = observer(function CommonFieldsEditor({ entry, locale, defaultLocale, messages }: CommonFieldsEditorProps) {
  const store = useBuilderStore();
  const element = store.selectedElement;
  const lastNonEmptyName = useRef<{ elementId: string; value: string } | null>(null);
  if (!element) return null;
  const nameError = store.getElementNameError(element.id);
  if (lastNonEmptyName.current?.elementId !== element.id) {
    lastNonEmptyName.current = { elementId: element.id, value: element.name };
  } else if (element.name !== "") {
    lastNonEmptyName.current.value = element.name;
  }
  return (
    <CollapsibleConfigurationSection title={messages.commonSettings}>
      <JBInput
        size="sm"
        id={`element-name-${element.id}`}
        name="elementName"
        label={messages.elementName}
        value={element.name}
        error={nameError === "required" ? messages.nameRequired : nameError === "invalid" ? messages.nameInvalid : undefined}
        aria-invalid={nameError !== null}
        onInput={event => store.updateSelectedElement({ name: inputValue(event as unknown as Event) })}
        onBlur={event => {
          if (inputValue(event as unknown as Event) === "" && lastNonEmptyName.current) {
            store.updateSelectedElement({ name: lastNonEmptyName.current.value });
          }
        }}
        message={messages.elementNameDescription}
      />
      {entry.commonFields.label ? (
        <JBInput
          size="sm"
          name="elementLabel"
          label={messages.label}
          value={getLocalizedText(element.label, locale, defaultLocale)}
          onInput={event => store.updateSelectedText("label", inputValue(event as unknown as Event), locale)}
        />
      ) : null}
      {entry.commonFields.placeholder ? (
        <JBInput
          size="sm"
          name="elementPlaceholder"
          label={messages.placeholder}
          value={getLocalizedText(element.placeholder, locale, defaultLocale)}
          onInput={event => store.updateSelectedText("placeholder", inputValue(event as unknown as Event), locale)}
        />
      ) : null}
      {entry.commonFields.initialValue ? (
        entry.initialValueKind === "boolean" ? (
          <JBSelect<string>
            size="sm"
            popoverPosition="fixed"
            name="elementInitialValue"
            label={messages.initialValue}
            message={messages.initialValueHelp}
            value={typeof element.initialValue === "boolean" ? String(element.initialValue) : "unset"}
            hideClear
            onChange={event => store.updateSelectedElement({ initialValue: event.target.value === "unset" ? undefined : event.target.value === "true" })}
          >
            <JBOption value="unset">—</JBOption>
            <JBOption value="true">True</JBOption>
            <JBOption value="false">False</JBOption>
          </JBSelect>
        ) : (
          <JBInput
            size="sm"
            name="elementInitialValue"
            label={messages.initialValue}
            message={messages.initialValueHelp}
            value={
              Array.isArray(element.initialValue)
                ? element.initialValue.join(", ")
                : typeof element.initialValue === "string" || typeof element.initialValue === "number"
                  ? String(element.initialValue)
                  : ""
            }
            onInput={event => {
              const value = inputValue(event as unknown as Event);
              store.updateSelectedElement({
                initialValue:
                  value === "" ? undefined : entry.initialValueKind === "range" ? (value.includes(",") ? value.split(",").map(part => Number(part.trim())) : Number(value)) : value,
              });
            }}
          />
        )
      ) : null}
      {entry.commonFields.required || entry.commonFields.disabled ? (
        <div className={styles.checkboxGroup}>
          {entry.commonFields.required ? (
            <JBCheckbox
              size="sm"
              name="elementRequired"
              label={messages.required}
              value={element.required ?? false}
              onChange={event => store.updateSelectedElement({ required: Boolean(event.target.value) })}
            />
          ) : null}
          {entry.commonFields.disabled ? (
            <JBCheckbox
              size="sm"
              name="elementDisabled"
              label={messages.disabled}
              value={element.disabled ?? false}
              onChange={event => store.updateSelectedElement({ disabled: Boolean(event.target.value) })}
            />
          ) : null}
        </div>
      ) : null}
    </CollapsibleConfigurationSection>
  );
});
