import { observer } from "mobx-react-lite";
import type { FormMessages } from "../../i18n/locale-adapter";
import { getFormElementDisplayName, registryByType } from "../../registry/form-element-registry";
import { useBuilderStore } from "../store/BuilderStoreContext";
import { CatalogIcon } from "../CatalogIcon/CatalogIcon";
import { CollapsibleConfigurationSection } from "../CollapsibleConfigurationSection/CollapsibleConfigurationSection";
import { ValidationRulesEditor } from "../ValidationRulesEditor/ValidationRulesEditor";
import { CommonFieldsEditor } from "./CommonFieldsEditor";
import { PropertyField } from "./PropertyField";
import styles from "./ConfigurationPanel.module.css";

interface ConfigurationPanelProps {
  messages: FormMessages;
}

export const ConfigurationPanel = observer(function ConfigurationPanel({ messages }: ConfigurationPanelProps) {
  const store = useBuilderStore();
  const element = store.selectedElement;
  const locale = store.editingLocale;
  const defaultLocale = store.document.localization.defaultLocale;
  const entry = element ? registryByType.get(element.type) : undefined;
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
          {entry.propertyDefinitions.length > 0 ? (
            <CollapsibleConfigurationSection title={messages.componentSettings}>
              {entry.propertyDefinitions.map(definition => (
                <PropertyField key={definition.key} definition={definition} locale={locale} defaultLocale={defaultLocale} messages={messages} />
              ))}
            </CollapsibleConfigurationSection>
          ) : null}
          <ValidationRulesEditor locale={locale} messages={messages} supportedRules={entry.validationRules} />
        </div>
      )}
    </aside>
  );
});
