import { useState } from "react";
import { observer } from "mobx-react-lite";
import { JBButton } from "jb-button/react";
import { JBOption } from "jb-select/option/react";
import { JBSelect } from "jb-select/react";
import type { FormMessages } from "../../i18n/locale-adapter";
import type { ValidationRuleName } from "../../registry/validation-rule-registry";
import { useBuilderStore } from "../BuilderStoreContext";
import { CollapsibleConfigurationSection } from "../CollapsibleConfigurationSection/CollapsibleConfigurationSection";
import { ValidationRuleEditor } from "./ValidationRuleEditor";
import { ruleLabel } from "./validation-rule-label";
import styles from "./ValidationRulesEditor.module.css";

interface ValidationRulesEditorProps {
  locale: string;
  messages: FormMessages;
  supportedRules: readonly ValidationRuleName[];
}

export const ValidationRulesEditor = observer(function ValidationRulesEditor({ locale, messages, supportedRules }: ValidationRulesEditorProps) {
  const store = useBuilderStore();
  const [nextRule, setNextRule] = useState<ValidationRuleName>(supportedRules[0] ?? "pattern");
  const rules = store.selectedElement?.validation ?? [];
  if (supportedRules.length === 0) return null;
  const selectedRule = supportedRules.includes(nextRule) ? nextRule : supportedRules[0];
  return (
    <CollapsibleConfigurationSection title={messages.validationRules}>
      <p className={styles.sectionDescription}>{messages.validationDescription}</p>
      <div className={styles.addValidationRule}>
        <JBSelect<ValidationRuleName>
          size="sm"
          name="newValidationRule"
          label={messages.ruleType}
          value={selectedRule}
          hideClear
          onChange={event => setNextRule(event.target.value)}
        >
          {supportedRules.map(rule => (
            <JBOption key={rule} value={rule}>
              {ruleLabel(rule, locale)}
            </JBOption>
          ))}
        </JBSelect>
        <JBButton size="sm" variant="outline" onClick={() => store.addSelectedValidationRule(selectedRule, locale)}>
          {messages.addRule}
        </JBButton>
      </div>
      {rules.length === 0 ? (
        <p className={styles.emptyRules}>{messages.noValidationRules}</p>
      ) : (
        <div className={styles.validationRuleList}>
          {rules.map((rule, index) => (
            <ValidationRuleEditor key={rule.id} rule={rule} index={index} locale={locale} messages={messages} supportedRules={supportedRules} />
          ))}
        </div>
      )}
    </CollapsibleConfigurationSection>
  );
});
