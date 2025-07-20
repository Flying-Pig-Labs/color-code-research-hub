import { test, expect } from '@playwright/test';

test.describe('Headless Tests', () => {
  test('application loads successfully', async ({ page }) => {
    // Navigate to the home page
    await page.goto('/');
    
    // Wait for the page to load
    await page.waitForLoadState('networkidle');
    
    // Check that the key text is present
    await expect(page.locator('body')).toContainText('Strategic Research');
    await expect(page.locator('body')).toContainText('Intelligence Labs');
    
    // Verify the main heading exists
    await expect(page.locator('h1')).toBeVisible();
  });
});