export { defineJBFormBuilder, JB_FORM_BUILDER_TAG_NAME } from "./define";
export { JBFormBuilderWebComponent } from "./jb-form-builder";
export { loadDependencies } from "./dependency-loader";
export { canonicalizeThemeConfig, validateThemeConfig } from "./contract/theme-config";
export type { ThemeConfigV1, ThemeConfigIssue, ThemeConfigValidationResult } from "./contract/theme-config";
export type {
  DependencyFailure,
  DependencyLoader,
  DependencyLoadResult,
  FormValues,
  JBFormBuilderElement,
  JBFormBuilderEventMap,
  RendererDependenciesDetail,
  RendererDependency,
  RendererActionDetail,
  RendererIssuesDetail,
  RendererReadyDetail,
  RendererState,
  RendererValueDetail,
  RuntimeJBForm,
} from "./types";

import { defineJBFormBuilder } from "./define";

// The default web-component entry is zero-configuration in browsers. The
// guarded define function is a no-op when this module is evaluated by tooling
// without DOM globals.
defineJBFormBuilder();
