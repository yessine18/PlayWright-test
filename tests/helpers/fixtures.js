/**
 * Custom fixtures for Playwright tests
 * Extends base test with authentication and cleanup utilities
 */

const base = require('@playwright/test');
const { 
  clearStorage, 
  loginAndWaitForApp, 
  generateAuthState, 
  getAuthStatePath 
} = require('./test-helpers');

/**
 * Extended test with custom fixtures
 */
const test = base.test.extend({
  /**
   * Authenticated page fixture - automatically logs in before each test
   */
  authenticatedPage: async ({ page }, use) => {
    await loginAndWaitForApp(page);
    await use(page);
  },

  /**
   * Clean page fixture - clears storage before each test
   */
  cleanPage: async ({ page }, use) => {
    await page.goto('/');
    await clearStorage(page);
    await use(page);
    // Cleanup after test
    await clearStorage(page);
  },
});

/**
 * Setup authenticated storage state for tests that need it
 * This is a global setup that can be run once before all tests
 */
async function setupAuthState(browser) {
  const context = await browser.newContext();
  const page = await context.newPage();
  
  try {
    const authStatePath = getAuthStatePath();
    await generateAuthState(page, authStatePath);
    console.log(`✓ Generated auth state at: ${authStatePath}`);
  } catch (error) {
    console.error('Failed to generate auth state:', error);
    throw error;
  } finally {
    await context.close();
  }
}

module.exports = { test, expect: base.expect, setupAuthState };
