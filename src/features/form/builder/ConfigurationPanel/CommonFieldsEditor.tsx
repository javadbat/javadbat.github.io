import { useTranslation } from "react-i18next";
import { observer } from "mobx-react-lite";
import type { ReactNode } from "react";
import { JBCheckbox } from "jb-checkbox/react";
import { JBInput } from "jb-input/react";
import { getLocalizedText } from "../../domain/form-document";
import type { FormElementRegistryEntry } from "../../component-data";
import { useBuilderStore } from "../store/BuilderStoreContext";
import { JBCollapse } from "jb-collapse/react";
import { inputValue } from "./configuration-values";
import { InitialValueEditor } from "./InitialValueEditor";
import styles from "./ConfigurationPanel.module.css";

interface CommonFieldsEditorProps {
  entry: FormElementRegistryEntry;
  children?: ReactNode;
}

export const CommonFieldsEditor = observer(function CommonFieldsEditor({ entry, children }: CommonFieldsEditorProps) {
  const { t } = useTranslation("configurationPanel");
  const store = useBuilderStore();
  const locale = store.editingLocale;
  const defaultLocale = store.document.localization.defaultLocale;
  const element = store.selectedElement;
  if (!element) return null;
  return (
    <>
      {entry.commonFields.label ? (
        <JBInput
          size="sm"
          name="elementLabel"
          label={t("label")}
          value={getLocalizedText(element.label, locale, defaultLocale)}
          onInput={event => store.updateSelectedText("label", inputValue(event as unknown as Event), locale)}
        />
      ) : null}
      {children}
      {entry.commonFields.placeholder ? (
        <JBInput
          size="sm"
          name="elementPlaceholder"
          label={t("placeholder")}
          value={getLocalizedText(element.placeholder, locale, defaultLocale)}
          onInput={event => store.updateSelectedText("placeholder", inputValue(event as unknown as Event), locale)}
        />
      ) : null}
    </>
  );
});

export const CommonBehaviorEditor = observer(function CommonBehaviorEditor({ entry }: CommonFieldsEditorProps) {
  const { t } = useTranslation("configurationPanel");
  const { t: tPropertyGuidance } = useTranslation("propertyGuidance");
  const store = useBuilderStore();
  const locale = store.editingLocale;
  const defaultLocale = store.document.localization.defaultLocale;
  const element = store.selectedElement;
  if (!element) return null;
  return (
    <JBCollapse title={t("behaviorSettings")} defaultOpen={false}>
      {entry.commonFields.initialValue ? (
        <InitialValueEditor
          entry={entry}
          element={element}
          label={t("initialValue")}
          message={tPropertyGuidance("initialValueHelp")}
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
              label={t("required")}
              value={element.required ?? false}
              onChange={event => store.updateSelectedElement({ required: Boolean(event.target.value) })}
            />
          ) : null}
          {entry.commonFields.disabled ? (
            <JBCheckbox
              size="sm"
              variant="filled-outline"
              name="elementDisabled"
              label={t("disabled")}
              value={element.disabled ?? false}
              onChange={event => store.updateSelectedElement({ disabled: Boolean(event.target.value) })}
            />
          ) : null}
        </div>
      ) : null}
    </JBCollapse>
  );
});
