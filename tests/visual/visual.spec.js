/**
 * Visual Regression Tests
 * 
 * Tests visual appearance of the application using screenshot comparison.
 * Captures important states and validates UI consistency across changes.
 */

const { test, expect } = require('../helpers/fixtures');
const { 
  selectors,
  clearStorage,
  loginAndWaitForApp,
  addTodo
} = require('../helpers/test-helpers');

test.describe('Visual Regression Tests', () => {
  
  test('should match login page screenshot', async ({ page }) => {
    await page.goto('/');
    await clearStorage(page);
    
    // Wait for page to be fully loaded
    await page.waitForLoadState('networkidle');
    
    // Take screenshot of login page
    await expect(page).toHaveScreenshot('login-page.png', {
      fullPage: true,
      maxDiffPixels: 100,
    });
  });

  test('should match empty todo list after login', async ({ page }) => {
    await page.goto('/');
    await clearStorage(page);
    await loginAndWaitForApp(page);
    
    // Wait for app to be fully visible
    await page.waitForLoadState('networkidle');
    await expect(page.locator(selectors.appArea)).toBeVisible();
    
    // Take screenshot
    await expect(page).toHaveScreenshot('app-empty-list.png', {
      fullPage: true,
      maxDiffPixels: 100,
    });
  });

  test('should match todo list with one item', async ({ page }) => {
    await page.goto('/');
    await clearStorage(page);
    await loginAndWaitForApp(page);
    
    // Add one todo
    await addTodo(page, 'Buy groceries');
    
    // Wait for todo to render
    await expect(page.locator(selectors.todoItem(0))).toBeVisible();
    await page.waitForTimeout(200);
    
    // Take screenshot
    await expect(page).toHaveScreenshot('app-one-todo.png', {
      fullPage: true,
      maxDiffPixels: 100,
    });
  });

  test('should match todo list with three items', async ({ page }) => {
    await page.goto('/');
    await clearStorage(page);
    await loginAndWaitForApp(page);
    
    // Add three todos
    await addTodo(page, 'First task');
    await addTodo(page, 'Second task');
    await addTodo(page, 'Third task');
    
    // Wait for all todos to render
    await expect(page.locator(selectors.todoItem(2))).toBeVisible();
    await page.waitForTimeout(200);
    
    // Take screenshot
    await expect(page).toHaveScreenshot('app-three-todos.png', {
      fullPage: true,
      maxDiffPixels: 100,
    });
  });

  test('should match login error state', async ({ page }) => {
    await page.goto('/');
    await clearStorage(page);
    
    // Attempt invalid login
    await page.fill(selectors.usernameInput, 'wronguser');
    await page.fill(selectors.passwordInput, 'wrongpass');
    await page.click(selectors.loginButton);
    
    // Wait for error message
    await expect(page.locator(selectors.loginMessage)).toBeVisible();
    await page.waitForTimeout(200);
    
    // Take screenshot
    await expect(page).toHaveScreenshot('login-error.png', {
      fullPage: true,
      maxDiffPixels: 100,
    });
  });

  test('should match login success state', async ({ page }) => {
    await page.goto('/');
    await clearStorage(page);
    
    // Perform login
    await page.fill(selectors.usernameInput, 'user');
    await page.fill(selectors.passwordInput, 'pw');
    await page.click(selectors.loginButton);
    
    // Wait for success message (before redirect)
    await expect(page.locator(selectors.loginMessage)).toHaveClass(/success/);
    await page.waitForTimeout(200);
    
    // Take screenshot
    await expect(page).toHaveScreenshot('login-success.png', {
      fullPage: true,
      maxDiffPixels: 100,
    });
  });

  test('should match hover state on login button', async ({ page }) => {
    await page.goto('/');
    await clearStorage(page);
    
    // Hover over login button
    await page.hover(selectors.loginButton);
    await page.waitForTimeout(100);
    
    // Take screenshot
    await expect(page).toHaveScreenshot('login-button-hover.png', {
      fullPage: true,
      maxDiffPixels: 150,
    });
  });

  test('should match focused input state', async ({ page }) => {
    await page.goto('/');
    await clearStorage(page);
    
    // Focus username input
    await page.focus(selectors.usernameInput);
    await page.waitForTimeout(100);
    
    // Take screenshot
    await expect(page).toHaveScreenshot('input-focused.png', {
      fullPage: true,
      maxDiffPixels: 100,
    });
  });

  test('should match mobile viewport', async ({ page, browserName }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    
    await page.goto('/');
    await clearStorage(page);
    await loginAndWaitForApp(page);
    
    // Add a todo
    await addTodo(page, 'Mobile todo');
    
    await expect(page.locator(selectors.todoItem(0))).toBeVisible();
    await page.waitForTimeout(200);
    
    // Take screenshot
    await expect(page).toHaveScreenshot(`app-mobile-${browserName}.png`, {
      fullPage: true,
      maxDiffPixels: 150,
    });
  });
});
