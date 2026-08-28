import { observer } from "mobx-react-lite";
import type { FormMessages } from "../../i18n/locale-adapter";
import { getFormElementDisplayName, registryByType } from "jb-form-builder/registry/form-element-registry";
import { useBuilderStore } from "../store/BuilderStoreContext";
import { CatalogIcon } from "../CatalogIcon/CatalogIcon";
import { CollapsibleConfigurationSection } from "../CollapsibleConfigurationSection/CollapsibleConfigurationSection";
import { ValidationRulesEditor } from "../ValidationRulesEditor/ValidationRulesEditor";
import { CommonFieldsEditor } from "./CommonFieldsEditor";
import { PropertyField } from "./PropertyField";
import { TabConfigurationEditor } from "./TabConfigurationEditor";
import { ConditionConfigurationEditor } from "./ConditionConfigurationEditor";
import { WizardConfigurationEditor } from "./WizardConfigurationEditor";
import { isConditionElement, isContainerElement, isTabElement, isWizardElement } from "../../domain/form-document";
import styles from "./ConfigurationPanel.module.css";

interface ConfigurationPanelProps {
  messages: FormMessages;
}

const advancedPropertyKeys = new Set([
  "autocomplete",
  "inputmode",
  "calendarDefaultView",
  "showPersianNumber",
  "showControlButton",
  "tickStep",
  "minorTickStep",
  "popoverPosition",
  "hideClear",
  "autoHeight",
  "optionalUnits",
  "maxFileSize",
  "separator",
]);

const removedPropertyKeys = new Set([
  "valueType",
  "disableBalloonRotation",
  "autofocus",
  "frontalZero",
  "closeButtonText",
]);

export const ConfigurationPanel = observer(function ConfigurationPanel({ messages }: ConfigurationPanelProps) {
  const store = useBuilderStore();
  const element = store.selectedElement;
  const locale = store.editingLocale;
  const defaultLocale = store.document.localization.defaultLocale;
  const entry = element ? registryByType.get(element.type) : undefined;
  const visibleProperties = entry?.propertyDefinitions.filter(definition => !removedPropertyKeys.has(definition.key) && definition.builderVisible !== false) ?? [];
  const advancedProperties = visibleProperties.filter(definition => advancedPropertyKeys.has(definition.key));
  const standardProperties = visibleProperties.filter(definition => !advancedPropertyKeys.has(definition.key));
  return (
    <aside className={styles.configuration} data-builder-panel="properties" aria-labelledby="properties-title">
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
      <p className={styles.panelDescription}>{element ? `${entry ? getFormElementDisplayName(entry, locale) : element.type} · ${element.name}` : messages.propertiesDescription}</p>
      {!element || !entry ? (
        <div className={styles.noSelection}>
          <span className={styles.selectionRing} />
          <h3>{messages.noSelection}</h3>
          <p>{messages.noSelectionDescription}</p>
        </div>
      ) : (
        <div className={styles.configurationFields}>
          <CommonFieldsEditor entry={entry} locale={locale} defaultLocale={defaultLocale} messages={messages} />
          {isTabElement(element) ? <TabConfigurationEditor locale={locale} defaultLocale={defaultLocale} /> : null}
          {isConditionElement(element) ? <ConditionConfigurationEditor /> : null}
          {isWizardElement(element) ? <WizardConfigurationEditor locale={locale} defaultLocale={defaultLocale} /> : null}
          {standardProperties.length > 0 ? (
            <CollapsibleConfigurationSection title={messages.componentSettings}>
              {standardProperties.map(definition => (
                <PropertyField key={definition.key} definition={definition} locale={locale} defaultLocale={defaultLocale} messages={messages} />
              ))}
            </CollapsibleConfigurationSection>
          ) : null}
          {advancedProperties.length > 0 ? (
            <CollapsibleConfigurationSection title={messages.advancedSettings} defaultOpen={false}>
              {advancedProperties.map(definition => (
                <PropertyField key={definition.key} definition={definition} locale={locale} defaultLocale={defaultLocale} messages={messages} />
              ))}
            </CollapsibleConfigurationSection>
          ) : null}
          {!isContainerElement(element) ? <ValidationRulesEditor locale={locale} messages={messages} supportedRules={entry.validationRules} /> : null}
        </div>
      )}
    </aside>
  );
});
