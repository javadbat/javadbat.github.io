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

interface TabConfigurationEditorProps {
  locale: string;
  defaultLocale: string;
}

const copy = (locale: string, en: string, fa: string) => locale.toLowerCase().startsWith("fa") ? fa : en;

export const TabConfigurationEditor = observer(function TabConfigurationEditor({ locale, defaultLocale }: TabConfigurationEditorProps) {
  const store = useBuilderStore();
  const element = store.selectedElement;
  if (!element || !isTabElement(element)) return null;

  return (
    <>
      <JBCollapse title={copy(locale, "Container behavior", "رفتار ظرف")}>
        <JBSelect<string>
          size="sm"
          popoverPosition="fixed"
          name="containerValidationScope"
          label={copy(locale, "Validate fields", "اعتبارسنجی فیلدها")}
          value={element.validationScope}
          hideClear
          onChange={event => store.updateSelectedContainerValidationScope(event.target.value === "active" ? "active" : "all")}
        >
          <JBOption value="all">{copy(locale, "In every tab (default)", "در همه تب‌ها (پیش‌فرض)")}</JBOption>
          <JBOption value="active">{copy(locale, "Only in the active tab", "فقط در تب فعال")}</JBOption>
        </JBSelect>
      </JBCollapse>
      <JBCollapse title={copy(locale, "Tabs", "تب‌ها")} defaultOpen>
        <div className={styles.tabEditor}>
          {element.tabs.map((tab, index) => {
            const valueIsDuplicate = element.tabs.some((candidate, candidateIndex) => candidateIndex !== index && candidate.value === tab.value);
            return (
              <section
                id={`tab-editor-${tab.id}`}
                className={styles.tabEditorRow}
                key={tab.id}
                tabIndex={-1}
                aria-label={`${copy(locale, "Tab", "تب")} ${index + 1}`}
              >
                <div className={styles.tabEditorHeading}>
                  <strong>{getLocalizedText(tab.label, locale, defaultLocale) || `${copy(locale, "Tab", "تب")} ${index + 1}`}</strong>
                  <div>
                    <JBButton square size="sm" variant="ghost" aria-label={copy(locale, "Move tab left", "انتقال تب به قبل")} disabled={index === 0} onClick={() => store.moveTab(element.id, tab.id, -1)}>←</JBButton>
                    <JBButton square size="sm" variant="ghost" aria-label={copy(locale, "Move tab right", "انتقال تب به بعد")} disabled={index === element.tabs.length - 1} onClick={() => store.moveTab(element.id, tab.id, 1)}>→</JBButton>
                    <JBButton square size="sm" variant="ghost" aria-label={copy(locale, "Remove tab", "حذف تب")} disabled={element.tabs.length === 1} onClick={() => store.removeTab(element.id, tab.id)}>×</JBButton>
                  </div>
                </div>
                <JBInput
                  size="sm"
                  name={`tab-label-${tab.id}`}
                  label={copy(locale, "Label", "عنوان")}
                  value={getLocalizedText(tab.label, locale, defaultLocale)}
                  onInput={event => store.updateTab(element.id, tab.id, { label: { translations: { ...tab.label.translations, [locale]: inputValue(event as unknown as Event) } } })}
                />
                <JBInput
                  size="sm"
                  name={`tab-value-${tab.id}`}
                  label={copy(locale, "Stable value", "مقدار ثابت")}
                  value={tab.value}
                  error={valueIsDuplicate ? copy(locale, "Tab values must be unique", "مقدار تب‌ها باید یکتا باشد") : undefined}
                  onInput={event => store.updateTab(element.id, tab.id, { value: inputValue(event as unknown as Event) })}
                />
                <JBInput
                  size="sm"
                  name={`tab-color-${tab.id}`}
                  label={copy(locale, "Indicator color or variant", "رنگ یا گونه نشانگر")}
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
                  label={copy(locale, "Disabled", "غیرفعال")}
                  value={tab.disabled}
                  onChange={event => store.updateTab(element.id, tab.id, { disabled: Boolean(event.target.value) })}
                />
                <small>{tab.children.length} {copy(locale, tab.children.length === 1 ? "element" : "elements", "المان")}</small>
              </section>
            );
          })}
          <JBButton size="sm" variant="outline" onClick={() => store.addTab(element.id)}>
            {copy(locale, "Add tab", "افزودن تب")}
          </JBButton>
        </div>
      </JBCollapse>
    </>
  );
});
