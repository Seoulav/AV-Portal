import { defineConfig, devices } from '@playwright/test';
export default defineConfig({
 testDir:'./tests/e2e', fullyParallel:true, workers:2, forbidOnly:!!process.env.CI, reporter:'list',
 use:{baseURL:'http://127.0.0.1:4188/AV-Portal/cpq/',trace:'retain-on-failure'},
 webServer:{command:'node ../scripts/serve-portal.mjs',url:'http://127.0.0.1:4188/AV-Portal/cpq/',reuseExistingServer:!process.env.CI},
 projects:[{name:'portal-chromium',use:{...devices['Desktop Chrome']}}],
});
