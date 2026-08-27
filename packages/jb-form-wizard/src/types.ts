export type JBFormWizardValidationMode = "current" | "none";

export interface JBFormWizardChangeDetail {
  previousStep: number;
  activeStep: number;
  direction: "next" | "previous" | "programmatic";
}

export interface JBFormWizardBeforeChangeDetail extends JBFormWizardChangeDetail {}

export interface JBFormWizardCompleteDetail {
  activeStep: number;
  stepCount: number;
}

export type JBFormWizardChangeEvent = CustomEvent<JBFormWizardChangeDetail>;
export type JBFormWizardBeforeChangeEvent = CustomEvent<JBFormWizardBeforeChangeDetail>;
export type JBFormWizardCompleteEvent = CustomEvent<JBFormWizardCompleteDetail>;
