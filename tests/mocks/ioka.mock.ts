// tests/mocks/ioka.mock.ts
import type { BrowserContext, Route, Request } from '@playwright/test';

type Mode = 'off' | 'mock';

type GetAccount = {
  id: string;
  shop_id: string;
  customer_id: string;
  status: 'PENDING' | 'ACCEPTED' | 'BLOCKED';
  name: string | null;
  amount: string;
  currency: number;
  resources: Array<{ type: string; id: string }>;
  created_at: string;
  external_id: string | null;
};

function fulfillJson(route: Route, status: number, body: unknown) {
  return route.fulfill({
    status,
    contentType: 'application/json; charset=utf-8',
    body: JSON.stringify(body),
  });
}

async function getAccountRoute(route: Route, req: Request) {
  
  const headers = await req.allHeaders();
  const apiKey = headers['api-key'];

  if (!apiKey) {
    return fulfillJson(route, 401, { error: 'Missing API-KEY' });
  }

  const { pathname } = new URL(req.url());
  const id = pathname.split('/').pop()!;

  if (id === 'missing') {
    return fulfillJson(route, 404, { error: 'Account not found' });
  }

  const payload: GetAccount = {
    id,
    shop_id: 'shop_001',
    customer_id: 'cus_001',
    status: 'ACCEPTED',
    name: 'Test account',
    amount: '50000',
    currency: 398,
    resources: [{ type: 'CARD', id: 'crd_001' }],
    created_at: new Date().toISOString(),
    external_id: null,
  };

  return fulfillJson(route, 200, payload);
}

export async function installIokaMocks(context: BrowserContext, mode: Mode = 'mock') {
  if (mode === 'off') return;

  await context.route('**://api.ioka.kz/**', async (route, req) => {
  const { pathname } = new URL(req.url());

  if (req.method() === 'GET' && /^\/v2\/accounts\/[^/]+$/.test(pathname)) {
    const headers = await req.allHeaders();      
    const apiKey = headers['api-key'];

    if (!apiKey) {
      return route.fulfill({
        status: 401,
        contentType: 'application/json; charset=utf-8',
        body: JSON.stringify({ error: 'Missing API-KEY' }),
      });
    }

    const id = pathname.split('/').pop()!;
    if (id === 'missing') {
      return route.fulfill({
        status: 404,
        contentType: 'application/json; charset=utf-8',
        body: JSON.stringify({ error: 'Account not found' }),
      });
    }

    return route.fulfill({
      status: 200,
      contentType: 'application/json; charset=utf-8',
      body: JSON.stringify({ id, shop_id: 'shop_001' }),
    });
  }

  return route.fallback();
});
 
}
