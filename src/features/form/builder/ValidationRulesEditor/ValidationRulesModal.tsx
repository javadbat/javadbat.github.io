import { useState } from "react";
import { observer } from "mobx-react-lite";
import { JBButton } from "jb-button/react";
import { JBModal } from "jb-modal/react";
import { JBOption } from "jb-select/option/react";
import { JBSelect } from "jb-select/react";
import { ModalCloseButton } from "../../../../components/react/components/modal/ModalCloseButton";
import type { FormMessages } from "../../i18n/locale-adapter";
import type { ValidationRuleName } from "../../registry/validation-rule-registry";
import modalStyles from "../../shell/FormModal.module.css";
import { useBuilderStore } from "../store/BuilderStoreContext";
import { ValidationRuleEditor } from "./ValidationRuleEditor";
import { ruleLabel } from "./validation-rule-label";
import styles from "./ValidationRulesEditor.module.css";

interface ValidationRulesModalProps {
  locale: string;
  messages: FormMessages;
  supportedRules: readonly ValidationRuleName[];
  onClose: () => void;
}

export const ValidationRulesModal = observer(function ValidationRulesModal({ locale, messages, supportedRules, onClose }: ValidationRulesModalProps) {
  const store = useBuilderStore();
  const [nextRule, setNextRule] = useState<ValidationRuleName>(supportedRules[0] ?? "pattern");
  const element = store.selectedElement;
  const rules = element?.validation ?? [];
  const selectedRule = supportedRules.includes(nextRule) ? nextRule : supportedRules[0];

  return (
    <JBModal className={modalStyles.formModal} isOpen label={messages.validationRules} autoCloseOnEscape autoCloseOnBackgroundClick onClose={onClose}>
      <div slot="header">
        <div className={styles.modalHeading}>
          <p className={styles.eyebrow}>{element?.name}</p>
          <h2>{messages.validationRules}</h2>
        </div>
        <ModalCloseButton label={messages.close} onClick={onClose} />
      </div>
      <div slot="content" className={styles.modalContent}>
        <div className={styles.modalIntro}>
          <div>
            <h3>{messages.addValidation}</h3>
            <p>{messages.validationDescription}</p>
          </div>
          <div className={styles.addValidationRule}>
            <JBSelect<ValidationRuleName>
              size="sm"
              popoverPosition="fixed"
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
            <JBButton size="sm" color="primary" onClick={() => store.addSelectedValidationRule(selectedRule, locale)}>
              {messages.addRule}
            </JBButton>
          </div>
        </div>

        <section className={styles.currentRules} aria-labelledby="current-validation-rules">
          <div className={styles.currentRulesHeading}>
            <h3 id="current-validation-rules">{messages.currentValidationRules}</h3>
            <span>{rules.length}</span>
          </div>
          {rules.length === 0 ? (
            <div className={styles.modalEmptyState}>
              <p>{messages.noValidationRules}</p>
            </div>
          ) : (
            <div className={styles.validationRuleList}>
              {rules.map((rule, index) => (
                <ValidationRuleEditor key={rule.id} rule={rule} index={index} locale={locale} messages={messages} supportedRules={supportedRules} />
              ))}
            </div>
          )}
        </section>
      </div>
      <div slot="footer" className={styles.modalActions}>
        <JBButton color="primary" onClick={onClose}>
          {messages.done}
        </JBButton>
      </div>
    </JBModal>
  );
});
