import { useTranslation } from "react-i18next";
import { observer } from "mobx-react-lite";
import { JBButton } from "jb-button/react";
import { JBInput } from "jb-input/react";
import { getLocalizedText, type JBValidationRule, type LocalizedText } from "../../domain/form-document";
import { getValidationIssueMessage, parseAllowedValues, validatePortableValidationRule, type ValidationRuleName } from "jb-form-builder/registry/validation-rule-registry";
import { useBuilderStore } from "../store/BuilderStoreContext";
import { ruleLabel } from "./validation-rule-label";
import styles from "./ValidationRulesEditor.module.css";

interface ValidationRuleEditorProps {
  rule: JBValidationRule;
  index: number;
  supportedRules: readonly ValidationRuleName[];
}
const inputValue = (event: Event) => String((event.target as unknown as { value?: unknown }).value ?? "");
const updateMessage = (message: LocalizedText, locale: string, value: string): LocalizedText => ({ translations: { ...message.translations, [locale]: value } });
const regexBuilderUrl = "https://regex101.com/?flavor=javascript";

function regexHelpMessage(help: string, linkLabel: string): string {
  return `${help} <a href="${regexBuilderUrl}" target="_blank" rel="noopener noreferrer">${linkLabel}</a>`;
}

export const ValidationRuleEditor = observer(function ValidationRuleEditor({ rule, index, supportedRules }: ValidationRuleEditorProps) {
  const { t: tCommon } = useTranslation("common");
  const { t } = useTranslation("validationRulesEditor");
  const store = useBuilderStore();
  const locale = store.editingLocale;
  const issues = validatePortableValidationRule(rule, supportedRules, `/validation/${index}`, store.selectedElement?.id ?? "");
  const commit = (nextRule: JBValidationRule) => store.updateSelectedValidationRule(rule.id, nextRule);
  return (
    <div className={styles.validationRule}>
      <div className={styles.validationRuleHeader}>
        <strong>{ruleLabel(rule.rule, locale)}</strong>
        <JBButton size="sm" variant="ghost" onClick={() => store.removeSelectedValidationRule(rule.id)}>
          {t("removeRule")}
        </JBButton>
      </div>
      {rule.rule === "pattern" ? (
        <div className={styles.validationParameterGrid}>
          <JBInput
            size="sm"
            name={`validation-source-${rule.id}`}
            label={t("patternSource")}
            value={rule.params.source}
            message={regexHelpMessage(t("regexHelp"), t("openRegexBuilder"))}
            onInput={event => commit({ ...rule, params: { ...rule.params, source: inputValue(event as unknown as Event) } })}
          />
          <JBInput
            size="sm"
            name={`validation-flags-${rule.id}`}
            label={t("patternFlags")}
            value={rule.params.flags}
            onInput={event => commit({ ...rule, params: { ...rule.params, flags: inputValue(event as unknown as Event) } })}
          />
        </div>
      ) : rule.rule === "allowedValues" ? (
        <JBInput
          size="sm"
          name={`validation-values-${rule.id}`}
          label={t("allowedValues")}
          value={rule.params.values.map(String).join(", ")}
          message={tCommon("commaSeparated")}
          onInput={event => commit({ ...rule, params: { values: parseAllowedValues(inputValue(event as unknown as Event)) } })}
        />
      ) : (
        <JBInput
          size="sm"
          name={`validation-value-${rule.id}`}
          label={t("ruleValue")}
          type="number"
          value={String(rule.params.value)}
          onInput={event => commit({ ...rule, params: { value: Number(inputValue(event as unknown as Event)) } } as JBValidationRule)}
        />
      )}
      <JBInput
        size="sm"
        name={`validation-message-${rule.id}`}
        label={t("validationMessage")}
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
