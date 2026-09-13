export * from "./form-element-registry";
export * from "./form-element-adapter";
export * from "./form-element-configuration";
export * from "./theme-tokens";
import { formElementRegistry } from "./form-element-registry";

import { componentData as textData } from "./text";
import { componentData as imageData } from "./image";
import { componentData as voiceData } from "./voice";
import { componentData as linkData } from "./link";
import { componentData as dividerData } from "./divider";
import { componentData as sectionHeadingData } from "./section-heading";
import { componentData as inputData } from "./jb-input";
import { componentData as numberInputData } from "./jb-number-input";
import { componentData as rangeInputData } from "./jb-range-input";
import { componentData as mobileInputData } from "./jb-mobile-input";
import { componentData as passwordInputData } from "./jb-password-input";
import { componentData as paymentInputData } from "./jb-payment-input";
import { componentData as nationalInputData } from "./jb-national-input";
import { componentData as dateInputData } from "./jb-date-input";
import { componentData as timeInputData } from "./jb-time-input";
import { componentData as pinInputData } from "./jb-pin-input";
import { componentData as textareaData } from "./jb-textarea";
import { componentData as selectData } from "./jb-select";
import { componentData as listboxData } from "./jb-listbox";
import { componentData as checkboxData } from "./jb-checkbox";
import { componentData as switchData } from "./jb-switch";
import { componentData as fileInputData } from "./jb-file-input";
import { componentData as imageInputData } from "./jb-image-input";
import { componentData as buttonData } from "./jb-button";
import { componentData as tabData } from "./jb-tab";
import { componentData as conditionData } from "./jb-condition";
import { componentData as formWizardData } from "./jb-form-wizard";
import { componentData as repeatableGroupData } from "./jb-repeatable-group";

export {
  textData, imageData, voiceData, linkData, dividerData, sectionHeadingData,
  inputData, numberInputData, rangeInputData, mobileInputData, passwordInputData,
  paymentInputData, nationalInputData, dateInputData, timeInputData, pinInputData,
  textareaData, selectData, listboxData, checkboxData, switchData, fileInputData,
  imageInputData, buttonData, tabData, conditionData, formWizardData, repeatableGroupData,
};

export const supportedComponentTypes = [
  "text", "image", "voice", "link", "divider", "section-heading",
  "jb-input", "jb-number-input", "jb-range-input", "jb-mobile-input", "jb-password-input",
  "jb-payment-input", "jb-national-input", "jb-date-input", "jb-time-input", "jb-pin-input",
  "jb-textarea", "jb-select", "jb-listbox", "jb-checkbox", "jb-switch", "jb-file-input",
  "jb-image-input", "jb-button", "jb-tab", "jb-condition", "jb-form-wizard", "jb-repeatable-group",
] as const;

export type ComponentData = import("./form-element-registry").FormElementRegistryEntry;
export const supportedComponentData = formElementRegistry;

export const componentDataByType = new Map(supportedComponentData.map(component => [component.type, component]));
