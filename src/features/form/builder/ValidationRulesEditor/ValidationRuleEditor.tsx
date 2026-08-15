import { observer } from "mobx-react-lite";
import { JBButton } from "jb-button/react";
import { JBInput } from "jb-input/react";
import { getLocalizedText, type JBValidationRule, type LocalizedText } from "../../domain/form-document";
import type { FormMessages } from "../../i18n/locale-adapter";
import { getValidationIssueMessage, parseAllowedValues, validatePortableValidationRule, type ValidationRuleName } from "../../registry/validation-rule-registry";
import { useBuilderStore } from "../store/BuilderStoreContext";
import { ruleLabel } from "./validation-rule-label";
import styles from "./ValidationRulesEditor.module.css";

interface ValidationRuleEditorProps {
  rule: JBValidationRule;
  index: number;
  locale: string;
  messages: FormMessages;
  supportedRules: readonly ValidationRuleName[];
}
const inputValue = (event: Event) => String((event.target as unknown as { value?: unknown }).value ?? "");
const updateMessage = (message: LocalizedText, locale: string, value: string): LocalizedText => ({ translations: { ...message.translations, [locale]: value } });

export const ValidationRuleEditor = observer(function ValidationRuleEditor({ rule, index, locale, messages, supportedRules }: ValidationRuleEditorProps) {
  const store = useBuilderStore();
  const issues = validatePortableValidationRule(rule, supportedRules, `/validation/${index}`, store.selectedElement?.id ?? "");
  const commit = (nextRule: JBValidationRule) => store.updateSelectedValidationRule(rule.id, nextRule);
  return (
    <div className={styles.validationRule}>
      <div className={styles.validationRuleHeader}>
        <strong>{ruleLabel(rule.rule, locale)}</strong>
        <JBButton size="sm" variant="ghost" onClick={() => store.removeSelectedValidationRule(rule.id)}>
          {messages.removeRule}
        </JBButton>
      </div>
      {rule.rule === "pattern" ? (
        <div className={styles.validationParameterGrid}>
          <JBInput
            size="sm"
            name={`validation-source-${rule.id}`}
            label={messages.patternSource}
            value={rule.params.source}
            onInput={event => commit({ ...rule, params: { ...rule.params, source: inputValue(event as unknown as Event) } })}
          />
          <JBInput
            size="sm"
            name={`validation-flags-${rule.id}`}
            label={messages.patternFlags}
            value={rule.params.flags}
            onInput={event => commit({ ...rule, params: { ...rule.params, flags: inputValue(event as unknown as Event) } })}
          />
        </div>
      ) : rule.rule === "allowedValues" ? (
        <JBInput
          size="sm"
          name={`validation-values-${rule.id}`}
          label={messages.allowedValues}
          value={rule.params.values.map(String).join(", ")}
          message={messages.commaSeparated}
          onInput={event => commit({ ...rule, params: { values: parseAllowedValues(inputValue(event as unknown as Event)) } })}
        />
      ) : (
        <JBInput
          size="sm"
          name={`validation-value-${rule.id}`}
          label={messages.ruleValue}
          type="number"
          value={String(rule.params.value)}
          onInput={event => commit({ ...rule, params: { value: Number(inputValue(event as unknown as Event)) } } as JBValidationRule)}
        />
      )}
      <JBInput
        size="sm"
        name={`validation-message-${rule.id}`}
        label={messages.validationMessage}
        value={getLocalizedText(rule.message, locale, store.document.localization.defaultLocale)}
        onInput={event => commit({ ...rule, message: updateMessage(rule.message, locale, inputValue(event as unknown as Event)) })}
      />
      {issues.length > 0 ? (
        <ul className={styles.validationIssues}>
          {issues.map(issue => (
            <li key={`${issue.code}-${issue.path}`}>{getValidationIssueMessage(issue.messageKey, locale, issue.message)}</li>
          ))}
        </ul>
      ) : null}
    </div>
  );
});
