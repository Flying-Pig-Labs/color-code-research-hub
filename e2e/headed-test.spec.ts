import { test, expect } from '@playwright/test';

test.use({
  headless: false,  // Force this test to run with visible browser
  viewport: { width: 1280, height: 720 },
  video: 'on',  // Record video to prove browser opened
});

test('HEADED TEST - Opens real browser window and verifies app loads', async ({ page }) => {
  console.log('🚀 Opening REAL browser window - this should be visible!');
  
  // Navigate to the home page
  await page.goto('/');
  
  // Wait a bit so we can see the browser
  await page.waitForTimeout(2000);
  
  // Take a screenshot for proof
  await page.screenshot({ path: 'headed-browser-proof.png', fullPage: true });
  
  // Verify the app actually loaded
  await expect(page).toHaveTitle(/Research Labs/);
  await expect(page.locator('h1')).toContainText('Strategic Research');
  await expect(page.locator('body')).toContainText('Intelligence Labs');
  
  // Check that navigation works
  await page.click('button:has-text("Red Team")');
  await page.waitForURL('**/red-team');
  await expect(page.locator('h1')).toContainText('Red Team');
  
  // Go back home
  await page.click('button:has-text("Home")');
  await expect(page.locator('h1')).toContainText('Strategic Research');
  
  // Keep browser open for a moment
  await page.waitForTimeout(3000);
  
  console.log('✅ Browser test completed - app loads successfully!');
});