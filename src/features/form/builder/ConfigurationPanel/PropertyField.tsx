import { observer } from "mobx-react-lite";
import { JBCheckbox } from "jb-checkbox/react";
import { JBInput } from "jb-input/react";
import { JBOption } from "jb-select/option/react";
import { JBSelect } from "jb-select/react";
import { JBTextarea } from "jb-textarea/react";
import type { FormMessages } from "../../i18n/locale-adapter";
import type { FormElementPropertyDefinition } from "../../registry/form-element-configuration";
import { useBuilderStore } from "../store/BuilderStoreContext";
import { inputValue, localizedPropertyValue, propertyLabel } from "./configuration-values";
import { SelectOptionsEditor } from "./SelectOptionsEditor";

interface PropertyFieldProps {
  definition: FormElementPropertyDefinition;
  locale: string;
  defaultLocale: string;
  messages: FormMessages;
}

export const PropertyField = observer(function PropertyField({ definition, locale, defaultLocale, messages }: PropertyFieldProps) {
  const store = useBuilderStore();
  const element = store.selectedElement;
  if (!element) {
    return null;
  }

  const value = element.props[definition.key];
  const label = propertyLabel(definition.label, locale);

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
    return <SelectOptionsEditor locale={locale} defaultLocale={defaultLocale} messages={messages} label={label} />;
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
        hideClear
        onChange={event => store.updateSelectedProp(definition.key, event.target.value)}
      >
        {definition.options?.map(option => (
          <JBOption key={option.value} value={option.value}>
            {propertyLabel(option.label, locale)}
          </JBOption>
        ))}
      </JBSelect>
    );
  }

  const displayedValue =
    definition.control === "string-list"
      ? Array.isArray(value)
        ? value.filter(item => typeof item === "string").join(", ")
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
      type={definition.control === "number" ? "number" : definition.control === "url" ? "url" : "text"}
      value={displayedValue}
      message={definition.control === "string-list" ? messages.commaSeparated : undefined}
      onInput={event => {
        const nextValue = inputValue(event as unknown as Event);
        if (definition.localized) {
          store.updateSelectedLocalizedProp(definition.key, nextValue, locale);
        } else if (definition.control === "number") {
          store.updateSelectedProp(definition.key, nextValue === "" ? undefined : Number(nextValue));
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
