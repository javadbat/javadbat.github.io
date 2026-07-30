import { observer } from "mobx-react-lite";
import { JBButton } from "jb-button/react";
import { JBCheckbox } from "jb-checkbox/react";
import { JBInput } from "jb-input/react";
import { JBOption, JBSelect } from "jb-select/react";
import { getLocalizedText, type JSONValue, type LocalizedText } from "../domain/form-document";
import type { FormMessages } from "../i18n/locale-adapter";
import type { FormElementPropertyDefinition, PropertyLabel } from "../registry/form-element-configuration";
import { registryByType } from "../registry/form-element-registry";
import { useBuilderStore } from "./BuilderStoreContext";
import { CatalogIcon } from "./CatalogIcon";
import { CollapsibleConfigurationSection } from "./CollapsibleConfigurationSection";
import { ValidationRulesEditor } from "./ValidationRulesEditor";
import styles from "./BuilderApp.module.css";

interface ConfigurationPanelProps {
  messages: FormMessages;
}

interface PortableSelectOption {
  id: string;
  value: string;
  label: LocalizedText;
  disabled: boolean;
}

function inputValue(event: Event): string {
  return String((event.target as unknown as { value?: unknown }).value ?? "");
}

function propertyLabel(value: PropertyLabel, locale: string): string {
  return locale === "fa" ? value.fa : value.en;
}

function isLocalizedText(value: JSONValue | undefined): value is JSONValue & {
  translations: Record<string, JSONValue>;
} {
  return (
    typeof value === "object" &&
    value !== null &&
    !Array.isArray(value) &&
    typeof value.translations === "object" &&
    value.translations !== null &&
    !Array.isArray(value.translations)
  );
}

function localizedPropertyValue(value: JSONValue | undefined, locale: string): string {
  if (!isLocalizedText(value)) {
    return typeof value === "string" ? value : "";
  }

  const translated = value.translations[locale] ?? value.translations.en ?? Object.values(value.translations)[0];
  return typeof translated === "string" ? translated : "";
}

function asSelectOptions(value: JSONValue | undefined): PortableSelectOption[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.flatMap(candidate => {
    if (typeof candidate !== "object" || candidate === null || Array.isArray(candidate)) {
      return [];
    }

    const translations =
      typeof candidate.label === "object" &&
      candidate.label !== null &&
      !Array.isArray(candidate.label) &&
      typeof candidate.label.translations === "object" &&
      candidate.label.translations !== null &&
      !Array.isArray(candidate.label.translations)
        ? candidate.label.translations
        : {};

    return [
      {
        id: typeof candidate.id === "string" ? candidate.id : crypto.randomUUID(),
        value: typeof candidate.value === "string" ? candidate.value : "",
        label: {
          translations: Object.fromEntries(Object.entries(translations).flatMap(([key, translation]) => (typeof translation === "string" ? [[key, translation]] : []))),
        },
        disabled: candidate.disabled === true,
      },
    ];
  });
}

interface SelectOptionsEditorProps {
  locale: string;
  messages: FormMessages;
  label: string;
}

const SelectOptionsEditor = observer(function SelectOptionsEditor({ locale, messages, label }: SelectOptionsEditorProps) {
  const store = useBuilderStore();
  const options = asSelectOptions(store.selectedElement?.props.options);

  const commit = (nextOptions: PortableSelectOption[]) => {
    store.updateSelectedProp("options", nextOptions as unknown as JSONValue);
  };

  const updateOption = (index: number, patch: Partial<PortableSelectOption>) => {
    const nextOptions = options.map((option, optionIndex) => (optionIndex === index ? { ...option, ...patch } : option));
    commit(nextOptions);
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
        label: {
          translations: {
            [locale]: `Option ${position}`,
          },
        },
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
            name={`optionLabel-${option.id}`}
            label={messages.optionLabel}
            value={getLocalizedText(option.label, locale)}
            onInput={event => updateOptionLabel(index, inputValue(event as unknown as Event))}
          />
          <JBInput
            name={`optionValue-${option.id}`}
            label={messages.optionValue}
            value={option.value}
            onInput={event =>
              updateOption(index, {
                value: inputValue(event as unknown as Event),
              })
            }
          />
          <JBCheckbox
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

interface PropertyFieldProps {
  definition: FormElementPropertyDefinition;
  locale: string;
  messages: FormMessages;
}

const PropertyField = observer(function PropertyField({ definition, locale, messages }: PropertyFieldProps) {
  const store = useBuilderStore();
  const element = store.selectedElement;
  if (!element) {
    return null;
  }

  const value = element.props[definition.key];
  const label = propertyLabel(definition.label, locale);

  if (definition.control === "options") {
    return <SelectOptionsEditor locale={locale} messages={messages} label={label} />;
  }

  if (definition.control === "boolean") {
    return (
      <JBCheckbox name={`prop-${definition.key}`} label={label} value={value === true} onChange={event => store.updateSelectedProp(definition.key, Boolean(event.target.value))} />
    );
  }

  if (definition.control === "select") {
    return (
      <JBSelect<string>
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
        ? localizedPropertyValue(value, locale)
        : typeof value === "string" || typeof value === "number"
          ? String(value)
          : "";

  return (
    <JBInput
      name={`prop-${definition.key}`}
      label={label}
      type={definition.control === "number" ? "number" : "text"}
      value={displayedValue}
      message={definition.control === "string-list" ? messages.commaSeparated : undefined}
      onInput={event => {
        const nextValue = inputValue(event as unknown as Event);
        if (definition.localized) {
          store.updateSelectedLocalizedProp(definition.key, nextValue, locale);
          return;
        }
        if (definition.control === "number") {
          store.updateSelectedProp(definition.key, nextValue === "" ? undefined : Number(nextValue));
          return;
        }
        if (definition.control === "string-list") {
          store.updateSelectedProp(
            definition.key,
            nextValue
              .split(",")
              .map(item => item.trim())
              .filter(Boolean),
          );
          return;
        }
        store.updateSelectedProp(definition.key, nextValue === "" ? undefined : nextValue);
      }}
    />
  );
});

export const ConfigurationPanel = observer(function ConfigurationPanel({ messages }: ConfigurationPanelProps) {
  const store = useBuilderStore();
  const element = store.selectedElement;
  const locale = store.document.localization.defaultLocale;
  const entry = element ? registryByType.get(element.type) : undefined;
  const nameError = element ? store.getElementNameError(element.id) : null;

  return (
    <aside className={styles.configuration} aria-labelledby="properties-title">
      <div className={styles.panelHeading}>
        <div>
          <p className={styles.eyebrow}>{messages.settings}</p>
          <h2 id="properties-title">{messages.properties}</h2>
        </div>
        {entry ? (
          <span className={styles.iconTile}>
            <CatalogIcon iconId={entry.iconId} />
          </span>
        ) : null}
      </div>
      <p className={styles.panelDescription}>{element ? `${entry?.displayName ?? element.type} · ${element.name}` : messages.propertiesDescription}</p>

      {!element || !entry ? (
        <div className={styles.noSelection}>
          <span className={styles.selectionRing} />
          <h3>{messages.noSelection}</h3>
          <p>{messages.noSelectionDescription}</p>
        </div>
      ) : (
        <div className={styles.configurationFields}>
          <CollapsibleConfigurationSection title={messages.commonSettings}>
            <div className={styles.fieldWithError}>
              <JBInput
                id={`element-name-${element.id}`}
                name="elementName"
                label={messages.elementName}
                value={element.name}
                error={nameError === "required" ? messages.nameRequired : nameError === "invalid" ? messages.nameInvalid : undefined}
                aria-invalid={nameError !== null}
                aria-describedby={nameError ? `element-name-error-${element.id}` : undefined}
                onInput={event =>
                  store.updateSelectedElement({
                    name: inputValue(event as unknown as Event),
                  })
                }
              />
              {nameError ? (
                <p id={`element-name-error-${element.id}`} className={styles.fieldError} role="alert">
                  {nameError === "required" ? messages.nameRequired : messages.nameInvalid}
                </p>
              ) : null}
            </div>
            {entry.commonFields.label ? (
              <JBInput
                name="elementLabel"
                label={messages.label}
                value={getLocalizedText(element.label, locale)}
                onInput={event => store.updateSelectedText("label", inputValue(event as unknown as Event), locale)}
              />
            ) : null}
            {entry.commonFields.placeholder ? (
              <JBInput
                name="elementPlaceholder"
                label={messages.placeholder}
                value={getLocalizedText(element.placeholder, locale)}
                onInput={event => store.updateSelectedText("placeholder", inputValue(event as unknown as Event), locale)}
              />
            ) : null}
            {entry.commonFields.initialValue ? (
              entry.initialValueKind === "boolean" ? (
                <JBSelect<string>
                  name="elementInitialValue"
                  label={messages.initialValue}
                  value={typeof element.initialValue === "boolean" ? String(element.initialValue) : "unset"}
                  hideClear
                  onChange={event =>
                    store.updateSelectedElement({
                      initialValue: event.target.value === "unset" ? undefined : event.target.value === "true",
                    })
                  }
                >
                  <JBOption value="unset">—</JBOption>
                  <JBOption value="true">True</JBOption>
                  <JBOption value="false">False</JBOption>
                </JBSelect>
              ) : (
                <JBInput
                  name="elementInitialValue"
                  label={messages.initialValue}
                  value={typeof element.initialValue === "string" || typeof element.initialValue === "number" ? String(element.initialValue) : ""}
                  onInput={event => {
                    const value = inputValue(event as unknown as Event);
                    store.updateSelectedElement({
                      initialValue: value === "" ? undefined : value,
                    });
                  }}
                />
              )
            ) : null}
            {entry.commonFields.required || entry.commonFields.disabled ? (
              <div className={styles.checkboxGroup}>
                {entry.commonFields.required ? (
                  <JBCheckbox
                    name="elementRequired"
                    label={messages.required}
                    value={element.required ?? false}
                    onChange={event =>
                      store.updateSelectedElement({
                        required: Boolean(event.target.value),
                      })
                    }
                  />
                ) : null}
                {entry.commonFields.disabled ? (
                  <JBCheckbox
                    name="elementDisabled"
                    label={messages.disabled}
                    value={element.disabled ?? false}
                    onChange={event =>
                      store.updateSelectedElement({
                        disabled: Boolean(event.target.value),
                      })
                    }
                  />
                ) : null}
              </div>
            ) : null}
          </CollapsibleConfigurationSection>

          {entry.propertyDefinitions.length > 0 ? (
            <CollapsibleConfigurationSection title={messages.componentSettings}>
              {entry.propertyDefinitions.map(definition => (
                <PropertyField key={definition.key} definition={definition} locale={locale} messages={messages} />
              ))}
            </CollapsibleConfigurationSection>
          ) : null}
          <ValidationRulesEditor locale={locale} messages={messages} supportedRules={entry.validationRules} />
        </div>
      )}
    </aside>
  );
});
