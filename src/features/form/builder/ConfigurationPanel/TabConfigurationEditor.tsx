import { useTranslation } from "react-i18next";
import { observer } from "mobx-react-lite";
import { JBButton } from "jb-button/react";
import { JBCheckbox } from "jb-checkbox/react";
import { JBInput } from "jb-input/react";
import { JBOption } from "jb-select/option/react";
import { JBSelect } from "jb-select/react";
import { getLocalizedText, isTabElement } from "../../domain/form-document";
import { useBuilderStore } from "../store/BuilderStoreContext";
import { JBCollapse } from "jb-collapse/react";
import { inputValue } from "./configuration-values";
import styles from "./ConfigurationPanel.module.css";

export const TabConfigurationEditor = observer(function TabConfigurationEditor() {
  const { t } = useTranslation("tabConfigurationEditor");
  const { t: tShared } = useTranslation("containerConfiguration");
  const store = useBuilderStore();
  const locale = store.editingLocale;
  const defaultLocale = store.document.localization.defaultLocale;
  const element = store.selectedElement;
  if (!element || !isTabElement(element)) return null;

  return (
    <>
      <JBCollapse title={t("containerBehavior")}>
        <JBSelect<string>
          size="sm"
          popoverPosition="fixed"
          name="containerValidationScope"
          label={t("validateFields")}
          value={element.validationScope}
          clearable={false}
          onChange={event => store.updateSelectedContainerValidationScope(event.target.value === "active" ? "active" : "all")}
        >
          <JBOption value="all">{t("inEveryTabDefault")}</JBOption>
          <JBOption value="active">{t("onlyInTheActiveTab")}</JBOption>
        </JBSelect>
      </JBCollapse>
      <JBCollapse title={t("tabs")} defaultOpen>
        <div className={styles.tabEditor}>
          {element.tabs.map((tab, index) => {
            const valueIsDuplicate = element.tabs.some((candidate, candidateIndex) => candidateIndex !== index && candidate.value === tab.value);
            return (
              <section
                id={`tab-editor-${tab.id}`}
                className={styles.tabEditorRow}
                key={tab.id}
                tabIndex={-1}
                aria-label={`${t("tab")} ${index + 1}`}
              >
                <div className={styles.tabEditorHeading}>
                  <strong>{getLocalizedText(tab.label, locale, defaultLocale) || `${t("tab")} ${index + 1}`}</strong>
                  <div>
                    <JBButton square size="sm" variant="ghost" aria-label={t("moveTabLeft")} disabled={index === 0} onClick={() => store.moveTab(element.id, tab.id, -1)}>←</JBButton>
                    <JBButton square size="sm" variant="ghost" aria-label={t("moveTabRight")} disabled={index === element.tabs.length - 1} onClick={() => store.moveTab(element.id, tab.id, 1)}>→</JBButton>
                    <JBButton square size="sm" variant="ghost" aria-label={t("removeTab")} disabled={element.tabs.length === 1} onClick={() => store.removeTab(element.id, tab.id)}>×</JBButton>
                  </div>
                </div>
                <JBInput
                  size="sm"
                  name={`tab-label-${tab.id}`}
                  label={tShared("label")}
                  value={getLocalizedText(tab.label, locale, defaultLocale)}
                  onInput={event => store.updateTab(element.id, tab.id, { label: { translations: { ...tab.label.translations, [locale]: inputValue(event as unknown as Event) } } })}
                />
                <JBInput
                  size="sm"
                  name={`tab-value-${tab.id}`}
                  label={tShared("stableValue")}
                  value={tab.value}
                  error={valueIsDuplicate ? t("tabValuesMustBeUnique") : undefined}
                  onInput={event => store.updateTab(element.id, tab.id, { value: inputValue(event as unknown as Event) })}
                />
                <JBInput
                  size="sm"
                  name={`tab-color-${tab.id}`}
                  label={t("indicatorColorOrVariant")}
                  value={tab.color ?? ""}
                  placeholder="primary"
                  onInput={event => {
                    const value = inputValue(event as unknown as Event);
                    store.updateTab(element.id, tab.id, { color: value || undefined });
                  }}
                />
                <JBCheckbox
                  size="sm"
                  name={`tab-disabled-${tab.id}`}
                  label={tShared("disabled")}
                  value={tab.disabled}
                  onChange={event => store.updateTab(element.id, tab.id, { disabled: Boolean(event.target.value) })}
                />
                <small>{tShared("elementCount", { count: tab.children.length })}</small>
              </section>
            );
          })}
          <JBButton size="sm" variant="outline" onClick={() => store.addTab(element.id)}>
            {t("addTab")}
          </JBButton>
        </div>
      </JBCollapse>
    </>
  );
});
