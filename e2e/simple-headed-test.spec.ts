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
    // There are 6 team buttons total: 3 in navigation + 3 "Explore Team" buttons
    const teamButtons = page.locator('button').filter({ hasText: /Team/ });
    await expect(teamButtons).toHaveCount(6);
    
    // Also verify specific button types
    const navTeamButtons = page.locator('nav button').filter({ hasText: /Team/ });
    await expect(navTeamButtons).toHaveCount(3);
    
    const exploreButtons = page.locator('button').filter({ hasText: /Explore.*Team/ });
    await expect(exploreButtons).toHaveCount(3);
  });