import { test, expect } from '@playwright/test';

test.use({ headless: false });

test('displays app content in real browser', async ({ page }) => {
    // Navigate to home page
    await page.goto('/');
    
    // Wait for page to load
    await page.waitForLoadState('networkidle');
    
    // Check for main content
    await expect(page).toHaveTitle(/Research Labs/);
    await expect(page.locator('body')).toContainText('Strategic Research');
    await expect(page.locator('body')).toContainText('Intelligence Labs');
    
    // Take a screenshot for proof
    await page.screenshot({ path: 'test-results/headed-test-proof.png' });
    
    // Verify the app is functional
    const teamButtons = page.locator('button').filter({ hasText: /Team/ });
    await expect(teamButtons).toHaveCount(3);
  });