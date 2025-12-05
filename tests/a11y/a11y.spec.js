/**
 * Accessibility Tests
 * 
 * Basic accessibility checks to ensure the app is usable for everyone.
 * Uses axe-core for automated accessibility testing.
 */

const { test, expect } = require('../helpers/fixtures');
const AxeBuilder = require('@axe-core/playwright').default;
const { 
  selectors,
  clearStorage,
  loginAndWaitForApp
} = require('../helpers/test-helpers');

test.describe('Accessibility Tests', () => {
  
  test('should have no accessibility violations on login page', async ({ page }) => {
    await page.goto('/');
    await clearStorage(page);
    
    // Run accessibility checks with axe-core
    const accessibilityScanResults = await new AxeBuilder({ page })
      .disableRules(['skip-link']) // Disable less critical rules for school project
      .analyze();
    
    // Filter out best-practice violations (not critical)
    const criticalViolations = accessibilityScanResults.violations.filter(
      v => v.impact === 'critical' || v.impact === 'serious'
    );
    expect(criticalViolations).toEqual([]);
  });

  test('should support keyboard navigation on login form', async ({ page }) => {
    await page.goto('/');
    await clearStorage(page);
    
    // Tab to username
    await page.keyboard.press('Tab');
    let focused = await page.evaluate(() => document.activeElement.id);
    expect(focused).toBe('username');
    
    // Tab to password
    await page.keyboard.press('Tab');
    focused = await page.evaluate(() => document.activeElement.id);
    expect(focused).toBe('password');
    
    // Tab to submit button
    await page.keyboard.press('Tab');
    const isButton = await page.evaluate(() => {
      return document.activeElement.tagName === 'BUTTON';
    });
    expect(isButton).toBe(true);
  });

  test('should have proper labels for form inputs', async ({ page }) => {
    await page.goto('/');
    await clearStorage(page);
    
    // Check username label
    const usernameLabel = await page.locator('label[for="username"]').textContent();
    expect(usernameLabel).toBe('Username');
    
    // Check password label
    const passwordLabel = await page.locator('label[for="password"]').textContent();
    expect(passwordLabel).toBe('Password');
  });

  test('should have accessible page title', async ({ page }) => {
    await page.goto('/');
    
    // Check title exists and is meaningful
    const title = await page.title();
    expect(title).toBe('Playwright Test Playground');
    expect(title.length).toBeGreaterThan(0);
  });
});
