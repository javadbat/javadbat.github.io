import { useTranslation } from "react-i18next";
import { lazy, Suspense, useState } from "react";
import { observer } from "mobx-react-lite";
import { JBButton } from "jb-button/react";
import type { JBValidationRule } from "../../domain/form-document";
import type { ValidationRuleName } from "jb-form-builder/registry/validation-rule-registry";
import { ModalLoadingFallback } from "../../shell/ModalLoadingFallback";
import { useBuilderStore } from "../store/BuilderStoreContext";
import { JBCollapse } from "jb-collapse/react";
import { ruleLabel } from "./validation-rule-label";
import styles from "./ValidationRulesEditor.module.css";

const ValidationRulesModal = lazy(() => import("./ValidationRulesModal").then(module => ({ default: module.ValidationRulesModal })));

interface ValidationRulesEditorProps {
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

export const ValidationRulesEditor = observer(function ValidationRulesEditor({ supportedRules }: ValidationRulesEditorProps) {
  const { t: tCommon } = useTranslation("common");
  const { t } = useTranslation("validationRulesEditor");
  const store = useBuilderStore();
  const locale = store.editingLocale;
  const [editingElementId, setEditingElementId] = useState<string | null>(null);
  const element = store.selectedElement;
  const rules = element?.validation ?? [];
  if (supportedRules.length === 0) return null;
  const isOpen = editingElementId !== null && editingElementId === element?.id;
  return (
    <>
      <JBCollapse title={t("validationRules")}>
        {rules.length === 0 ? (
          <p className={styles.emptyRules}>{t("noValidationRules")}</p>
        ) : (
          <ul className={styles.validationSummaryList} aria-label={t("validationRules")}>
            {rules.map(rule => (
              <li key={rule.id}>
                <span>{ruleLabel(rule.rule, locale)}</span>
                <code>{ruleSummary(rule)}</code>
              </li>
            ))}
          </ul>
        )}
        <JBButton className={styles.manageButton} size="sm" variant="outline" onClick={() => setEditingElementId(element?.id ?? null)}>
          {rules.length === 0 ? t("addValidation") : t("manageValidation")}
        </JBButton>
      </JBCollapse>

      {isOpen ? (
        <Suspense fallback={<ModalLoadingFallback label={tCommon("loadingModal")} />}>
          <ValidationRulesModal supportedRules={supportedRules} onClose={() => setEditingElementId(null)} />
        </Suspense>
      ) : null}
    </>
  );
});
