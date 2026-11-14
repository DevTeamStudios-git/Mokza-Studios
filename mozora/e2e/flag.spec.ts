// Brief acceptance criterion: with MOZORA_ENABLED=0 the host pages and /api/* behave exactly as
// before, and Mozora does not exist. With the flag on, Mozora answers and the host is still unchanged.
import { expect, test } from '@playwright/test';

const enabled = process.env.MOZORA_ENABLED === '1';

test('host home page loads without errors', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await page.goto('/');
  await expect(page.locator('.brand-text')).toHaveText('Mokza Studios');
  await expect(page.locator('#pageContent')).not.toBeEmpty();
  expect(errors).toEqual([]);
});

test('host API is unaffected', async ({ request }) => {
  const health = await request.get('/api/health');
  expect(health.status()).toBe(200);
  expect((await health.json()).status).toBe('ok');
  const me = await request.get('/api/auth/me');
  expect(me.status()).toBe(401);
});

test(`Mozora API ${enabled ? 'answers' : 'does not exist'}`, async ({ request }) => {
  for (const path of ['/api/mozora/health', '/api/mozora/me', '/api/mozora/anything']) {
    const res = await request.get(path);
    if (!enabled) {
      expect(res.status(), path).toBe(404);
      continue;
    }
    // Flag on, no database configured locally: health fails closed, me needs a sign-in, unknown is 404.
    const expected = { '/api/mozora/health': 503, '/api/mozora/me': 401, '/api/mozora/anything': 404 }[path];
    expect(res.status(), path).toBe(expected);
    expect(res.headers()['content-security-policy']).toContain("default-src 'none'");
  }
});
