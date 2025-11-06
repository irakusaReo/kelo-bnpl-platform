import { test, expect } from "@playwright/test";

test("Credit Verification Flow", async ({ page }) => {
  await page.goto("http://localhost:3000/test-login");

  // Wait for navigation to the credit page
  await page.waitForURL("**/credit");

  // Click the "Start Verification" button
  await page.click("text=Start Verification");

  // Check that the verification status is displayed
  await expect(page.locator("text=Generating ZK inputs...")).toBeVisible();
  await expect(page.locator("text=Generating ZK proof...")).toBeVisible();
  await expect(page.locator("text=Submitting ZK proof...")).toBeVisible();
  await expect(page.locator("text=Verification successful!")).toBeVisible();
});
