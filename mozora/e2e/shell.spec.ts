// M0 shell: renders in French by default, honours an explicit English choice, ignores the host's
// Spanish, follows the host theme, and passes axe in both themes and both languages.
import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

const enabled = process.env.MOZORA_ENABLED === '1';

async function open(page: import('@playwright/test').Page, opts: { lang?: string; theme?: 'light' | 'dark' } = {}) {
  await page.addInitScript(({ lang, theme }) => {
    if (lang) localStorage.setItem('mokza_language', lang);
    if (theme) localStorage.setItem('mokza_theme_forced', theme);
  }, opts);
  await page.goto('/mozora/');
  await expect(page.getByRole('heading', { level: 1, name: 'Mozora' })).toBeVisible();
}

test('French by default, and the host Spanish setting falls back to French', async ({ page }) => {
  for (const lang of [undefined, 'es']) {
    await open(page, { lang });
    await expect(page.locator('html')).toHaveAttribute('lang', 'fr-CA');
    await expect(page.getByText('Quiz mensuels du studio')).toBeVisible();
  }
});

test('English when the user chose English on the host', async ({ page }) => {
  await open(page, { lang: 'en' });
  await expect(page.locator('html')).toHaveAttribute('lang', 'en-CA');
  await expect(page.getByText('Studio monthly quizzes')).toBeVisible();
});

test(`shows the ${enabled ? 'signed-out' : 'disabled'} state without a host session`, async ({ page }) => {
  await open(page);
  const message = enabled
    ? 'Connectez-vous sur le site Mokza Studios pour accéder à Mozora.'
    : "Mozora n'est pas encore activé sur ce site.";
  await expect(page.getByText(message)).toBeVisible();
});

test('follows the host theme setting', async ({ page }) => {
  await open(page, { theme: 'light' });
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');
  await open(page, { theme: 'dark' });
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
});

for (const theme of ['light', 'dark'] as const) {
  for (const lang of ['fr', 'en']) {
    test(`axe: no violations (${theme}, ${lang})`, async ({ page }, info) => {
      await open(page, { theme, lang });
      const results = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa']).analyze();
      expect(results.violations.map((v) => `${v.id}: ${v.help}`)).toEqual([]);
      await page.screenshot({ path: info.outputPath(`shell-${theme}-${lang}.png`), fullPage: true });
    });
  }
}

test('keyboard: the only link is reachable and shows a visible focus ring', async ({ page }) => {
  await open(page);
  await page.keyboard.press('Tab');
  const link = page.getByRole('link', { name: 'Retour au site' });
  await expect(link).toBeFocused();
  const outline = await link.evaluate((el) => getComputedStyle(el).outlineStyle);
  expect(outline).not.toBe('none');
});
