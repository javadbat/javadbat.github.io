import { createElement, forwardRef, useEffect, useImperativeHandle, useRef, type PropsWithChildren, type ReactElement } from "react";
import { type JBElementStandardProps, useEvent } from "jb-core/react";
import type { JBFormDocumentV1 } from "../contract/form-document";
import { defineJBFormBuilder } from "../define";
import type { DependencyLoader, JBFormBuilderElement, JBFormBuilderEventMap } from "../types";

// React applications should not need a second registration import. The guarded
// function is harmless during server module evaluation and registers in the
// independently evaluated browser bundle.
defineJBFormBuilder();

interface JBFormBuilderOwnProps {
  formDocument: JBFormDocumentV1 | null;
  loadDependencies?: DependencyLoader | null;
  locale?: string | null;
  onReady?: (event: JBFormBuilderEventMap["ready"]) => void;
  onDocumentInvalid?: (event: JBFormBuilderEventMap["document-invalid"]) => void;
  onRenderError?: (event: JBFormBuilderEventMap["render-error"]) => void;
  onDependenciesRequired?: (event: JBFormBuilderEventMap["dependencies-required"]) => void;
  onInputValue?: (event: JBFormBuilderEventMap["input"]) => void;
  onChangeValue?: (event: JBFormBuilderEventMap["change"]) => void;
  onAction?: (event: JBFormBuilderEventMap["action"]) => void;
  onResetValue?: (event: JBFormBuilderEventMap["reset"]) => void;
  onSubmitValue?: (event: JBFormBuilderEventMap["submit"]) => void;
}

export type JBFormBuilderProps = PropsWithChildren<JBFormBuilderOwnProps> &
  Omit<JBElementStandardProps<JBFormBuilderElement>, keyof JBFormBuilderOwnProps | "children" | "onChange" | "onInput" | "onSubmit">;

export const JBFormBuilder = forwardRef<JBFormBuilderElement, JBFormBuilderProps>(function JBFormBuilder(
  {
    formDocument,
    loadDependencies = null,
    locale = null,
    onReady,
    onDocumentInvalid,
    onRenderError,
    onDependenciesRequired,
    onInputValue,
    onChangeValue,
    onAction,
    onResetValue,
    onSubmitValue,
    ...hostAttributes
  },
  forwardedRef,
): ReactElement {
  const element = useRef<JBFormBuilderElement | null>(null);

  useImperativeHandle(forwardedRef, () => element.current as JBFormBuilderElement, [element]);

  useEvent(element, "ready", onReady);
  useEvent(element, "document-invalid", onDocumentInvalid);
  useEvent(element, "render-error", onRenderError);
  useEvent(element, "dependencies-required", onDependenciesRequired);
  useEvent(element, "input", onInputValue);
  useEvent(element, "change", onChangeValue);
  useEvent(element, "action", onAction);
  useEvent(element, "reset", onResetValue);
  useEvent(element, "submit", onSubmitValue);

  useEffect(() => {
    const currentElement = element.current;
    if (!currentElement) {
      return;
    }
    // formDocument must be assigned as an object property; serializing it into
    // JSX attributes would lose types and create escaping/size problems.
    currentElement.loadDependencies = loadDependencies;
    currentElement.locale = locale;
    currentElement.formDocument = formDocument;
  }, [formDocument, loadDependencies, locale]);

  return createElement("jb-form-builder", {
    ...hostAttributes,
    ref: element,
    locale: locale ?? undefined,
  });
});
