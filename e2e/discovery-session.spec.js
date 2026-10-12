import { test, expect } from '@playwright/test';

test('homepage consultation button opens Discovery Session', async ({ page }) => {
  await page.goto('/');

  await page
    .getByRole('link', {
      name: /Book a Free 15-Minute Consultation/i,
    })
    .click();

  await expect(page).toHaveURL(/\/book\/discovery$/);

  await expect(
    page.getByRole('heading', {
      name: 'Book a Discovery Session',
    }),
  ).toBeVisible();
});

test('mobile consultation button opens Discovery Session', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/');

  await page.getByRole('button', { name: 'Open menu' }).click();

  await page
    .getByRole('link', {
      name: 'Book a Consultation',
    })
    .click();

  await expect(page).toHaveURL(/\/book\/discovery$/);
});
