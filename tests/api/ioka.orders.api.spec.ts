import { test, expect } from '@playwright/test';
import { installIokaOrdersMocks } from '../mocks/ioka.orders.mock';
import { apiUrl, authHeaders } from '../../config/ioka.api.config';

// Тип результата из evaluate
type FetchResult<T = any> = { status: number; body: T; elapsedMs: number };

// Один сериализуемый аргумент
type EvalInput = {
  url: string;
  headers?: Record<string, string>;
  payload?: unknown;
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE';
};

test.describe('Ioka API - Orders & Payments', () => {
  test.beforeEach(async ({ context }) => {
    await installIokaOrdersMocks(context, 'mock');
  });

  test('CreateOrder: 201 + JSON schema + <=500ms', async ({ page }) => {
    const { status, body, elapsedMs } = await page.evaluate<FetchResult, EvalInput>((input) => {
      const t0 = performance.now();
      return fetch(input.url, {
        method: input.method ?? 'POST',
        headers: input.headers,
        body: JSON.stringify(input.payload ?? {}),
      }).then(async (r) => {
        const t1 = performance.now();
        return { status: r.status, body: await r.json(), elapsedMs: t1 - t0 };
      });
    }, {
      url: apiUrl('/v2/orders'),
      headers: authHeaders,
      payload: { amount: 100, currency: 'KZT', capture_method: 'AUTO', description: 'Book #23' },
      method: 'POST',
    });

    expect(status).toBe(201);
    expect(elapsedMs).toBeLessThanOrEqual(500);
    expect(body).toHaveProperty('order');
    expect(body).toHaveProperty('order_access_token');

    const order = (body as any).order;
    expect(order).toEqual(expect.objectContaining({
      id: expect.any(String),
      shop_id: expect.any(String),
      status: expect.stringMatching(/^(EXPIRED|UNPAID|ON_HOLD|PAID)$/),
      amount: expect.any(Number),
      currency: 'KZT',
      capture_method: expect.stringMatching(/^(AUTO|MANUAL)$/),
      description: expect.any(String),
      checkout_url: expect.any(String),
      access_token: expect.any(String),
    }));
  });

  test('CreateOrder: 400 validation error for amount<100 + <=500ms', async ({ page }) => {
    const { status, body, elapsedMs } = await page.evaluate<FetchResult, EvalInput>((input) => {
      const t0 = performance.now();
      return fetch(input.url, {
        method: 'POST',
        headers: input.headers,
        body: JSON.stringify(input.payload ?? {}),
      }).then(async (r) => {
        const t1 = performance.now();
        return { status: r.status, body: await r.json(), elapsedMs: t1 - t0 };
      });
    }, {
      url: apiUrl('/v2/orders'),
      headers: authHeaders,
      payload: { amount: 50, currency: 'KZT' },
    });

    expect(status).toBe(400);
    expect(elapsedMs).toBeLessThanOrEqual(500);
    expect(body).toEqual(expect.objectContaining({ code: expect.any(String), message: expect.any(String) }));
  });

  test('CreateOrder: 401 when API-KEY is missing + <=500ms', async ({ page }) => {
    await page.context().setExtraHTTPHeaders({});

    const { status, body, elapsedMs } = await page.evaluate(async (input: EvalInput) => {
    const t0 = performance.now();
    const res = await fetch(input.url, {
      method: 'POST',
      headers: input.headers,               // здесь нет API-KEY
      body: JSON.stringify(input.payload),
    });
    const t1 = performance.now();
    return { status: res.status, body: await res.json(), elapsedMs: t1 - t0 };
  }, {
    url: apiUrl('/v2/orders'),
    headers: { 'Content-Type': 'application/json' }, // только этот заголовок
    payload: { amount: 5000, currency: 'KZT' },
  });


    expect(status).toBe(401);
    expect(elapsedMs).toBeLessThanOrEqual(500);
    expect(body).toEqual(expect.objectContaining({ code: expect.any(String), message: expect.any(String) }));
  });

  test('Get payment by id: invalid id -> 400 + <=500ms', async ({ page }) => {
    await page.context().setExtraHTTPHeaders({});

    const { status, body, elapsedMs } = await page.evaluate<FetchResult, EvalInput>((input) => {
      const t0 = performance.now();
      return fetch(input.url, { headers: input.headers }).then(async (r) => {
        const t1 = performance.now();
        return { status: r.status, body: await r.json(), elapsedMs: t1 - t0 };
      });
    }, {
      url: apiUrl('/v2/payments/invalid'),
      headers: authHeaders,
    });

    expect(status).toBe(400);
    expect(elapsedMs).toBeLessThanOrEqual(500);
    expect(body).toEqual(expect.objectContaining({ code: expect.any(String), message: expect.any(String) }));
  });
});
