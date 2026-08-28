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
import { registryByType } from "jb-form-builder/registry/form-element-registry";
import { CollapsibleConfigurationSection } from "../CollapsibleConfigurationSection/CollapsibleConfigurationSection";
import { useBuilderStore } from "../store/BuilderStoreContext";
import { inputValue } from "./configuration-values";
import styles from "./ConfigurationPanel.module.css";

const operatorOptions: Array<{ value: JBConditionOperator; label: string }> = [
  { value: "equals", label: "Equals" },
  { value: "notEquals", label: "Does not equal" },
  { value: "isEmpty", label: "Is empty" },
  { value: "isNotEmpty", label: "Is not empty" },
  { value: "contains", label: "Contains" },
  { value: "notContains", label: "Does not contain" },
  { value: "containsAny", label: "Contains any" },
  { value: "containsAll", label: "Contains all" },
  { value: "greaterThan", label: "Greater than" },
  { value: "greaterThanOrEqual", label: "Greater than or equal" },
  { value: "lessThan", label: "Less than" },
  { value: "lessThanOrEqual", label: "Less than or equal" },
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
    <CollapsibleConfigurationSection title="Visibility conditions">
      <div className={styles.conditionEditor}>
        <JBSelect<"all" | "any">
          name="conditionMatch"
          label="Show when"
          value={element.conditions.match}
          hideClear
          onChange={event => store.updateSelectedConditionMatch(event.target.value === "any" ? "any" : "all")}
        >
          <JBOption value="all">All conditions match</JBOption>
          <JBOption value="any">Any condition matches</JBOption>
        </JBSelect>

        {element.conditions.rules.map((rule, index) => {
          const source = sourceElements.find(candidate => candidate.name === rule.fieldName);
          const valueType = source ? registryByType.get(source.type)?.valueType : undefined;
          const availableOperators = availableOperatorOptions(valueType);
          const expectsValue = !noValueOperators.has(rule.operator);
          return (
            <div className={styles.conditionRule} key={rule.id}>
              <div className={styles.conditionRuleHeading}>
                <strong>Condition {index + 1}</strong>
                <JBButton square size="sm" variant="ghost" aria-label="Remove condition" onClick={() => store.removeSelectedConditionRule(rule.id)}>×</JBButton>
              </div>
              <JBSelect<string>
                name={`conditionField_${rule.id}`}
                label="Field"
                value={rule.fieldName}
                hideClear
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
                {!sourceNames.includes(rule.fieldName) ? <JBOption value={rule.fieldName}>{rule.fieldName} (missing)</JBOption> : null}
                {sourceNames.map(name => <JBOption key={name} value={name}>{name}</JBOption>)}
              </JBSelect>
              <JBSelect<JBConditionOperator>
                name={`conditionOperator_${rule.id}`}
                label="Operator"
                value={rule.operator}
                hideClear
                onChange={event => {
                  const operator = event.target.value;
                  store.updateSelectedConditionRule(rule.id, noValueOperators.has(operator) ? { operator, value: undefined } : { operator, value: rule.value ?? "" });
                }}
              >
                {availableOperators.map(option => <JBOption key={option.value} value={option.value}>{option.label}</JBOption>)}
              </JBSelect>
              {expectsValue ? (
                valueType === "boolean" ? (
                  <JBSelect<string>
                    name={`conditionValue_${rule.id}`}
                    label="Value"
                    value={String(rule.value ?? false)}
                    hideClear
                    onChange={event => store.updateSelectedConditionRule(rule.id, { value: event.target.value === "true" })}
                  >
                    <JBOption value="true">True</JBOption>
                    <JBOption value="false">False</JBOption>
                  </JBSelect>
                ) : (
                  <JBInput
                    name={`conditionValue_${rule.id}`}
                    label={rule.operator === "containsAny" || rule.operator === "containsAll" ? "Values (comma separated)" : "Value"}
                    value={Array.isArray(rule.value) ? rule.value.join(", ") : String(rule.value ?? "")}
                    onInput={event => store.updateSelectedConditionRule(rule.id, { value: parseRuleValue(inputValue(event as unknown as Event), valueType, rule.operator) })}
                  />
                )
              ) : null}
            </div>
          );
        })}

        {sourceNames.length === 0 ? <p className={styles.conditionHint}>Add a field outside this container before creating a condition.</p> : null}
        <JBButton variant="outline" size="sm" disabled={sourceNames.length === 0} onClick={addRule}>Add condition</JBButton>
        {element.conditions.rules.length === 0 ? <p className={styles.conditionHint}>No conditions means this container is always visible.</p> : null}
      </div>
    </CollapsibleConfigurationSection>
  );
});
