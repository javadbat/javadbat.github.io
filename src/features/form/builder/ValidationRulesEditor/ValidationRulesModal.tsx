import { useTranslation } from "react-i18next";
import { useState } from "react";
import { observer } from "mobx-react-lite";
import { JBButton } from "jb-button/react";
import { JBModal } from "jb-modal/react";
import { JBOption } from "jb-select/option/react";
import { JBSelect } from "jb-select/react";
import { ModalCloseButton } from "../../../../components/react/components/modal/ModalCloseButton";
import type { ValidationRuleName } from "jb-form-builder/registry/validation-rule-registry";
import modalStyles from "../../shell/FormModal.module.css";
import { useBuilderStore } from "../store/BuilderStoreContext";
import { ValidationRuleEditor } from "./ValidationRuleEditor";
import { ruleLabel } from "./validation-rule-label";
import styles from "./ValidationRulesEditor.module.css";

interface ValidationRulesModalProps {
  supportedRules: readonly ValidationRuleName[];
  onClose: () => void;
}

export const ValidationRulesModal = observer(function ValidationRulesModal({ supportedRules, onClose }: ValidationRulesModalProps) {
  const { t: tCommon } = useTranslation("common");
  const { t } = useTranslation("validationRulesEditor");
  const store = useBuilderStore();
  const locale = store.editingLocale;
  const [nextRule, setNextRule] = useState<ValidationRuleName>(supportedRules[0] ?? "pattern");
  const element = store.selectedElement;
  const rules = element?.validation ?? [];
  const selectedRule = supportedRules.includes(nextRule) ? nextRule : supportedRules[0];

  return (
    <JBModal className={modalStyles.formModal} isOpen label={t("validationRules")} autoCloseOnEscape autoCloseOnBackgroundClick onClose={onClose}>
      <div slot="header">
        <div className={styles.modalHeading}>
          <p className={styles.eyebrow}>{element?.name}</p>
          <h2>{t("validationRules")}</h2>
        </div>
        <ModalCloseButton label={tCommon("close")} onClick={onClose} />
      </div>
      <div slot="content" className={styles.modalContent}>
        <div className={styles.modalIntro}>
          <div>
            <h3>{t("addValidation")}</h3>
            <p>{t("validationDescription")}</p>
          </div>
          <div className={styles.addValidationRule}>
            <JBSelect<ValidationRuleName>
              size="sm"
              popoverPosition="fixed"
              name="newValidationRule"
              label={t("ruleType")}
              value={selectedRule}
              clearable={false}
              onChange={event => setNextRule(event.target.value)}
            >
              {supportedRules.map(rule => (
                <JBOption key={rule} value={rule}>
                  {ruleLabel(rule, locale)}
                </JBOption>
              ))}
            </JBSelect>
            <JBButton size="sm" color="primary" onClick={() => store.addSelectedValidationRule(selectedRule, locale)}>
              {t("addRule")}
            </JBButton>
          </div>
        </div>

        <section className={styles.currentRules} aria-labelledby="current-validation-rules">
          <div className={styles.currentRulesHeading}>
            <h3 id="current-validation-rules">{t("currentValidationRules")}</h3>
            <span>{rules.length}</span>
          </div>
          {rules.length === 0 ? (
            <div className={styles.modalEmptyState}>
              <p>{t("noValidationRules")}</p>
            </div>
          ) : (
            <div className={styles.validationRuleList}>
              {rules.map((rule, index) => (
                <ValidationRuleEditor key={rule.id} rule={rule} index={index} supportedRules={supportedRules} />
              ))}
            </div>
          )}
        </section>
      </div>
      <div slot="footer" className={styles.modalActions}>
        <JBButton color="primary" onClick={onClose}>
          {t("done")}
        </JBButton>
      </div>
    </JBModal>
  );
});
