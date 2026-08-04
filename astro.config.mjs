// @ts-check
import { defineConfig } from "astro/config";
import react from "@astrojs/react";

// The preview renderer discovers its field packages only after a saved form
// has been resolved from IndexedDB. Vite's initial crawl therefore cannot see
// these literal dynamic imports on routes that do not yet have a document.
//
// Pre-optimizing the complete auto-import inventory in development prevents
// Vite from rebuilding its dependency cache once per newly discovered field.
// Those rebuilds invalidate hashes used by imports already in flight and
// surface as HTTP 504 "Outdated Optimize Dep" failures in the preview.
const formRendererAutoImports = [
  "jb-core/i18n",
  "jb-form",
  "jb-input",
  "jb-number-input",
  "jb-mobile-input",
  "jb-password-input",
  "jb-payment-input",
  "jb-national-input",
  "jb-date-input",
  "jb-time-input",
  "jb-pin-input",
  "jb-textarea",
  "jb-select",
  "jb-checkbox",
  "jb-switch",
  "jb-file-input",
  "jb-image-input",
  "jb-button",
];

// The export dialog is lazy-loaded to keep its highlighter out of the normal
// editing bundle. Include its dependencies here so the first Export JSON click
// does not make Vite rebuild the optimization cache and invalidate the dialog's
// in-flight module request.
const formBuilderExportImports = ["@mantine/code-highlight", "@mantine/core", "shiki"];

// https://astro.build/config
export default defineConfig({
  integrations: [react()],
  server: {
    open: true,
    port: 8080,
  },
  vite: {
    optimizeDeps: {
      include: [...formRendererAutoImports, ...formBuilderExportImports],
    },
  },
  site: "https://javadbat.github.io",
});
