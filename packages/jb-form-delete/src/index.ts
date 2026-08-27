export { JBFormDeleteWebComponent, defineJBFormDelete, JB_FORM_DELETE_TAG_NAME } from "./jb-form-delete.js";
export interface JBFormDeleteRequestDetail { formId: string; }
export type JBFormDeleteRequestEvent = CustomEvent<JBFormDeleteRequestDetail>;
