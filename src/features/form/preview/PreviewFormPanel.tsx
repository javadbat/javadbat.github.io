import { lazy, Suspense, useCallback, useEffect, useRef, useState } from "react";
import { JBButton } from "jb-button/react";
import type { JBFormDocumentV1 } from "../domain/form-document";
import type { FormMessages } from "../i18n/locale-adapter";
import { JBFormBuilder } from "jb-form-builder/react";
import { loadDependencies } from "jb-form-builder/dependency-loader";
import type { FormValues, JBFormBuilderElement, JBFormBuilderEventMap } from "jb-form-builder/types";
import { ModalLoadingFallback } from "../shell/ModalLoadingFallback";
import styles from "../shell/RouteShell.module.css";

const FormResultModal = lazy(() => import("./FormResultModal").then(module => ({ default: module.FormResultModal })));

const RESULT_MODAL_EXIT_DURATION_MS = 300;

type ValidationState = "preparing" | "idle" | "validating" | "valid" | "invalid" | "error";

interface PreviewFormPanelProps {
  document: JBFormDocumentV1;
  locale: string;
  accessibleName: string;
  messages: FormMessages;
}

/**
 * Preview-only actions live beside the renderer instead of inside it. This
 * keeps <jb-form-builder> framework-independent and lets any host application
 * choose its own validation and reset controls.
 */
export function PreviewFormPanel({ document, locale, accessibleName, messages }: PreviewFormPanelProps) {
  const rendererRef = useRef<JBFormBuilderElement | null>(null);
  const [validationState, setValidationState] = useState<ValidationState>("preparing");
  const [submittedValues, setSubmittedValues] = useState<FormValues | null>(null);
  const [resultModalOpen, setResultModalOpen] = useState(false);

  const showSubmittedValues = useCallback((values: FormValues) => {
    setValidationState("valid");
    setSubmittedValues(values);
    setResultModalOpen(true);
  }, []);

  const closeResultModal = useCallback(() => setResultModalOpen(false), []);

  useEffect(() => {
    if (resultModalOpen || submittedValues === null) return;
    const cleanupTimer = window.setTimeout(
      () => setSubmittedValues(null),
      RESULT_MODAL_EXIT_DURATION_MS,
    );
    return () => window.clearTimeout(cleanupTimer);
  }, [resultModalOpen, submittedValues]);

  const submit = useCallback(async () => {
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
      const result = await renderer.form?.jbCheckValidity({ showError: true });
      if (!result) {
        setValidationState("error");
        return;
      }

      if (result.isAllValid) {
        showSubmittedValues(renderer.getFormValues());
      } else {
        setValidationState("invalid");
        const { getInvalidElements } = await import("jb-form");
        const [firstInvalidElement] = getInvalidElements(result);
        firstInvalidElement?.scrollIntoView({ behavior: "smooth", block: "center" });
      }
    } catch {
      setValidationState("error");
    }
  }, [showSubmittedValues]);

  const handleRendererSubmit = useCallback((event: JBFormBuilderEventMap["submit"]) => {
    showSubmittedValues(event.detail.value);
  }, [showSubmittedValues]);

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
        locale={locale}
        aria-label={accessibleName}
        loadDependencies={loadDependencies}
        onReady={() => setValidationState("idle")}
        onDocumentInvalid={() => setValidationState("error")}
        onRenderError={() => setValidationState("error")}
        onSubmitValue={handleRendererSubmit}
      />
      <footer className={styles.previewActions}>
        <div className={styles.previewActionButtons}>
          <JBButton color="primary" disabled={controlsDisabled} onClick={() => void submit()}>
            {messages.submitForm}
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
      {resultModalOpen && submittedValues ? (
        <Suspense fallback={<ModalLoadingFallback label={messages.loadingModal} />}>
          <FormResultModal messages={messages} values={submittedValues} onClose={closeResultModal} />
        </Suspense>
      ) : null}
    </section>
  );
}
