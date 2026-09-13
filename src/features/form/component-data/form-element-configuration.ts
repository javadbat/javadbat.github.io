import type { JBFormElementType } from "jb-form-builder/contract";
import type { FormElementConfiguration } from "./configuration-helpers";
import { componentConfiguration as textConfiguration } from "./text/configuration";
import { componentConfiguration as imageConfiguration } from "./image/configuration";
import { componentConfiguration as voiceConfiguration } from "./voice/configuration";
import { componentConfiguration as linkConfiguration } from "./link/configuration";
import { componentConfiguration as dividerConfiguration } from "./divider/configuration";
import { componentConfiguration as sectionheadingConfiguration } from "./section-heading/configuration";
import { componentConfiguration as jbinputConfiguration } from "./jb-input/configuration";
import { componentConfiguration as jbnumberinputConfiguration } from "./jb-number-input/configuration";
import { componentConfiguration as jbrangeinputConfiguration } from "./jb-range-input/configuration";
import { componentConfiguration as jbmobileinputConfiguration } from "./jb-mobile-input/configuration";
import { componentConfiguration as jbpasswordinputConfiguration } from "./jb-password-input/configuration";
import { componentConfiguration as jbpaymentinputConfiguration } from "./jb-payment-input/configuration";
import { componentConfiguration as jbnationalinputConfiguration } from "./jb-national-input/configuration";
import { componentConfiguration as jbdateinputConfiguration } from "./jb-date-input/configuration";
import { componentConfiguration as jbtimeinputConfiguration } from "./jb-time-input/configuration";
import { componentConfiguration as jbpininputConfiguration } from "./jb-pin-input/configuration";
import { componentConfiguration as jbtextareaConfiguration } from "./jb-textarea/configuration";
import { componentConfiguration as jbselectConfiguration } from "./jb-select/configuration";
import { componentConfiguration as jblistboxConfiguration } from "./jb-listbox/configuration";
import { componentConfiguration as jbcheckboxConfiguration } from "./jb-checkbox/configuration";
import { componentConfiguration as jbswitchConfiguration } from "./jb-switch/configuration";
import { componentConfiguration as jbfileinputConfiguration } from "./jb-file-input/configuration";
import { componentConfiguration as jbimageinputConfiguration } from "./jb-image-input/configuration";
import { componentConfiguration as jbbuttonConfiguration } from "./jb-button/configuration";
import { componentConfiguration as jbtabConfiguration } from "./jb-tab/configuration";
import { componentConfiguration as jbconditionConfiguration } from "./jb-condition/configuration";
import { componentConfiguration as jbformwizardConfiguration } from "./jb-form-wizard/configuration";
import { componentConfiguration as jbrepeatablegroupConfiguration } from "./jb-repeatable-group/configuration";

export * from "./configuration-helpers";

export const configurationByType: Record<JBFormElementType, FormElementConfiguration> = {
  "text": textConfiguration,
  "image": imageConfiguration,
  "voice": voiceConfiguration,
  "link": linkConfiguration,
  "divider": dividerConfiguration,
  "section-heading": sectionheadingConfiguration,
  "jb-input": jbinputConfiguration,
  "jb-number-input": jbnumberinputConfiguration,
  "jb-range-input": jbrangeinputConfiguration,
  "jb-mobile-input": jbmobileinputConfiguration,
  "jb-password-input": jbpasswordinputConfiguration,
  "jb-payment-input": jbpaymentinputConfiguration,
  "jb-national-input": jbnationalinputConfiguration,
  "jb-date-input": jbdateinputConfiguration,
  "jb-time-input": jbtimeinputConfiguration,
  "jb-pin-input": jbpininputConfiguration,
  "jb-textarea": jbtextareaConfiguration,
  "jb-select": jbselectConfiguration,
  "jb-listbox": jblistboxConfiguration,
  "jb-checkbox": jbcheckboxConfiguration,
  "jb-switch": jbswitchConfiguration,
  "jb-file-input": jbfileinputConfiguration,
  "jb-image-input": jbimageinputConfiguration,
  "jb-button": jbbuttonConfiguration,
  "jb-tab": jbtabConfiguration,
  "jb-condition": jbconditionConfiguration,
  "jb-form-wizard": jbformwizardConfiguration,
  "jb-repeatable-group": jbrepeatablegroupConfiguration,
};

