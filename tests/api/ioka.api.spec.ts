import { test, expect } from '@playwright/test';
import { installIokaMocks } from '../mocks/ioka.mock';

test.beforeEach(async ({ context }) => {
  await installIokaMocks(context, 'mock'); // для кейсов, где используем текущий контекст
});

test('GetAccount 200', async ({ page }) => {
  const { status, body } = await page.evaluate(async () => {
    const r = await fetch('https://api.ioka.kz/v2/accounts/acc_001', {
      headers: { 'API-KEY': 'test_key' },
    });
    return { status: r.status, body: await r.json() };
  });
  expect(status).toBe(200);
  expect(body.id).toBe('acc_001');
});

test('GetAccount 401 без ключа', async ({ browser }) => {
  // создаём чистый контекст БЕЗ глобальных заголовков из конфига
  const ctx = await browser.newContext({
    extraHTTPHeaders: {},   // <- важно: переопределяем
  });

  await installIokaMocks(ctx, 'mock');        // моки именно на этот контекст
  const page = await ctx.newPage();

  const status = await page.evaluate(async () => {
    const r = await fetch('https://api.ioka.kz/v2/accounts/acc_001'); // без headers
    return r.status;
  });

  expect(status).toBe(401);   // <- assert до закрытия контекста
  await ctx.close();
});


test('GetAccount 404', async ({ page }) => {
  const status = await page.evaluate(async () => {
    const r = await fetch('https://api.ioka.kz/v2/accounts/missing', {
      headers: { 'API-KEY': 'test_key' },
    });
    return r.status;
  });
  expect(status).toBe(404);
});
