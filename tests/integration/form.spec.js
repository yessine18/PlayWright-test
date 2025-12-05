/**
 * Integration Tests - Form Validation
 * 
 * Tests essential form validation and interaction patterns.
 */

const { test, expect } = require('../helpers/fixtures');
const { 
  selectors,
  clearStorage,
  loginAndWaitForApp
} = require('../helpers/test-helpers');

test.describe('Form Validation', () => {
  
  test.describe('Login Form', () => {
    test.beforeEach(async ({ page }) => {
      await page.goto('/');
      await clearStorage(page);
    });

    test('should prevent empty login submission', async ({ page }) => {
      await page.click(selectors.loginButton);
      
      // Verify required attributes prevent submission
      const usernameRequired = await page.locator(selectors.usernameInput).getAttribute('required');
      expect(usernameRequired).not.toBeNull();
      
      // Still on login page
      await expect(page.locator(selectors.loginArea)).toBeVisible();
    });

    test('should handle keyboard navigation', async ({ page }) => {
      // Tab through form
      await page.keyboard.press('Tab');
      let focused = await page.evaluate(() => document.activeElement.id);
      expect(focused).toBe('username');
      
      await page.keyboard.press('Tab');
      focused = await page.evaluate(() => document.activeElement.id);
      expect(focused).toBe('password');
    });

    test('should submit with Enter key', async ({ page }) => {
      await page.fill(selectors.usernameInput, 'user');
      await page.fill(selectors.passwordInput, 'pw');
      await page.keyboard.press('Enter');
      
      await expect(page.locator(selectors.appArea)).toBeVisible();
    });
  });

  test.describe('Todo Form', () => {
    test.beforeEach(async ({ page }) => {
      await page.goto('/');
      await clearStorage(page);
      await loginAndWaitForApp(page);
    });

    test('should prevent empty todo submission', async ({ page }) => {
      const initialCount = await page.locator(selectors.todoList + ' li').count();
      
      await page.click(selectors.addTodoButton);
      
      const afterCount = await page.locator(selectors.todoList + ' li').count();
      expect(afterCount).toBe(initialCount);
    });

    test('should trim whitespace from input', async ({ page }) => {
      await page.fill(selectors.todoInput, '  Test Todo  ');
      await page.click(selectors.addTodoButton);
      
      const todoText = await page.locator(selectors.todoText(0)).textContent();
      expect(todoText).toBe('Test Todo');
    });

    test('should submit with Enter key', async ({ page }) => {
      await page.fill(selectors.todoInput, 'Test Todo');
      await page.keyboard.press('Enter');
      
      await expect(page.locator(selectors.todoItem(0))).toBeVisible();
    });

    test('should clear input after submission', async ({ page }) => {
      await page.fill(selectors.todoInput, 'Test');
      await page.click(selectors.addTodoButton);
      
      const inputValue = await page.locator(selectors.todoInput).inputValue();
      expect(inputValue).toBe('');
    });

    test('should handle long text input', async ({ page }) => {
      const longText = 'A'.repeat(200);
      await page.fill(selectors.todoInput, longText);
      await page.click(selectors.addTodoButton);
      
      await expect(page.locator(selectors.todoItem(0))).toBeVisible();
    });
  });
});
