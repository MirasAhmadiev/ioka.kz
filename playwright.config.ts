import { defineConfig, devices } from '@playwright/test';

/**
 * Read environment variables from file.
 * https://github.com/motdotla/dotenv
 */
// import dotenv from 'dotenv';
// import path from 'path';
// dotenv.config({ path: path.resolve(__dirname, '.env') });

/**
 * See https://playwright.dev/docs/test-configuration.
 */
const env = (k: string, def: string) => {
  const v = process.env[k]?.trim();
  return v ? v : def;
};

const UI_BASE_URL  = env('UI_BASE_URL',  'https://ioka.kz/ru');   // не пустая!
const API_BASE_URL = env('API_BASE_URL', 'https://api.ioka.kz');
const API_KEY      = env('API_KEY',      'test_key');

export default defineConfig({
  testDir: './tests',
  /* Run tests in files in parallel */
  fullyParallel: true,
  /* Fail the build on CI if you accidentally left test.only in the source code. */
  forbidOnly: !!process.env.CI,
  /* Retry on CI only */
  retries: 0,
  timeout: 30_000,
  /* Opt out of parallel tests on CI. */
  workers: process.env.CI ? 1 : undefined,
  /* Reporter to use. See https://playwright.dev/docs/test-reporters */
  reporter: [
    ['list'],
    ['html', { open: 'on-failure' }],
    ['allure-playwright', {
      detail: true,                   // показывать шаги test.step
      suiteTitle: false,
      resultsDir: 'allure-results',   // куда копится сырьё для отчёта
    }],
  ],
  /* Shared settings for all the projects below. See https://playwright.dev/docs/api/class-testoptions. */
  use: {
      baseURL: UI_BASE_URL,
      screenshot: 'only-on-failure',
      video: 'on',
      trace: 'retain-on-failure',
    },

    projects: [
      {
        name: 'ui',
        testDir: 'tests/ui',
        use: { browserName: 'chromium' },
      },
      {
        name: 'api',
        testDir: 'tests/api',
        retries: 0,   
        use: {
          baseURL: API_BASE_URL,
          extraHTTPHeaders: { 'API-KEY': API_KEY },
          trace: 'off',             
          video: 'off',
        },
      },
  /*
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },

    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
    },

    /* Test against mobile viewports. */
    // {
    //   name: 'Mobile Chrome',
    //   use: { ...devices['Pixel 5'] },
    // },
    // {
    //   name: 'Mobile Safari',
    //   use: { ...devices['iPhone 12'] },
    // },

    /* Test against branded browsers. */
    // {
    //   name: 'Microsoft Edge',
    //   use: { ...devices['Desktop Edge'], channel: 'msedge' },
    // },
    // {
    //   name: 'Google Chrome',
    //   use: { ...devices['Desktop Chrome'], channel: 'chrome' },
    // },
  ],

  /* Run your local dev server before starting the tests */
  // webServer: {
  //   command: 'npm run start',
  //   url: 'http://localhost:3000',
  //   reuseExistingServer: !process.env.CI,
  // },
});
