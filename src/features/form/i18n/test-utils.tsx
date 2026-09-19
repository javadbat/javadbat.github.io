import { render, type RenderOptions } from "@testing-library/react";
import type { ReactElement } from "react";
import { I18nextProvider } from "react-i18next";
import { formI18n } from "./i18n";

export function renderForm(ui: ReactElement, options?: RenderOptions) {
  return render(<I18nextProvider i18n={formI18n}>{ui}</I18nextProvider>, options);
}
