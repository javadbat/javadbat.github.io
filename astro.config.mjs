// @ts-check
import { defineConfig } from 'astro/config';
import react from '@astrojs/react';

// https://astro.build/config
export default defineConfig({
  integrations: [react({
    babel: {
      plugins: [
        [
          "babel-plugin-styled-components",
          {
            "ssr": true,
            displayName: true,
          }
        ]
      ]
    },
  })],
  server:{
    open:true,
    port:8080,
  },
  vite: {
    ssr: {
      noExternal: ['styled-components']
    }
  }
});