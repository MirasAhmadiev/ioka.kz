// tests/api/ioka.api.spec.ts
import { test, expect } from '@playwright/test';
import { installIokaMocks } from '../mocks/ioka.mock';
import { apiUrl, authHeaders } from '../../config/ioka.api.config';

test.beforeEach(async ({ context }) => {
  await installIokaMocks(context, 'mock');
});

test('GetAccount 200', async ({ page }) => {
  const { status, body } = await page.evaluate(async (input) => {
    const r = await fetch(input.url, { headers: input.headers });
    return { status: r.status, body: await r.json() };
  }, { url: apiUrl('/v2/accounts/acc_001'), headers: authHeaders });

  expect(status).toBe(200);
  expect(body.id).toBe('acc_001');
});

test.describe('unauthorized', () => {

  test.use({ extraHTTPHeaders: {} });

  test('GetAccount 401 без ключа', async ({ page }) => {
    const { status } = await page.evaluate(async (input) => {
      const r = await fetch(input.url);
      return { status: r.status };
    }, { url: apiUrl('/v2/accounts/acc_001') });

    expect(status).toBe(401);
  });
});

test('GetAccount 404', async ({ page }) => {
  const status = await page.evaluate(async (input) => {
    const r = await fetch(input.url, { headers: input.headers });
    return r.status;
  }, { url: apiUrl('/v2/accounts/missing'), headers: authHeaders });

  expect(status).toBe(404);
});
