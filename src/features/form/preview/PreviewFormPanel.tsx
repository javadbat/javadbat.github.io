import { useCallback, useRef, useState } from "react";
import { JBButton } from "jb-button/react";
import type { JBFormDocumentV1 } from "../domain/form-document";
import type { FormMessages } from "../i18n/locale-adapter";
import { JBFormBuilder } from "../renderer/jb-form-builder/react";
import type { JBFormBuilderElement } from "../renderer/jb-form-builder/types";
import styles from "../shell/RouteShell.module.css";

type ValidationState = "preparing" | "idle" | "validating" | "valid" | "invalid" | "error";

interface PreviewFormPanelProps {
  document: JBFormDocumentV1;
  accessibleName: string;
  messages: FormMessages;
}

/**
 * Preview-only actions live beside the renderer instead of inside it. This
 * keeps <jb-form-builder> framework-independent and lets any host application
 * choose its own validation and reset controls.
 */
export function PreviewFormPanel({ document, accessibleName, messages }: PreviewFormPanelProps) {
  const rendererRef = useRef<JBFormBuilderElement | null>(null);
  const [validationState, setValidationState] = useState<ValidationState>("preparing");

  const validate = useCallback(async () => {
    const renderer = rendererRef.current;
    if (!renderer) {
      return;
    }

    setValidationState("validating");
    try {
      // A document assignment may still be importing custom elements. Waiting
      // for this public boundary prevents an early validity check from treating
      // a not-yet-created jb-form as valid.
      await renderer.updateComplete;
      // reportValidity() is the native-style path that asks every JB field to
      // expose its own error UI. Keep the async check as a second boundary so
      // this control will also cover asynchronous rules when they are added.
      const isSynchronouslyValid = renderer.reportValidity();
      const isAsynchronouslyValid = await renderer.checkValidityAsync(true);
      setValidationState(isSynchronouslyValid && isAsynchronouslyValid ? "valid" : "invalid");
    } catch {
      setValidationState("error");
    }
  }, []);

  const reset = useCallback(() => {
    rendererRef.current?.reset();
    setValidationState("idle");
  }, []);

  const statusMessage =
    validationState === "preparing"
      ? messages.formPreparing
      : validationState === "validating"
        ? messages.validatingForm
        : validationState === "valid"
          ? messages.formIsValid
          : validationState === "invalid"
            ? messages.formHasErrors
            : validationState === "error"
              ? messages.validationFailed
              : messages.validationReady;

  const controlsDisabled = validationState === "preparing" || validationState === "validating";

  return (
    <section className={styles.rendererSurface} aria-label={accessibleName}>
      <JBFormBuilder
        ref={rendererRef}
        formDocument={document}
        locale={document.localization.defaultLocale}
        autoImport
        onReady={() => setValidationState("idle")}
        onDocumentInvalid={() => setValidationState("error")}
        onRenderError={() => setValidationState("error")}
      />
      <footer className={styles.previewActions}>
        <div className={styles.previewActionButtons}>
          <JBButton color="primary" disabled={controlsDisabled} onClick={() => void validate()}>
            {messages.validateForm}
          </JBButton>
          <JBButton variant="outline" disabled={controlsDisabled} onClick={reset}>
            {messages.resetForm}
          </JBButton>
        </div>
        <p className={`${styles.validationStatus} ${styles[`validationStatus_${validationState}`]}`} aria-live="polite" aria-atomic="true">
          <span aria-hidden="true" />
          {statusMessage}
        </p>
      </footer>
    </section>
  );
}
