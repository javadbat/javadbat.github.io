import { useTranslation } from "react-i18next";
import { observer } from "mobx-react-lite";
import { JBCheckbox } from "jb-checkbox/react";
import { JBColorInput } from "jb-color-input/react";
import { JBInput } from "jb-input/react";
import { JBNumberInput } from "jb-number-input/react";
import { JBOption } from "jb-select/option/react";
import { JBSelect } from "jb-select/react";
import { JBTextarea } from "jb-textarea/react";
import type { FormElementPropertyDefinition } from "../../component-data";
import { useBuilderStore } from "../store/BuilderStoreContext";
import { inputValue, localizedPropertyValue, propertyLabel } from "./configuration-values";
import { getPropertyGuidance, getPropertyPlaceholder } from "./property-guidance";
import { SelectOptionsEditor } from "./SelectOptionsEditor";

interface PropertyFieldProps {
  definition: FormElementPropertyDefinition;
}

const BYTES_PER_MEGABYTE = 1024 * 1024;

export const PropertyField = observer(function PropertyField({ definition }: PropertyFieldProps) {
  const { t: tCommon } = useTranslation("common");
  const { t: tPropertyGuidance, i18n } = useTranslation("propertyGuidance");
  const store = useBuilderStore();
  const interfaceLocale = i18n.resolvedLanguage ?? i18n.language;
  const locale = store.editingLocale;
  const defaultLocale = store.document.localization.defaultLocale;
  const element = store.selectedElement;
  if (!element) {
    return null;
  }

  const value = element.props[definition.key];
  const label = propertyLabel(definition.label, interfaceLocale);
  const guidance = getPropertyGuidance(definition, tPropertyGuidance, tCommon);
  const placeholder = getPropertyPlaceholder(definition, interfaceLocale);

  if (definition.control === "textarea") {
    const displayedValue = definition.localized
      ? localizedPropertyValue(value, locale, defaultLocale)
      : typeof value === "string"
        ? value
        : "";
    return (
      <JBTextarea
        autoHeight
        name={`prop-${definition.key}`}
        label={label}
        message={guidance}
        value={displayedValue}
        onInput={event => {
          const nextValue = inputValue(event as unknown as Event);
          if (definition.localized) {
            store.updateSelectedLocalizedProp(definition.key, nextValue, locale);
          } else {
            store.updateSelectedProp(definition.key, nextValue === "" ? undefined : nextValue);
          }
        }}
      />
    );
  }

  if (definition.control === "options") {
    return <SelectOptionsEditor label={label} />;
  }

  if (definition.control === "boolean") {
    return (
      <JBCheckbox
        size="sm"
        name={`prop-${definition.key}`}
        label={label}
        value={value === true}
        onChange={event => store.updateSelectedProp(definition.key, Boolean(event.target.value))}
      />
    );
  }

  if (definition.control === "select") {
    return (
      <JBSelect<string>
        size="sm"
        popoverPosition="fixed"
        name={`prop-${definition.key}`}
        label={label}
        value={typeof value === "string" ? value : ""}
        clearable={false}
        onChange={event => store.updateSelectedProp(definition.key, event.target.value)}
      >
        {definition.options?.map(option => (
          <JBOption key={option.value} value={option.value}>
            {propertyLabel(option.label, interfaceLocale)}
          </JBOption>
        ))}
      </JBSelect>
    );
  }

  if (definition.control === "color") {
    return (
      <JBColorInput
        size="sm"
        name={`prop-${definition.key}`}
        label={label}
        value={typeof value === "string" ? value : ""}
        onInput={event => {
          const nextValue = inputValue(event as unknown as Event);
          store.updateSelectedProp(definition.key, nextValue === "" ? undefined : nextValue);
        }}
      />
    );
  }

  if (definition.control === "number") {
    const adaptToInput = definition.valueAdapter?.toInput ?? ((number: number) => number);
    const adaptFromInput = definition.valueAdapter?.fromInput ?? ((number: number) => number);
    const displayedValue = typeof value === "number"
      ? definition.key === "maxFileSize"
        ? value / BYTES_PER_MEGABYTE
        : adaptToInput(value)
      : "";

    return (
      <JBNumberInput
        size="sm"
        name={`prop-${definition.key}`}
        label={label}
        value={displayedValue}
        message={guidance}
        placeholder={placeholder}
        minValue={definition.min === undefined ? undefined : adaptToInput(definition.min)}
        maxValue={definition.max === undefined ? undefined : adaptToInput(definition.max)}
        step={definition.step === undefined ? undefined : adaptToInput(definition.step)}
        acceptNegative={definition.min === undefined || definition.min < 0}
        onInput={event => {
          const nextValue = inputValue(event as unknown as Event);
          store.updateSelectedProp(
            definition.key,
            nextValue === ""
              ? undefined
              : definition.key === "maxFileSize"
                ? Number(nextValue) * BYTES_PER_MEGABYTE
                : adaptFromInput(Number(nextValue)),
          );
        }}
      />
    );
  }

  const displayedValue =
    definition.control === "string-list"
      ? Array.isArray(value)
        ? value.filter(item => typeof item === "string").join(", ")
        : typeof value === "string"
          ? value
        : ""
      : definition.localized
        ? localizedPropertyValue(value, locale, defaultLocale)
        : typeof value === "string" || typeof value === "number"
          ? String(value)
          : "";

  return (
    <JBInput
      size="sm"
      name={`prop-${definition.key}`}
      label={label}
      type={definition.control === "url" ? "url" : "text"}
      value={displayedValue}
      message={guidance}
      placeholder={placeholder}
      onInput={event => {
        const nextValue = inputValue(event as unknown as Event);
        if (definition.localized) {
          store.updateSelectedLocalizedProp(definition.key, nextValue, locale);
        } else if (definition.control === "string-list") {
          store.updateSelectedProp(
            definition.key,
            nextValue
              .split(",")
              .map(item => item.trim())
              .filter(Boolean),
          );
        } else {
          store.updateSelectedProp(definition.key, nextValue === "" ? undefined : nextValue);
        }
      }}
    />
  );
});
