import { request } from 'undici';

export async function httpJson<T>(url: string, opts: {
  method?: 'GET'|'POST'|'PUT'|'PATCH'|'DELETE';
  headers?: Record<string, string>;
  body?: unknown;
  timeoutMs?: number;
} = {}): Promise<T> {
  const { method = 'GET', headers = {}, body, timeoutMs = 5000 } = opts;
  const res = await request(url, {
    method,
    headers: { 'content-type': 'application/json', ...headers },
    body: body ? JSON.stringify(body) : undefined,
    bodyTimeout: timeoutMs,
    headersTimeout: timeoutMs
  });
  if (res.statusCode >= 400) {
    const text = await res.body.text();
    throw new Error(`HTTP ${res.statusCode}: ${text}`);
  }
  return res.body.json() as Promise<T>;
}
