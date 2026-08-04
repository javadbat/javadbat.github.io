import { useState } from "react";
import { observer } from "mobx-react-lite";
import { JBButton } from "jb-button/react";
import { JBInput } from "jb-input/react";
import { JBOption, JBSelect } from "jb-select/react";
import { getLocalizedText, type JBValidationRule, type LocalizedText } from "../domain/form-document";
import type { FormMessages } from "../i18n/locale-adapter";
import {
  getValidationIssueMessage,
  parseAllowedValues,
  validatePortableValidationRule,
  validationRuleDefinitionByName,
  type ValidationRuleName,
} from "../registry/validation-rule-registry";
import { useBuilderStore } from "./BuilderStoreContext";
import { CollapsibleConfigurationSection } from "./CollapsibleConfigurationSection";
import styles from "./BuilderApp.module.css";

interface ValidationRulesEditorProps {
  locale: string;
  messages: FormMessages;
  supportedRules: readonly ValidationRuleName[];
}

function inputValue(event: Event): string {
  return String((event.target as unknown as { value?: unknown }).value ?? "");
}

function ruleLabel(rule: ValidationRuleName, locale: string): string {
  const label = validationRuleDefinitionByName.get(rule)?.label;
  return locale === "fa" ? (label?.fa ?? rule) : (label?.en ?? rule);
}

function updateMessage(message: LocalizedText, locale: string, value: string): LocalizedText {
  return {
    translations: {
      ...message.translations,
      [locale]: value,
    },
  };
}

function valuesText(rule: Extract<JBValidationRule, { rule: "allowedValues" }>) {
  return rule.params.values.map(String).join(", ");
}

interface ValidationRuleEditorProps {
  rule: JBValidationRule;
  index: number;
  locale: string;
  messages: FormMessages;
  supportedRules: readonly ValidationRuleName[];
}

const ValidationRuleEditor = observer(function ValidationRuleEditor({ rule, index, locale, messages, supportedRules }: ValidationRuleEditorProps) {
  const store = useBuilderStore();
  const issues = validatePortableValidationRule(rule, supportedRules, `/validation/${index}`, store.selectedElement?.id ?? "");
  const commit = (nextRule: JBValidationRule) => {
    store.updateSelectedValidationRule(rule.id, nextRule);
  };

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
            name={`validation-source-${rule.id}`}
            label={messages.patternSource}
            value={rule.params.source}
            onInput={event =>
              commit({
                ...rule,
                params: {
                  ...rule.params,
                  source: inputValue(event as unknown as Event),
                },
              })
            }
          />
          <JBInput
            name={`validation-flags-${rule.id}`}
            label={messages.patternFlags}
            value={rule.params.flags}
            onInput={event =>
              commit({
                ...rule,
                params: {
                  ...rule.params,
                  flags: inputValue(event as unknown as Event),
                },
              })
            }
          />
        </div>
      ) : rule.rule === "allowedValues" ? (
        <JBInput
          name={`validation-values-${rule.id}`}
          label={messages.allowedValues}
          value={valuesText(rule)}
          message={messages.commaSeparated}
          onInput={event =>
            commit({
              ...rule,
              params: {
                values: parseAllowedValues(inputValue(event as unknown as Event)),
              },
            })
          }
        />
      ) : (
        <JBInput
          name={`validation-value-${rule.id}`}
          label={messages.ruleValue}
          type="number"
          value={String(rule.params.value)}
          onInput={event => {
            const value = Number(inputValue(event as unknown as Event));
            commit({
              ...rule,
              params: { value },
            } as JBValidationRule);
          }}
        />
      )}

      <JBInput
        name={`validation-message-${rule.id}`}
        label={messages.validationMessage}
        value={getLocalizedText(rule.message, locale, store.document.localization.defaultLocale)}
        onInput={event =>
          commit({
            ...rule,
            message: updateMessage(rule.message, locale, inputValue(event as unknown as Event)),
          })
        }
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

export const ValidationRulesEditor = observer(function ValidationRulesEditor({ locale, messages, supportedRules }: ValidationRulesEditorProps) {
  const store = useBuilderStore();
  const [nextRule, setNextRule] = useState<ValidationRuleName>(supportedRules[0] ?? "pattern");
  const rules = store.selectedElement?.validation ?? [];

  if (supportedRules.length === 0) {
    return null;
  }

  const selectedRule = supportedRules.includes(nextRule) ? nextRule : supportedRules[0];

  return (
    <CollapsibleConfigurationSection title={messages.validationRules}>
      <p className={styles.sectionDescription}>{messages.validationDescription}</p>
      <div className={styles.addValidationRule}>
        <JBSelect<ValidationRuleName> name="newValidationRule" label={messages.ruleType} value={selectedRule} hideClear onChange={event => setNextRule(event.target.value)}>
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
