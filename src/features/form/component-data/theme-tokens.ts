import { componentThemeTokens as jb_buttonThemeTokens } from "./jb-button/theme-tokens";
import { componentThemeTokens as jb_checkboxThemeTokens } from "./jb-checkbox/theme-tokens";
import { componentThemeTokens as jb_date_inputThemeTokens } from "./jb-date-input/theme-tokens";
import { componentThemeTokens as jb_file_inputThemeTokens } from "./jb-file-input/theme-tokens";
import { componentThemeTokens as jb_image_inputThemeTokens } from "./jb-image-input/theme-tokens";
import { componentThemeTokens as jb_inputThemeTokens } from "./jb-input/theme-tokens";
import { componentThemeTokens as jb_listboxThemeTokens } from "./jb-listbox/theme-tokens";
import { componentThemeTokens as jb_mobile_inputThemeTokens } from "./jb-mobile-input/theme-tokens";
import { componentThemeTokens as jb_national_inputThemeTokens } from "./jb-national-input/theme-tokens";
import { componentThemeTokens as jb_number_inputThemeTokens } from "./jb-number-input/theme-tokens";
import { componentThemeTokens as jb_password_inputThemeTokens } from "./jb-password-input/theme-tokens";
import { componentThemeTokens as jb_payment_inputThemeTokens } from "./jb-payment-input/theme-tokens";
import { componentThemeTokens as jb_pin_inputThemeTokens } from "./jb-pin-input/theme-tokens";
import { componentThemeTokens as jb_range_inputThemeTokens } from "./jb-range-input/theme-tokens";
import { componentThemeTokens as jb_selectThemeTokens } from "./jb-select/theme-tokens";
import { componentThemeTokens as jb_switchThemeTokens } from "./jb-switch/theme-tokens";
import { componentThemeTokens as jb_tabThemeTokens } from "./jb-tab/theme-tokens";
import { componentThemeTokens as jb_textareaThemeTokens } from "./jb-textarea/theme-tokens";
import { componentThemeTokens as jb_time_inputThemeTokens } from "./jb-time-input/theme-tokens";

/** Components that expose editable CSS tokens in the form designer. */
export const THEME_COMPONENT_TAGS = [
  "jb-button",
  "jb-checkbox",
  "jb-date-input",
  "jb-file-input",
  "jb-image-input",
  "jb-input",
  "jb-listbox",
  "jb-mobile-input",
  "jb-national-input",
  "jb-number-input",
  "jb-password-input",
  "jb-payment-input",
  "jb-pin-input",
  "jb-range-input",
  "jb-select",
  "jb-switch",
  "jb-tab",
  "jb-textarea",
  "jb-time-input",
] as const;

export type ThemeComponentTag = typeof THEME_COMPONENT_TAGS[number];

/** Component token data aggregated from each component folder. */
export const COMPONENT_THEME_TOKENS = {
  "jb-button": jb_buttonThemeTokens,
  "jb-checkbox": jb_checkboxThemeTokens,
  "jb-date-input": jb_date_inputThemeTokens,
  "jb-file-input": jb_file_inputThemeTokens,
  "jb-image-input": jb_image_inputThemeTokens,
  "jb-input": jb_inputThemeTokens,
  "jb-listbox": jb_listboxThemeTokens,
  "jb-mobile-input": jb_mobile_inputThemeTokens,
  "jb-national-input": jb_national_inputThemeTokens,
  "jb-number-input": jb_number_inputThemeTokens,
  "jb-password-input": jb_password_inputThemeTokens,
  "jb-payment-input": jb_payment_inputThemeTokens,
  "jb-pin-input": jb_pin_inputThemeTokens,
  "jb-range-input": jb_range_inputThemeTokens,
  "jb-select": jb_selectThemeTokens,
  "jb-switch": jb_switchThemeTokens,
  "jb-tab": jb_tabThemeTokens,
  "jb-textarea": jb_textareaThemeTokens,
  "jb-time-input": jb_time_inputThemeTokens,
} as const;

const inheritedInputTokenTags = new Set<ThemeComponentTag>([
  "jb-date-input",
  "jb-file-input",
  "jb-image-input",
  "jb-mobile-input",
  "jb-national-input",
  "jb-number-input",
  "jb-password-input",
  "jb-payment-input",
  "jb-pin-input",
  "jb-time-input",
]);

export function getSupportedThemeComponentTokens(tagName: ThemeComponentTag): readonly string[] {
  return [...new Set([
    ...COMPONENT_THEME_TOKENS[tagName],
    ...(inheritedInputTokenTags.has(tagName) ? COMPONENT_THEME_TOKENS["jb-input"] : []),
    ...(tagName === "jb-image-input" ? COMPONENT_THEME_TOKENS["jb-file-input"] : []),
  ])].sort((left, right) => left.localeCompare(right));
}
