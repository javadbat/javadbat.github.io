import { lazy, Suspense, useState } from "react";
import { observer } from "mobx-react-lite";
import { JBButton } from "jb-button/react";
import type { JBValidationRule } from "../../domain/form-document";
import type { FormMessages } from "../../i18n/locale-adapter";
import type { ValidationRuleName } from "../../registry/validation-rule-registry";
import { ModalLoadingFallback } from "../../shell/ModalLoadingFallback";
import { useBuilderStore } from "../store/BuilderStoreContext";
import { CollapsibleConfigurationSection } from "../CollapsibleConfigurationSection/CollapsibleConfigurationSection";
import { ruleLabel } from "./validation-rule-label";
import styles from "./ValidationRulesEditor.module.css";

const ValidationRulesModal = lazy(() => import("./ValidationRulesModal").then(module => ({ default: module.ValidationRulesModal })));

interface ValidationRulesEditorProps {
  locale: string;
  messages: FormMessages;
  supportedRules: readonly ValidationRuleName[];
}

function ruleSummary(rule: JBValidationRule): string {
  switch (rule.rule) {
    case "pattern":
      return `/${rule.params.source}/${rule.params.flags}`;
    case "allowedValues":
      return rule.params.values.map(String).join(", ");
    default:
      return String(rule.params.value);
  }
}

export const ValidationRulesEditor = observer(function ValidationRulesEditor({ locale, messages, supportedRules }: ValidationRulesEditorProps) {
  const store = useBuilderStore();
  const [editingElementId, setEditingElementId] = useState<string | null>(null);
  const element = store.selectedElement;
  const rules = element?.validation ?? [];
  if (supportedRules.length === 0) return null;
  const isOpen = editingElementId !== null && editingElementId === element?.id;
  return (
    <>
      <CollapsibleConfigurationSection title={messages.validationRules}>
        {rules.length === 0 ? (
          <p className={styles.emptyRules}>{messages.noValidationRules}</p>
        ) : (
          <ul className={styles.validationSummaryList} aria-label={messages.validationRules}>
            {rules.map(rule => (
              <li key={rule.id}>
                <span>{ruleLabel(rule.rule, locale)}</span>
                <code>{ruleSummary(rule)}</code>
              </li>
            ))}
          </ul>
        )}
        <JBButton className={styles.manageButton} size="sm" variant="outline" onClick={() => setEditingElementId(element?.id ?? null)}>
          {rules.length === 0 ? messages.addValidation : messages.manageValidation}
        </JBButton>
      </CollapsibleConfigurationSection>

      {isOpen ? (
        <Suspense fallback={<ModalLoadingFallback label={messages.loadingModal} />}>
          <ValidationRulesModal locale={locale} messages={messages} supportedRules={supportedRules} onClose={() => setEditingElementId(null)} />
        </Suspense>
      ) : null}
    </>
  );
});
