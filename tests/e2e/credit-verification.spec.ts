import { test, expect } from '@playwright/test';

test('Credit Verification Flow', async ({ page }) => {
  await page.waitForTimeout(5000);
  await page.goto('http://localhost:3000/test-login');

  // Wait for navigation to the credit page
  await page.waitForURL('**/credit');

  // Check that the credit verification page is displayed
  expect(page.url()).toContain('/credit');
});
