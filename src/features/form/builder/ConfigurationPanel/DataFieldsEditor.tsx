import { observer } from "mobx-react-lite";
import { useRef } from "react";
import { JBInput } from "jb-input/react";
import { JBCollapse } from "jb-collapse/react";
import type { FormMessages } from "../../i18n/locale-adapter";
import { useBuilderStore } from "../store/BuilderStoreContext";
import { inputValue } from "./configuration-values";

interface DataFieldsEditorProps {
  messages: FormMessages;
}

export const DataFieldsEditor = observer(function DataFieldsEditor({ messages }: DataFieldsEditorProps) {
  const store = useBuilderStore();
  const element = store.selectedElement;
  const lastNonEmptyName = useRef<{ elementId: string; value: string } | null>(null);
  if (!element) return null;

  const nameError = store.getElementNameError(element.id);
  if (lastNonEmptyName.current?.elementId !== element.id) {
    lastNonEmptyName.current = { elementId: element.id, value: element.name };
  } else if (element.name !== "") {
    lastNonEmptyName.current.value = element.name;
  }

  return (
    <JBCollapse title={messages.dataSettings} defaultOpen={false}>
      <JBInput
        size="sm"
        id={`element-name-${element.id}`}
        name="elementName"
        label={messages.elementName}
        value={element.name}
        error={nameError === "required" ? messages.nameRequired : nameError === "invalid" ? messages.nameInvalid : undefined}
        aria-invalid={nameError !== null}
        onInput={event => store.updateSelectedElement({ name: inputValue(event as unknown as Event) })}
        onBlur={event => {
          if (inputValue(event as unknown as Event) === "" && lastNonEmptyName.current) {
            store.updateSelectedElement({ name: lastNonEmptyName.current.value });
          }
        }}
        message={messages.elementNameDescription}
      />
    </JBCollapse>
  );
});
