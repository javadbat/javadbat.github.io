import { observer } from "mobx-react-lite";
import { JBButton } from "jb-button/react";
import { JBInput } from "jb-input/react";
import { getLocalizedText, isWizardElement } from "../../domain/form-document";
import { useBuilderStore } from "../store/BuilderStoreContext";
import { JBCollapse } from "jb-collapse/react";
import { inputValue } from "./configuration-values";
import styles from "./ConfigurationPanel.module.css";

interface WizardConfigurationEditorProps {
  locale: string;
  defaultLocale: string;
}

const copy = (locale: string, en: string, fa: string) => locale.toLowerCase().startsWith("fa") ? fa : en;

export const WizardConfigurationEditor = observer(function WizardConfigurationEditor({ locale, defaultLocale }: WizardConfigurationEditorProps) {
  const store = useBuilderStore();
  const element = store.selectedElement;
  if (!element || !isWizardElement(element)) return null;

  return (
    <JBCollapse title={copy(locale, "Steps", "مراحل")} defaultOpen>
      <div className={styles.tabEditor}>
        {element.steps.map((step, index) => {
          const duplicateValue = element.steps.some((candidate, candidateIndex) => candidateIndex !== index && candidate.value === step.value);
          return (
            <section id={`wizard-step-editor-${step.id}`} className={styles.tabEditorRow} key={step.id} tabIndex={-1} aria-label={`${copy(locale, "Step", "مرحله")} ${index + 1}`}>
              <div className={styles.tabEditorHeading}>
                <strong>{getLocalizedText(step.label, locale, defaultLocale) || `${copy(locale, "Step", "مرحله")} ${index + 1}`}</strong>
                <div>
                  <JBButton square size="sm" variant="ghost" aria-label={copy(locale, "Move step earlier", "انتقال مرحله به قبل")} disabled={index === 0} onClick={() => store.moveWizardStep(element.id, step.id, -1)}>←</JBButton>
                  <JBButton square size="sm" variant="ghost" aria-label={copy(locale, "Move step later", "انتقال مرحله به بعد")} disabled={index === element.steps.length - 1} onClick={() => store.moveWizardStep(element.id, step.id, 1)}>→</JBButton>
                  <JBButton square size="sm" variant="ghost" aria-label={copy(locale, "Remove step", "حذف مرحله")} disabled={element.steps.length === 1} onClick={() => store.removeWizardStep(element.id, step.id)}>×</JBButton>
                </div>
              </div>
              <JBInput
                size="sm"
                name={`wizard-step-label-${step.id}`}
                label={copy(locale, "Label", "عنوان")}
                value={getLocalizedText(step.label, locale, defaultLocale)}
                onInput={event => store.updateWizardStep(element.id, step.id, { label: { translations: { ...step.label.translations, [locale]: inputValue(event as unknown as Event) } } })}
              />
              <JBInput
                size="sm"
                name={`wizard-step-value-${step.id}`}
                label={copy(locale, "Stable value", "مقدار ثابت")}
                value={step.value}
                error={duplicateValue ? copy(locale, "Step values must be unique", "مقدار مراحل باید یکتا باشد") : undefined}
                onInput={event => store.updateWizardStep(element.id, step.id, { value: inputValue(event as unknown as Event) })}
              />
              <small>{step.children.length} {copy(locale, step.children.length === 1 ? "element" : "elements", "المان")}</small>
            </section>
          );
        })}
        <JBButton size="sm" variant="outline" onClick={() => store.addWizardStep(element.id)}>
          {copy(locale, "Add step", "افزودن مرحله")}
        </JBButton>
      </div>
    </JBCollapse>
  );
});
