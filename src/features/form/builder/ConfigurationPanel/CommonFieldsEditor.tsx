import { observer } from "mobx-react-lite";
import type { ReactNode } from "react";
import { JBCheckbox } from "jb-checkbox/react";
import { JBInput } from "jb-input/react";
import { getLocalizedText } from "../../domain/form-document";
import type { FormMessages } from "../../i18n/locale-adapter";
import type { FormElementRegistryEntry } from "jb-form-builder/registry/form-element-registry";
import { useBuilderStore } from "../store/BuilderStoreContext";
import { JBCollapse } from "jb-collapse/react";
import { inputValue } from "./configuration-values";
import { InitialValueEditor } from "./InitialValueEditor";
import styles from "./ConfigurationPanel.module.css";

interface CommonFieldsEditorProps {
  entry: FormElementRegistryEntry;
  locale: string;
  defaultLocale: string;
  messages: FormMessages;
  children?: ReactNode;
}

export const CommonFieldsEditor = observer(function CommonFieldsEditor({ entry, locale, defaultLocale, messages, children }: CommonFieldsEditorProps) {
  const store = useBuilderStore();
  const element = store.selectedElement;
  if (!element) return null;
  return (
    <>
      {entry.commonFields.label ? (
        <JBInput
          size="sm"
          name="elementLabel"
          label={messages.label}
          value={getLocalizedText(element.label, locale, defaultLocale)}
          onInput={event => store.updateSelectedText("label", inputValue(event as unknown as Event), locale)}
        />
      ) : null}
      {children}
      {entry.commonFields.placeholder ? (
        <JBInput
          size="sm"
          name="elementPlaceholder"
          label={messages.placeholder}
          value={getLocalizedText(element.placeholder, locale, defaultLocale)}
          onInput={event => store.updateSelectedText("placeholder", inputValue(event as unknown as Event), locale)}
        />
      ) : null}
    </>
  );
});

export const CommonBehaviorEditor = observer(function CommonBehaviorEditor({ entry, locale, defaultLocale, messages }: CommonFieldsEditorProps) {
  const store = useBuilderStore();
  const element = store.selectedElement;
  if (!element) return null;
  return (
    <JBCollapse title={messages.behaviorSettings} defaultOpen={false}>
      {entry.commonFields.initialValue ? (
        <InitialValueEditor
          entry={entry}
          element={element}
          label={messages.initialValue}
          message={messages.initialValueHelp}
          locale={locale}
          defaultLocale={defaultLocale}
          onValueChange={value => store.updateSelectedElement({ initialValue: value as typeof element.initialValue })}
        />
      ) : null}
      {entry.commonFields.required || entry.commonFields.disabled ? (
        <div className={styles.checkboxGroup}>
          {entry.commonFields.required ? (
            <JBCheckbox
              size="sm"
              variant="filled-outline"
              name="elementRequired"
              label={messages.required}
              value={element.required ?? false}
              onChange={event => store.updateSelectedElement({ required: Boolean(event.target.value) })}
            />
          ) : null}
          {entry.commonFields.disabled ? (
            <JBCheckbox
              size="sm"
              variant="filled-outline"
              name="elementDisabled"
              label={messages.disabled}
              value={element.disabled ?? false}
              onChange={event => store.updateSelectedElement({ disabled: Boolean(event.target.value) })}
            />
          ) : null}
        </div>
      ) : null}
    </JBCollapse>
  );
});
