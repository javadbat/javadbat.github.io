import { resolve } from "node:path";
import { defineConfig } from "vite";

const entry = {
  index: resolve(import.meta.dirname, "src/index.ts"),
  define: resolve(import.meta.dirname, "src/define.ts"),
  react: resolve(import.meta.dirname, "src/react/index.ts"),
  "dependency-loader": resolve(import.meta.dirname, "src/dependency-loader.ts"),
  types: resolve(import.meta.dirname, "src/types.ts"),
  contract: resolve(import.meta.dirname, "src/contract/index.ts"),
  "form-document-validation": resolve(import.meta.dirname, "src/contract/form-document-validation.ts"),
  "form-element-adapter": resolve(import.meta.dirname, "src/registry/form-element-adapter.ts"),
  "form-element-configuration": resolve(import.meta.dirname, "src/registry/form-element-configuration.ts"),
  "form-element-registry": resolve(import.meta.dirname, "src/registry/form-element-registry.ts"),
  "validation-rule-registry": resolve(import.meta.dirname, "src/registry/validation-rule-registry.ts"),
};

export default defineConfig({
  build: {
    lib: { entry, formats: ["es"] },
    rollupOptions: {
      external: id => !id.startsWith(".") && !id.startsWith("/") && !/^[A-Za-z]:[\\/]/.test(id),
      output: { entryFileNames: "[name].js" },
    },
  },
});
