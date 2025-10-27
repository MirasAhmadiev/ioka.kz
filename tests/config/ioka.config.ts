/**
 * Lightweight config helper for API tests.
 * Values come from environment variables, with safe defaults for mocks.
 */
export const IOKA_API_BASE = process.env.IOKA_API_BASE || 'https://api.ioka.kz';
export const IOKA_API_KEY  = process.env.IOKA_API_KEY  || 'test_key';

export const apiUrl = (path: string) => `${IOKA_API_BASE}${path}`;

export const authHeaders = {
  'API-KEY': IOKA_API_KEY,
  'Content-Type': 'application/json',
} as const;
