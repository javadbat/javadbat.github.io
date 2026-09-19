import { useTranslation } from "react-i18next";
import { observer } from "mobx-react-lite";
import layoutStyles from "../../layout/FormRouteLayout.module.css";
import { getFormElementDisplayName } from "../../component-data";
import { componentDataByType } from "../../component-data";
import { useBuilderStore } from "../store/BuilderStoreContext";
import { CatalogIcon } from "../CatalogIcon/CatalogIcon";
import { JBCollapse } from "jb-collapse/react";
import { ValidationRulesEditor } from "../ValidationRulesEditor/ValidationRulesEditor";
import { CommonBehaviorEditor, CommonFieldsEditor } from "./CommonFieldsEditor";
import { DataFieldsEditor } from "./DataFieldsEditor";
import { PropertyField } from "./PropertyField";
import { TabConfigurationEditor } from "./TabConfigurationEditor";
import { ConditionConfigurationEditor } from "./ConditionConfigurationEditor";
import { WizardConfigurationEditor } from "./WizardConfigurationEditor";
import { isConditionElement, isContainerElement, isTabElement, isWizardElement } from "../../domain/form-document";
import styles from "./ConfigurationPanel.module.css";
import { useMediaQuery } from "usehooks-ts";
interface ConfigurationPanelProps {

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
  "clearable",
  "autoHeight",
  "optionalUnits",
  "maxSize",
  "maxFileSize",
  "separator",
]);

const removedPropertyKeys = new Set(["valueType", "disableBalloonRotation", "autofocus", "leadingZero", "closeButtonText"]);

export const ConfigurationPanel = observer(function ConfigurationPanel({ }: ConfigurationPanelProps) {
  const { t: tCommon } = useTranslation("common");
  const { t, i18n } = useTranslation("configurationPanel");
  const { t: tPropertyGuidance } = useTranslation("propertyGuidance");
  const store = useBuilderStore();
  const element = store.selectedElement;
  const locale = i18n.resolvedLanguage ?? i18n.language;
  const defaultLocale = store.document.localization.defaultLocale;
  const entry = element ? componentDataByType.get(element.type) : undefined;
  const visibleProperties = entry?.propertyDefinitions.filter(definition => !removedPropertyKeys.has(definition.key) && definition.builderVisible !== false) ?? [];
  const advancedProperties = visibleProperties.filter(definition => advancedPropertyKeys.has(definition.key));
  const contentProperties = visibleProperties.filter(definition => definition.localized && !advancedPropertyKeys.has(definition.key));
  const standardProperties = visibleProperties.filter(definition => !definition.localized && !advancedPropertyKeys.has(definition.key));
  const hasCommonContent = Boolean(entry && (entry.commonFields.label || entry.commonFields.placeholder));
  const hasCommonBehavior = Boolean(entry && (entry.commonFields.initialValue || entry.commonFields.required || entry.commonFields.disabled));
  const isMobile = useMediaQuery("(max-width: 63.999rem)");
  return (
    <aside className={`${layoutStyles.panel} ${styles.configuration}`} data-builder-panel="properties" aria-labelledby="properties-title">
      <div className={styles.panelHeading}>
        <div>
          <p className={styles.eyebrow}>
            {!isMobile && t("settings")}
          </p>
          <h2 id="properties-title">
            {isMobile &&
            element ? (entry ? getFormElementDisplayName(entry, locale) : element.type) : ""
            }
            {!isMobile && tCommon("properties")}
          </h2>
        </div>
        {entry ? (
          <span className={styles.iconTile}>
            <CatalogIcon iconId={entry.iconId} />
          </span>
        ) : null}
      </div>
      {!isMobile && (
        <p className={styles.panelDescription}>
          {element ? (entry ? getFormElementDisplayName(entry, locale) : element.type) : t("propertiesDescription")}
        </p>
      )}
      {!element || !entry ? (
        <div className={styles.noSelection}>
          <span className={styles.selectionRing} />
          <h3>{t("noSelection")}</h3>
          <p>{t("noSelectionDescription")}</p>
        </div>
      ) : (
        <div className={styles.configurationFields}>
          {hasCommonContent || contentProperties.length > 0 ? (
            <JBCollapse title={t("contentSettings")} defaultOpen>
              <CommonFieldsEditor entry={entry}>
                {contentProperties.map(definition => (
                  <PropertyField key={definition.key} definition={definition} />
                ))}
              </CommonFieldsEditor>
            </JBCollapse>
          ) : null}
          {isTabElement(element) ? <TabConfigurationEditor /> : null}
          {isConditionElement(element) ? <ConditionConfigurationEditor /> : null}
          {isWizardElement(element) ? <WizardConfigurationEditor /> : null}
          {standardProperties.length > 0 ? (
            <JBCollapse title={t("componentSettings")} defaultOpen>
              {standardProperties.map(definition => (
                <PropertyField key={definition.key} definition={definition} />
              ))}
            </JBCollapse>
          ) : null}
          {hasCommonBehavior ? <CommonBehaviorEditor entry={entry} /> : null}
          {!isContainerElement(element) ? <ValidationRulesEditor supportedRules={entry.validationRules} /> : null}
          {advancedProperties.length > 0 ? (
            <JBCollapse title={tPropertyGuidance("advancedSettings")} defaultOpen={false}>
              {advancedProperties.map(definition => (
                <PropertyField key={definition.key} definition={definition} />
              ))}
            </JBCollapse>
          ) : null}
          <DataFieldsEditor />
        </div>
      )}
    </aside>
  );
});
