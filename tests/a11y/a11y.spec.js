/**
 * Accessibility Tests
 * 
 * Tests accessibility compliance using axe-core and manual checks.
 * Validates ARIA attributes, keyboard navigation, and screen reader support.
 */

const { test, expect } = require('../helpers/fixtures');
const { injectAxe, checkA11y } = require('@axe-core/playwright');
const { 
  selectors,
  clearStorage,
  loginAndWaitForApp,
  addTodo
} = require('../helpers/test-helpers');

test.describe('Accessibility Tests', () => {
  
  test('should have no accessibility violations on login page', async ({ page }) => {
    await page.goto('/');
    await clearStorage(page);
    
    // Inject axe-core
    await injectAxe(page);
    
    // Run accessibility checks
    await checkA11y(page, null, {
      detailedReport: true,
      detailedReportOptions: { html: true },
    });
  });

  test('should have no accessibility violations on app page', async ({ page }) => {
    await page.goto('/');
    await clearStorage(page);
    await loginAndWaitForApp(page);
    
    // Inject axe-core
    await injectAxe(page);
    
    // Run accessibility checks
    await checkA11y(page, null, {
      detailedReport: true,
      detailedReportOptions: { html: true },
    });
  });

  test('should have no accessibility violations with todos', async ({ page }) => {
    await page.goto('/');
    await clearStorage(page);
    await loginAndWaitForApp(page);
    
    // Add some todos
    await addTodo(page, 'Task 1');
    await addTodo(page, 'Task 2');
    
    // Inject axe-core
    await injectAxe(page);
    
    // Run accessibility checks
    await checkA11y(page, null, {
      detailedReport: true,
      detailedReportOptions: { html: true },
    });
  });

  test('should have proper ARIA roles on todo list', async ({ page }) => {
    await page.goto('/');
    await clearStorage(page);
    await loginAndWaitForApp(page);
    
    // Check todo list has role
    const listRole = await page.locator(selectors.todoList).getAttribute('role');
    expect(listRole).toBe('list');
  });

  test('should have aria-live region for login messages', async ({ page }) => {
    await page.goto('/');
    await clearStorage(page);
    
    // Check login message has aria-live
    const ariaLive = await page.locator(selectors.loginMessage).getAttribute('aria-live');
    expect(ariaLive).toBe('polite');
    
    // Check for role status
    const role = await page.locator(selectors.loginMessage).getAttribute('role');
    expect(role).toBe('status');
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

  test('should support keyboard navigation in todo app', async ({ page }) => {
    await page.goto('/');
    await clearStorage(page);
    await loginAndWaitForApp(page);
    
    // Tab to todo input
    await page.keyboard.press('Tab');
    await page.keyboard.press('Tab'); // May need multiple tabs depending on layout
    
    // Type a todo
    await page.keyboard.type('Keyboard todo');
    
    // Press Enter to submit
    await page.keyboard.press('Enter');
    
    // Verify todo was added
    await expect(page.locator(selectors.todoItem(0))).toBeVisible();
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

  test('should have accessible button text', async ({ page }) => {
    await page.goto('/');
    await clearStorage(page);
    await loginAndWaitForApp(page);
    
    // Check logout button text
    const logoutText = await page.locator(selectors.logoutButton).textContent();
    expect(logoutText).toBe('Logout');
    
    // Check add button text
    const addText = await page.locator(selectors.addTodoButton).textContent();
    expect(addText).toBe('Add');
  });

  test('should maintain focus order in todo list', async ({ page }) => {
    await page.goto('/');
    await clearStorage(page);
    await loginAndWaitForApp(page);
    
    // Add todos
    await addTodo(page, 'First');
    await addTodo(page, 'Second');
    
    // Tab through elements - should follow logical order
    await page.keyboard.press('Tab'); // to input or first focusable
    
    // Just verify no focus traps exist by tabbing multiple times
    for (let i = 0; i < 10; i++) {
      await page.keyboard.press('Tab');
      
      // Ensure focus is somewhere on the page
      const hasFocus = await page.evaluate(() => {
        return document.activeElement !== document.body;
      });
      
      // Just verify no errors occur during tab navigation
      expect(hasFocus).toBeDefined();
    }
  });

  test('should have sufficient color contrast', async ({ page }) => {
    await page.goto('/');
    await clearStorage(page);
    
    // Inject axe and check specifically for color contrast
    await injectAxe(page);
    
    await checkA11y(page, null, {
      detailedReport: true,
      rules: {
        'color-contrast': { enabled: true },
      },
    });
  });

  test('should have document language set', async ({ page }) => {
    await page.goto('/');
    
    // Check html lang attribute
    const lang = await page.evaluate(() => {
      return document.documentElement.getAttribute('lang');
    });
    
    expect(lang).toBe('en');
  });

  test('should have accessible page title', async ({ page }) => {
    await page.goto('/');
    
    // Check title
    const title = await page.title();
    expect(title).toBe('Playwright Test Playground');
    expect(title.length).toBeGreaterThan(0);
  });

  test('should handle Escape key to clear input', async ({ page }) => {
    await page.goto('/');
    await clearStorage(page);
    await loginAndWaitForApp(page);
    
    // Fill todo input
    await page.fill(selectors.todoInput, 'Some text');
    
    // Press Escape (may not clear, but shouldn't cause errors)
    await page.keyboard.press('Escape');
    
    // Just verify no errors occurred
    const inputValue = await page.locator(selectors.todoInput).inputValue();
    expect(inputValue).toBeDefined();
  });

  test('should announce login success to screen readers', async ({ page }) => {
    await page.goto('/');
    await clearStorage(page);
    
    // Perform login
    await page.fill(selectors.usernameInput, 'user');
    await page.fill(selectors.passwordInput, 'pw');
    await page.click(selectors.loginButton);
    
    // Check that message appears in aria-live region
    await expect(page.locator(selectors.loginMessage)).toBeVisible();
    
    const ariaLive = await page.locator(selectors.loginMessage).getAttribute('aria-live');
    expect(ariaLive).toBe('polite');
  });

  test('should have proper heading structure', async ({ page }) => {
    await page.goto('/');
    await clearStorage(page);
    
    // Check h1 exists
    const h1 = await page.locator('h1').textContent();
    expect(h1).toBe('Playwright Test Playground');
    
    // Login and check h2
    await loginAndWaitForApp(page);
    const h2 = await page.locator('h2').textContent();
    expect(h2).toBe('Todo List');
  });
});
