import { useTranslation } from "react-i18next";
import { observer } from "mobx-react-lite";
import { JBButton } from "jb-button/react";
import { JBInput } from "jb-input/react";
import { JBOption } from "jb-select/option/react";
import { JBSelect } from "jb-select/react";
import {
  isConditionElement,
  isContainerElement,
  walkFormElements,
  type JBConditionOperator,
  type JSONValue,
} from "../../domain/form-document";
import { registryByType } from "../../component-data";
import { JBCollapse } from "jb-collapse/react";
import { useBuilderStore } from "../store/BuilderStoreContext";
import { inputValue } from "./configuration-values";
import styles from "./ConfigurationPanel.module.css";
import { conditionConfigurationTranslations } from "./condition.translations";

type ConditionTranslationKey = keyof typeof conditionConfigurationTranslations.en;

const operatorOptions: Array<{ value: JBConditionOperator; labelKey: ConditionTranslationKey }> = [
  { value: "equals", labelKey: "equals" },
  { value: "notEquals", labelKey: "notEquals" },
  { value: "isEmpty", labelKey: "isEmpty" },
  { value: "isNotEmpty", labelKey: "isNotEmpty" },
  { value: "contains", labelKey: "contains" },
  { value: "notContains", labelKey: "notContains" },
  { value: "containsAny", labelKey: "containsAny" },
  { value: "containsAll", labelKey: "containsAll" },
  { value: "greaterThan", labelKey: "greaterThan" },
  { value: "greaterThanOrEqual", labelKey: "greaterThanOrEqual" },
  { value: "lessThan", labelKey: "lessThan" },
  { value: "lessThanOrEqual", labelKey: "lessThanOrEqual" },
];

const noValueOperators = new Set<JBConditionOperator>(["isEmpty", "isNotEmpty"]);

const operatorsByValueType: Record<string, ReadonlySet<JBConditionOperator>> = {
  string: new Set(["equals", "notEquals", "isEmpty", "isNotEmpty", "contains", "notContains"]),
  "number-string": new Set(["equals", "notEquals", "isEmpty", "isNotEmpty", "greaterThan", "greaterThanOrEqual", "lessThan", "lessThanOrEqual"]),
  range: new Set(["isEmpty", "isNotEmpty", "contains", "notContains"]),
  boolean: new Set(["equals", "notEquals", "isEmpty", "isNotEmpty"]),
  select: new Set(["equals", "notEquals", "isEmpty", "isNotEmpty", "contains", "notContains", "containsAny", "containsAll"]),
  file: new Set(["isEmpty", "isNotEmpty"]),
  image: new Set(["isEmpty", "isNotEmpty"]),
};

function availableOperatorOptions(valueType: string | undefined) {
  const allowed = operatorsByValueType[valueType ?? ""];
  return allowed ? operatorOptions.filter(option => allowed.has(option.value)) : operatorOptions;
}

function parseRuleValue(value: string, valueType: string | undefined, operator: JBConditionOperator): JSONValue {
  if (operator === "containsAny" || operator === "containsAll") return value.split(",").map(item => item.trim()).filter(Boolean);
  if (valueType === "boolean") return value === "true";
  if (valueType === "range") {
    const number = Number(value);
    return Number.isFinite(number) ? number : value;
  }
  return value;
}

export const ConditionConfigurationEditor = observer(function ConditionConfigurationEditor() {
  const { t } = useTranslation("conditionConfiguration");
  const store = useBuilderStore();
  const element = store.selectedElement;
  if (!element || !isConditionElement(element)) return null;

  const ownChildIds = new Set(element.children.map(child => child.id));
  const sourceElements = walkFormElements(store.document.elements).filter(candidate => (
    !isContainerElement(candidate)
    && !ownChildIds.has(candidate.id)
    && registryByType.get(candidate.type)?.valueType !== "none"
  ));
  const sourceNames = Array.from(new Set(sourceElements.map(source => source.name)));
  const addRule = () => {
    const fieldName = sourceNames[0];
    if (!fieldName) return;
    const source = sourceElements.find(candidate => candidate.name === fieldName);
    const operator = availableOperatorOptions(source ? registryByType.get(source.type)?.valueType : undefined)[0]?.value ?? "equals";
    const ruleId = store.addSelectedConditionRule(fieldName);
    if (ruleId && operator !== "equals") {
      store.updateSelectedConditionRule(ruleId, noValueOperators.has(operator) ? { operator, value: undefined } : { operator, value: "" });
    }
  };

  return (
    <JBCollapse title={t("visibilityConditions")} defaultOpen>
      <div className={styles.conditionEditor}>
        <JBSelect<"all" | "any">
          popoverPosition="fixed"
          name="conditionMatch"
          label={t("showWhen")}
          value={element.conditions.match}
          clearable={false}
          onChange={event => store.updateSelectedConditionMatch(event.target.value === "any" ? "any" : "all")}
        >
          <JBOption value="all">{t("allConditionsMatch")}</JBOption>
          <JBOption value="any">{t("anyConditionMatches")}</JBOption>
        </JBSelect>

        {element.conditions.rules.map((rule, index) => {
          const source = sourceElements.find(candidate => candidate.name === rule.fieldName);
          const valueType = source ? registryByType.get(source.type)?.valueType : undefined;
          const availableOperators = availableOperatorOptions(valueType);
          const expectsValue = !noValueOperators.has(rule.operator);
          return (
            <div className={styles.conditionRule} key={rule.id}>
              <div className={styles.conditionRuleHeading}>
                <strong>{t("condition", { number: index + 1 })}</strong>
                <JBButton square size="sm" variant="ghost" aria-label={t("removeCondition")} onClick={() => store.removeSelectedConditionRule(rule.id)}>×</JBButton>
              </div>
              <JBSelect<string>
                popoverPosition="fixed"
                name={`conditionField_${rule.id}`}
                label={t("field")}
                value={rule.fieldName}
                clearable={false}
                onChange={event => {
                  const fieldName = event.target.value;
                  const nextSource = sourceElements.find(candidate => candidate.name === fieldName);
                  const nextOperators = availableOperatorOptions(nextSource ? registryByType.get(nextSource.type)?.valueType : undefined);
                  if (nextOperators.some(option => option.value === rule.operator)) {
                    store.updateSelectedConditionRule(rule.id, { fieldName });
                  } else {
                    const operator = nextOperators[0]?.value ?? "equals";
                    store.updateSelectedConditionRule(rule.id, noValueOperators.has(operator) ? { fieldName, operator, value: undefined } : { fieldName, operator, value: "" });
                  }
                }}
              >
                {!sourceNames.includes(rule.fieldName) ? <JBOption value={rule.fieldName}>{rule.fieldName} ({t("missing")})</JBOption> : null}
                {sourceNames.map(name => <JBOption key={name} value={name}>{name}</JBOption>)}
              </JBSelect>
              <JBSelect<JBConditionOperator>
                popoverPosition="fixed"
                name={`conditionOperator_${rule.id}`}
                label={t("operator")}
                value={rule.operator}
                clearable={false}
                onChange={event => {
                  const operator = event.target.value;
                  store.updateSelectedConditionRule(rule.id, noValueOperators.has(operator) ? { operator, value: undefined } : { operator, value: rule.value ?? "" });
                }}
              >
                {availableOperators.map(option => <JBOption key={option.value} value={option.value}>{t(option.labelKey)}</JBOption>)}
              </JBSelect>
              {expectsValue ? (
                valueType === "boolean" ? (
                  <JBSelect<string>
                    popoverPosition="fixed"
                    name={`conditionValue_${rule.id}`}
                    label={t("value")}
                    value={String(rule.value ?? false)}
                    clearable={false}
                    onChange={event => store.updateSelectedConditionRule(rule.id, { value: event.target.value === "true" })}
                  >
                    <JBOption value="true">{t("true")}</JBOption>
                    <JBOption value="false">{t("false")}</JBOption>
                  </JBSelect>
                ) : (
                  <JBInput
                    name={`conditionValue_${rule.id}`}
                    label={rule.operator === "containsAny" || rule.operator === "containsAll" ? t("valuesCommaSeparated") : t("value")}
                    value={Array.isArray(rule.value) ? rule.value.join(", ") : String(rule.value ?? "")}
                    onInput={event => store.updateSelectedConditionRule(rule.id, { value: parseRuleValue(inputValue(event as unknown as Event), valueType, rule.operator) })}
                  />
                )
              ) : null}
            </div>
          );
        })}

        {sourceNames.length === 0 ? <p className={styles.conditionHint}>{t("addFieldBeforeCondition")}</p> : null}
        <JBButton variant="outline" size="sm" disabled={sourceNames.length === 0} onClick={addRule}>{t("addCondition")}</JBButton>
        {element.conditions.rules.length === 0 ? <p className={styles.conditionHint}>{t("noConditionsAlwaysVisible")}</p> : null}
      </div>
    </JBCollapse>
  );
});
