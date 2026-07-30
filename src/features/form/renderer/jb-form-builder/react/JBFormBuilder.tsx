import { createElement, forwardRef, useCallback, useEffect, useRef, type HTMLAttributes, type MutableRefObject, type ReactElement, type Ref } from "react";
import type { JBFormDocumentV1 } from "../../../domain/form-document";
import { defineJBFormBuilder } from "../define";
import type { JBFormBuilderElement, JBFormBuilderEventMap } from "../types";

// React applications should not need a second registration import. The guarded
// function is harmless during server module evaluation and registers in the
// independently evaluated browser bundle.
defineJBFormBuilder();

type HostAttributes = Omit<HTMLAttributes<HTMLElement>, "children" | "onChange" | "onInput" | "onSubmit">;

export interface JBFormBuilderProps extends HostAttributes {
  formDocument: JBFormDocumentV1 | null;
  autoImport?: boolean;
  locale?: string | null;
  onReady?: (event: JBFormBuilderEventMap["ready"]) => void;
  onDocumentInvalid?: (event: JBFormBuilderEventMap["document-invalid"]) => void;
  onRenderError?: (event: JBFormBuilderEventMap["render-error"]) => void;
  onDependenciesRequired?: (event: JBFormBuilderEventMap["dependencies-required"]) => void;
  onInputValue?: (event: JBFormBuilderEventMap["input"]) => void;
  onChangeValue?: (event: JBFormBuilderEventMap["change"]) => void;
  onSubmitValue?: (event: JBFormBuilderEventMap["submit"]) => void;
  onResetValue?: (event: JBFormBuilderEventMap["reset"]) => void;
}

function assignRef(ref: Ref<JBFormBuilderElement>, value: JBFormBuilderElement | null): void {
  if (typeof ref === "function") {
    ref(value);
  } else if (ref) {
    (ref as MutableRefObject<JBFormBuilderElement | null>).current = value;
  }
}

export const JBFormBuilder = forwardRef<JBFormBuilderElement, JBFormBuilderProps>(function JBFormBuilder(
  {
    formDocument,
    autoImport = true,
    locale = null,
    onReady,
    onDocumentInvalid,
    onRenderError,
    onDependenciesRequired,
    onInputValue,
    onChangeValue,
    onSubmitValue,
    onResetValue,
    ...hostAttributes
  },
  forwardedRef,
): ReactElement {
  const hostRef = useRef<JBFormBuilderElement | null>(null);
  const callbackRef = useRef({
    onReady,
    onDocumentInvalid,
    onRenderError,
    onDependenciesRequired,
    onInputValue,
    onChangeValue,
    onSubmitValue,
    onResetValue,
  });
  // Keep one set of DOM listeners for the host lifetime while allowing React
  // callback props to change without detach/reattach churn on every render.
  callbackRef.current = {
    onReady,
    onDocumentInvalid,
    onRenderError,
    onDependenciesRequired,
    onInputValue,
    onChangeValue,
    onSubmitValue,
    onResetValue,
  };

  const setHostRef = useCallback(
    (element: JBFormBuilderElement | null) => {
      hostRef.current = element;
      assignRef(forwardedRef, element);
    },
    [forwardedRef],
  );

  useEffect(() => {
    const element = hostRef.current;
    if (!element) {
      return;
    }
    // Native custom events are bridged explicitly because React does not know
    // package-specific event names such as document-invalid.
    const listeners: Array<[string, EventListener]> = [
      ["ready", event => callbackRef.current.onReady?.(event as JBFormBuilderEventMap["ready"])],
      ["document-invalid", event => callbackRef.current.onDocumentInvalid?.(event as JBFormBuilderEventMap["document-invalid"])],
      ["render-error", event => callbackRef.current.onRenderError?.(event as JBFormBuilderEventMap["render-error"])],
      ["dependencies-required", event => callbackRef.current.onDependenciesRequired?.(event as JBFormBuilderEventMap["dependencies-required"])],
      ["input", event => callbackRef.current.onInputValue?.(event as JBFormBuilderEventMap["input"])],
      ["change", event => callbackRef.current.onChangeValue?.(event as JBFormBuilderEventMap["change"])],
      ["submit", event => callbackRef.current.onSubmitValue?.(event as JBFormBuilderEventMap["submit"])],
      ["reset", event => callbackRef.current.onResetValue?.(event as JBFormBuilderEventMap["reset"])],
    ];
    for (const [name, listener] of listeners) {
      element.addEventListener(name, listener);
    }
    return () => {
      for (const [name, listener] of listeners) {
        element.removeEventListener(name, listener);
      }
    };
  }, []);

  useEffect(() => {
    const element = hostRef.current;
    if (!element) {
      return;
    }
    // formDocument must be assigned as an object property; serializing it into
    // JSX attributes would lose types and create escaping/size problems.
    element.autoImport = autoImport;
    element.locale = locale;
    element.formDocument = formDocument;
  }, [autoImport, formDocument, locale]);

  return createElement("jb-form-builder", {
    ...hostAttributes,
    ref: setHostRef,
    "auto-import": String(autoImport),
    locale: locale ?? undefined,
  });
});
