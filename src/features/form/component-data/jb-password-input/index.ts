import { catalogData } from "./catalog";
import { componentConfiguration } from "./configuration";
import { componentThemeTokens } from "./theme-tokens";
import { adapterData } from "./adapter";

export { catalogData } from "./catalog";
export { componentConfiguration } from "./configuration";
export { adapterData } from "./adapter";

/** Complete data owned by this component folder. */
export const componentData = { ...catalogData, ...componentConfiguration, ...adapterData, componentThemeTokens } as const;
export { componentThemeTokens };
