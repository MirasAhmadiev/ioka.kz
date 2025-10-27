// tests/mocks/ioka.orders.mock.ts
import type { BrowserContext, Route } from '@playwright/test';

type Mode = 'off' | 'mock';

function jsonResponse(status: number, body: unknown) {
  return {
    status,
    contentType: 'application/json; charset=utf-8',
    body: JSON.stringify(body),
  };
}

function nowIso() {
  return new Date().toISOString();
}

function hasApiKey(route: Route) {
  const h = route.request().headers();
  return Boolean(h['api-key']);
}

export async function installIokaOrdersMocks(context: BrowserContext, mode: Mode = 'mock') {
  if (mode === 'off') return;

  // --- POST /v2/orders ---
    await context.route('**/v2/orders', async (route: Route) => {
    const req = route.request();

    if (req.method() !== 'POST') return route.fallback();
    
    if (!req.headers()['api-key']) {
      return route.fulfill(jsonResponse(401, {
        code: 'unauthorized',
        message: 'API-KEY header is required',
      }));
    }

    let data: any = {};
    try {
      data = req.postDataJSON();
    } catch {
      return route.fulfill(jsonResponse(400, { code: 'bad_request', message: 'Invalid JSON' }));
    }

    const errors: string[] = [];
    if (typeof data.amount !== 'number' || Number.isNaN(data.amount)) errors.push('amount must be a number');
    if (data.amount < 100) errors.push('amount must be >= 100');
    if (!data.currency) errors.push('currency is required');
    if (data.currency && data.currency !== 'KZT') errors.push('currency must be "KZT"');

    if (errors.length) {
      return route.fulfill(jsonResponse(400, { code: 'validation_error', message: errors.join('; ') }));
    }

    const id = 'ord_001';
    const order = {
      id,
      shop_id: 'shop_001',
      status: 'UNPAID',
      created_at: nowIso(),
      amount: data.amount,
      currency: data.currency,
      capture_method: data.capture_method ?? 'AUTO',
      external_id: data.external_id ?? 'ext_001',
      description: data.description ?? 'Test order',
      extra_info: data.extra_info ?? {},
      attempts: data.attempts ?? 10,
      due_date: data.due_date ?? nowIso(),
      customer_id: data.customer_id ?? 'cust_001',
      card_id: data.card_id ?? null,
      back_url: data.back_url ?? 'http://example.com/back',
      success_url: data.success_url ?? 'http://example.com/success',
      failure_url: data.failure_url ?? 'http://example.com/failure',
      template: data.template ?? 'default',
      checkout_url: 'http://example.com/checkout',
      access_token: 'acc_token_123',
      mcc: data.mcc ?? '5311',
    };

    return route.fulfill(jsonResponse(201, { order, order_access_token: 'order_token_123' }));
  });

  // --- GET /v2/payments/:id ---
  await context.route('**/v2/payments/*', async (route: Route) => {
    const req = route.request();
    if (req.method() !== 'GET') return route.fallback();

    const apiKey = req.headers()['api-key'];
    if (!apiKey) {
      return route.fulfill(jsonResponse(401, { code: 'unauthorized', message: 'API-KEY header is required' }));
    }

    const id = req.url().split('/').pop() || '';
    if (!id.startsWith('pay_')) {
      return route.fulfill(jsonResponse(400, { code: 'invalid_payment_id', message: 'payment_id is invalid' }));
    }
    if (id === 'pay_404') {
      return route.fulfill(jsonResponse(404, { code: 'not_found', message: 'Payment not found' }));
    }

    const payment = {
      id,
      status: 'CREATED',
      amount: 5000,
      currency: 'KZT',
      created_at: nowIso(),
      order_id: 'ord_001',
    };
    return route.fulfill(jsonResponse(200, { payment }));
  });
}
