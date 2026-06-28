// @ts-check
import { defineConfig } from 'astro/config';
import react from '@astrojs/react';

// https://astro.build/config
export default defineConfig({
  integrations: [react()],
  server:{
    open:true,
    port:8080,
  },
  vite: {
  },
  site: 'https://javadbat.github.io',
});
