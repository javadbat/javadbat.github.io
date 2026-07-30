import type { FormValues, RuntimeJBForm } from "./types";

export function getRuntimeFormValues(form: RuntimeJBForm | null): FormValues {
  return form?.getFormValues() ?? {};
}

export function setRuntimeFormValues(form: RuntimeJBForm | null, values: FormValues): void {
  form?.setFormValues(values, false);
}

export function resetRuntimeForm(form: RuntimeJBForm | null): void {
  form?.reset();
}

export function checkRuntimeFormValidity(form: RuntimeJBForm | null, showError: boolean): boolean {
  if (!form) {
    return false;
  }
  return showError ? form.reportValidity() : form.checkValidity();
}

export async function checkRuntimeFormValidityAsync(form: RuntimeJBForm | null, showError: boolean): Promise<boolean> {
  if (!form) {
    return false;
  }
  // jb-form exposes richer asynchronous validation separately from the native
  // synchronous validity methods, so the host preserves both APIs.
  const result = await form.jbCheckValidity({ showError });
  return result.isAllValid;
}
