import { JBDateInput } from "jb-date-input/react";
import { JBNumberInput } from "jb-number-input/react";
import { JBOption } from "jb-select/option/react";
import { JBSelect } from "jb-select/react";
import { JBInput } from "jb-input/react";
import { JBTextarea } from "jb-textarea/react";
import { JBTimeInput } from "jb-time-input/react";
import type { JBTimeInputWebComponent } from "jb-time-input";
import { useEffect, useRef, type ReactNode } from "react";
import { getLocalizedText } from "../../domain/form-document";
import type { JBFormElementType, JBFormElementV1 } from "../../domain/form-document";
import type { FormElementRegistryEntry } from "../../registry/form-element-registry";
import { asSelectOptions, inputValue } from "./configuration-values";
import styles from "./ConfigurationPanel.module.css";

interface InitialValueEditorProps {
  entry: FormElementRegistryEntry;
  element: JBFormElementV1;
  label: string;
  message: string;
  locale: string;
  defaultLocale: string;
  onValueChange: (value: unknown) => void;
}

type InitialValueRenderer = (props: InitialValueEditorProps) => ReactNode;

function textRenderer({ entry, element, label, message, onValueChange }: InitialValueEditorProps) {
  const displayedValue = Array.isArray(element.initialValue)
    ? element.initialValue.join(", ")
    : typeof element.initialValue === "string" || typeof element.initialValue === "number"
      ? String(element.initialValue)
      : "";

  return (
    <JBInput
      size="sm"
      name="elementInitialValue"
      label={label}
      message={message}
      value={displayedValue}
      onInput={event => {
        const value = inputValue(event as unknown as Event);
        onValueChange(value === "" ? undefined : entry.initialValueKind === "range" ? (value.includes(",") ? value.split(",").map(part => Number(part.trim())) : Number(value)) : value);
      }}
    />
  );
}

function numberRenderer({ entry, element, label, message, onValueChange }: InitialValueEditorProps) {
  const displayedValue = Array.isArray(element.initialValue)
    ? element.initialValue.join(", ")
    : typeof element.initialValue === "number" || typeof element.initialValue === "string"
      ? element.initialValue
      : "";
  return (
    <JBNumberInput
      size="sm"
      name="elementInitialValue"
      label={label}
      message={message}
      minValue={typeof element.props.minValue === "number" ? element.props.minValue : undefined}
      maxValue={typeof element.props.maxValue === "number" ? element.props.maxValue : undefined}
      acceptNegative={element.props.acceptNegative === true}
      decimalPrecision={typeof element.props.decimalPrecision === "number" ? element.props.decimalPrecision : undefined}
      showThousandSeparator={element.props.showThousandSeparator === true}
      thousandSeparator={typeof element.props.thousandSeparator === "string" ? element.props.thousandSeparator : undefined}
      step={typeof element.props.step === "number" ? element.props.step : undefined}
      showPersianNumber={element.props.showPersianNumber === true}
      showControlButton={element.props.showControlButton === true}
      value={displayedValue}
      onInput={event => {
        const value = inputValue(event as unknown as Event);
        onValueChange(
          value === ""
            ? undefined
            : entry.initialValueKind === "range"
              ? value.includes(",")
                ? value.split(",").map(part => Number(part.trim()))
                : Number(value)
              : value,
        );
      }}
    />
  );
}

function rangeRenderer({ element, label, message, locale, onValueChange }: InitialValueEditorProps) {
  const isRange = element.props.mode === "range";
  const configuredMin = typeof element.props.min === "number" ? element.props.min : undefined;
  const configuredMax = typeof element.props.max === "number" ? element.props.max : undefined;
  const step = typeof element.props.step === "number" ? element.props.step : undefined;
  const showPersianNumber = element.props.showPersianNumber === true;
  if (!isRange) {
    const value = typeof element.initialValue === "number" ? element.initialValue : "";
    return (
      <JBNumberInput
        size="sm"
        name="elementInitialValue"
        label={label}
        message={message}
        minValue={configuredMin}
        maxValue={configuredMax}
        step={step}
        acceptNegative={(configuredMin ?? 0) < 0}
        showPersianNumber={showPersianNumber}
        value={value}
        onInput={event => {
          const nextValue = inputValue(event as unknown as Event);
          onValueChange(nextValue === "" ? undefined : Number(nextValue));
        }}
      />
    );
  }

  const rangeValue = Array.isArray(element.initialValue) && element.initialValue.length === 2 && element.initialValue.every(value => typeof value === "number")
    ? element.initialValue as [number, number]
    : undefined;
  const isFarsi = locale.toLowerCase().split("-")[0] === "fa";
  const updateRangeValue = (index: 0 | 1, rawValue: string) => {
    if (rawValue === "") {
      onValueChange(undefined);
      return;
    }
    const nextNumber = Number(rawValue);
    const fallback = rangeValue?.[index === 0 ? 1 : 0] ?? nextNumber;
    onValueChange(index === 0 ? [nextNumber, fallback] : [fallback, nextNumber]);
  };
  return (
    <div className={styles.initialValueRange} role="group" aria-label={label}>
      <JBNumberInput
        size="sm"
        name="elementInitialValueStart"
        label={isFarsi ? "شروع بازه" : "Range start"}
        message={message}
        minValue={configuredMin}
        maxValue={configuredMax}
        step={step}
        acceptNegative={(configuredMin ?? 0) < 0}
        showPersianNumber={showPersianNumber}
        value={rangeValue?.[0] ?? ""}
        onInput={event => updateRangeValue(0, inputValue(event as unknown as Event))}
      />
      <JBNumberInput
        size="sm"
        name="elementInitialValueEnd"
        label={isFarsi ? "پایان بازه" : "Range end"}
        minValue={configuredMin}
        maxValue={configuredMax}
        step={step}
        acceptNegative={(configuredMin ?? 0) < 0}
        showPersianNumber={showPersianNumber}
        value={rangeValue?.[1] ?? ""}
        onInput={event => updateRangeValue(1, inputValue(event as unknown as Event))}
      />
    </div>
  );
}

function dateRenderer({ element, label, message, onValueChange }: InitialValueEditorProps) {
  const inputType = element.props.inputType === "GREGORIAN" || element.props.inputType === "JALALI" ? element.props.inputType : undefined;
  const valueType = element.props.valueType === "GREGORIAN" || element.props.valueType === "JALALI" || element.props.valueType === "TIME_STAMP" ? element.props.valueType : undefined;
  const commitValue = (event: Event) => onValueChange(inputValue(event) || undefined);
  return (
    <JBDateInput
      size="sm"
      name="elementInitialValue"
      label={label}
      message={message}
      inputType={inputType}
      valueType={valueType}
      format={typeof element.props.format === "string" ? element.props.format : undefined}
      min={typeof element.props.min === "string" ? element.props.min : undefined}
      max={typeof element.props.max === "string" ? element.props.max : undefined}
      direction={element.props.direction === "rtl" || element.props.direction === "ltr" ? element.props.direction : undefined}
      showPersianNumber={element.props.showPersianNumber === true}
      value={typeof element.initialValue === "string" ? element.initialValue : null}
      onInput={event => commitValue(event as unknown as Event)}
      onChange={event => commitValue(event as unknown as Event)}
      onSelect={event => commitValue(event as unknown as Event)}
    />
  );
}

function TimeInitialValueInput({ element, label, message, onValueChange }: InitialValueEditorProps) {
  const secondEnabled = element.props.secondEnabled === true;
  const storedValue = typeof element.initialValue === "string" ? element.initialValue : null;
  const displayedValue = storedValue && !secondEnabled && /^\d{2}:\d{2}:\d{2}$/.test(storedValue)
    ? storedValue.slice(0, 5)
    : storedValue && secondEnabled && /^\d{2}:\d{2}$/.test(storedValue)
      ? `${storedValue}:00`
      : storedValue;
  const timeInputRef = useRef<JBTimeInputWebComponent | null>(null);
  const commitCurrentValue = () => onValueChange(timeInputRef.current?.value || undefined);

  useEffect(() => {
    const picker = timeInputRef.current?.elements?.timePicker?.component;
    if (!picker) return;
    const commitPickerValue = () => commitCurrentValue();
    picker.addEventListener("change", commitPickerValue);
    return () => picker.removeEventListener("change", commitPickerValue);
  }, [onValueChange]);

  return (
    <JBTimeInput
      ref={timeInputRef}
      label={label}
      message={message}
      secondEnabled={secondEnabled}
      frontalZero={element.props.frontalZero !== false}
      showPersianNumber={element.props.showPersianNumber === true}
      value={displayedValue}
      onInput={commitCurrentValue}
      onChange={commitCurrentValue}
    />
  );
}

function timeRenderer(props: InitialValueEditorProps) {
  return <TimeInitialValueInput {...props} />;
}

function textareaRenderer({ element, label, message, onValueChange }: InitialValueEditorProps) {
  return (
    <JBTextarea
      name="elementInitialValue"
      label={label}
      message={message}
      value={typeof element.initialValue === "string" ? element.initialValue : ""}
      onInput={event => onValueChange(inputValue(event as unknown as Event) || undefined)}
    />
  );
}

function selectRenderer({ element, label, message, locale, defaultLocale, onValueChange }: InitialValueEditorProps) {
  const options = asSelectOptions(element.props.options);
  const value = element.initialValue;
  const selectValue = Array.isArray(value) ? value.filter((item): item is string => typeof item === "string") : typeof value === "string" ? value : null;
  return (
    <JBSelect<string | string[]>
      size="sm"
      popoverPosition="fixed"
      name="elementInitialValue"
      label={label}
      message={message}
      multiple={element.props.multiple === true}
      value={selectValue}
      hideClear
      onChange={event => onValueChange(event.target.value)}
    >
      {options.map(option => (
        <JBOption key={option.id} value={option.value}>
          {getLocalizedText(option.label, locale, defaultLocale)}
        </JBOption>
      ))}
    </JBSelect>
  );
}

function booleanRenderer({ element, label, message, locale, onValueChange }: InitialValueEditorProps) {
  const isFarsi = locale.toLowerCase().split("-")[0] === "fa";
  const value = typeof element.initialValue === "boolean" ? String(element.initialValue) : "unset";
  return (
    <JBSelect<string>
      size="sm"
      popoverPosition="fixed"
      name="elementInitialValue"
      label={label}
      message={message}
      value={value}
      hideClear
      onChange={event => onValueChange(event.target.value === "unset" ? undefined : event.target.value === "true")}
    >
      <JBOption value="unset">—</JBOption>
      <JBOption value="true">{isFarsi ? "بله" : "True"}</JBOption>
      <JBOption value="false">{isFarsi ? "خیر" : "False"}</JBOption>
    </JBSelect>
  );
}

/** Initial-value controls keyed by the field's runtime type. */
export const initialValueInputMap: Partial<Record<JBFormElementType, InitialValueRenderer>> = {
  "jb-input": textRenderer,
  "jb-number-input": numberRenderer,
  "jb-range-input": rangeRenderer,
  "jb-mobile-input": textRenderer,
  "jb-password-input": textRenderer,
  "jb-payment-input": textRenderer,
  "jb-national-input": textRenderer,
  "jb-date-input": dateRenderer,
  "jb-time-input": timeRenderer,
  "jb-pin-input": textRenderer,
  "jb-textarea": textareaRenderer,
  "jb-select": selectRenderer,
  "jb-listbox": selectRenderer,
  "jb-checkbox": booleanRenderer,
  "jb-switch": booleanRenderer,
};

export function InitialValueEditor(props: InitialValueEditorProps) {
  const Renderer = initialValueInputMap[props.entry.type] ?? textRenderer;
  return Renderer(props);
}
