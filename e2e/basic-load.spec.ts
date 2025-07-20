import { test, expect } from '@playwright/test';

test('application loads successfully', async ({ page }) => {
  // Navigate to the home page
  await page.goto('/');
  
  // Wait for the page to load
  await page.waitForLoadState('networkidle');
  
  // Check that the key text is present (it's split across lines in the actual page)
  await expect(page.locator('body')).toContainText('Strategic Research');
  await expect(page.locator('body')).toContainText('Intelligence Labs');
  
  // Also verify the main heading exists
  await expect(page.locator('h1')).toBeVisible();
  
  // Verify no critical errors in console
  const consoleLogs: string[] = [];
  page.on('console', msg => {
    if (msg.type() === 'error') {
      consoleLogs.push(msg.text());
    }
  });
  
  // Give it a moment to catch any errors
  await page.waitForTimeout(1000);
  
  // There should be no critical errors
  const criticalErrors = consoleLogs.filter(log => 
    log.includes('Failed to fetch') || 
    log.includes('Cannot read') ||
    log.includes('undefined is not')
  );
  
  expect(criticalErrors).toHaveLength(0);
});