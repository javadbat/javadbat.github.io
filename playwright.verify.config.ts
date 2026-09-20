import { defineConfig } from '@playwright/test';
import base from './playwright.config';
export default defineConfig({ ...base, webServer: undefined, workers: 1, projects: [{ name: 'edge', use: { browserName: 'chromium', channel: 'msedge' } }] });