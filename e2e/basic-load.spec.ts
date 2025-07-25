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
    
    // Verify the main headings exist (there are multiple h1 elements on the page)
    const mainHeadings = page.locator('h1');
    await expect(mainHeadings).toHaveCount(2);
    
    // Verify specific headings
    await expect(page.locator('h1:has-text("Color Code Hub")')).toBeVisible();
    await expect(page.locator('h1:has-text("Strategic Research")')).toBeVisible();
  });
});