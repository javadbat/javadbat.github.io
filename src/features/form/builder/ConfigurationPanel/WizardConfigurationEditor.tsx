import { useTranslation } from "react-i18next";
import { observer } from "mobx-react-lite";
import { JBButton } from "jb-button/react";
import { JBInput } from "jb-input/react";
import { getLocalizedText, isWizardElement } from "../../domain/form-document";
import { useBuilderStore } from "../store/BuilderStoreContext";
import { JBCollapse } from "jb-collapse/react";
import { inputValue } from "./configuration-values";
import styles from "./ConfigurationPanel.module.css";

export const WizardConfigurationEditor = observer(function WizardConfigurationEditor() {
  const { t } = useTranslation("wizardConfigurationEditor");
  const { t: tShared } = useTranslation("containerConfiguration");
  const store = useBuilderStore();
  const locale = store.editingLocale;
  const defaultLocale = store.document.localization.defaultLocale;
  const element = store.selectedElement;
  if (!element || !isWizardElement(element)) return null;

  return (
    <JBCollapse title={t("steps")} defaultOpen>
      <div className={styles.tabEditor}>
        {element.steps.map((step, index) => {
          const duplicateValue = element.steps.some((candidate, candidateIndex) => candidateIndex !== index && candidate.value === step.value);
          return (
            <section id={`wizard-step-editor-${step.id}`} className={styles.tabEditorRow} key={step.id} tabIndex={-1} aria-label={`${t("step")} ${index + 1}`}>
              <div className={styles.tabEditorHeading}>
                <strong>{getLocalizedText(step.label, locale, defaultLocale) || `${t("step")} ${index + 1}`}</strong>
                <div>
                  <JBButton square size="sm" variant="ghost" aria-label={t("moveStepEarlier")} disabled={index === 0} onClick={() => store.moveWizardStep(element.id, step.id, -1)}>←</JBButton>
                  <JBButton square size="sm" variant="ghost" aria-label={t("moveStepLater")} disabled={index === element.steps.length - 1} onClick={() => store.moveWizardStep(element.id, step.id, 1)}>→</JBButton>
                  <JBButton square size="sm" variant="ghost" aria-label={t("removeStep")} disabled={element.steps.length === 1} onClick={() => store.removeWizardStep(element.id, step.id)}>×</JBButton>
                </div>
              </div>
              <JBInput
                size="sm"
                name={`wizard-step-label-${step.id}`}
                label={tShared("label")}
                value={getLocalizedText(step.label, locale, defaultLocale)}
                onInput={event => store.updateWizardStep(element.id, step.id, { label: { translations: { ...step.label.translations, [locale]: inputValue(event as unknown as Event) } } })}
              />
              <JBInput
                size="sm"
                name={`wizard-step-value-${step.id}`}
                label={tShared("stableValue")}
                value={step.value}
                error={duplicateValue ? t("stepValuesMustBeUnique") : undefined}
                onInput={event => store.updateWizardStep(element.id, step.id, { value: inputValue(event as unknown as Event) })}
              />
              <small>{tShared("elementCount", { count: step.children.length })}</small>
            </section>
          );
        })}
        <JBButton size="sm" variant="outline" onClick={() => store.addWizardStep(element.id)}>
          {t("addStep")}
        </JBButton>
      </div>
    </JBCollapse>
  );
});
