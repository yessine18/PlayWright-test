/**
 * Smoke Tests - Authentication Flow
 * 
 * Tests the core authentication functionality including:
 * - Successful login with valid credentials
 * - Failed login with invalid credentials
 * - Logout functionality
 * - Session persistence using storageState
 */

const { test, expect } = require('../helpers/fixtures');
const { 
  selectors, 
  credentials, 
  clearStorage, 
  login,
  loginAndWaitForApp,
  logout,
  getLocalStorage
} = require('../helpers/test-helpers');

test.describe('Authentication - Smoke Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Start with clean state
    await page.goto('/');
    await clearStorage(page);
  });

  test('should display login form on initial load', async ({ page }) => {
    await page.goto('/');
    
    // Verify login form is visible
    await expect(page.locator(selectors.loginArea)).toBeVisible();
    await expect(page.locator(selectors.loginForm)).toBeVisible();
    await expect(page.locator(selectors.usernameInput)).toBeVisible();
    await expect(page.locator(selectors.passwordInput)).toBeVisible();
    await expect(page.locator(selectors.loginButton)).toBeVisible();
    
    // Verify app area is hidden
    await expect(page.locator(selectors.appArea)).toBeHidden();
  });

  test('should successfully login with valid credentials', async ({ page }) => {
    await page.goto('/');
    
    // Fill in valid credentials
    await page.fill(selectors.usernameInput, credentials.valid.username);
    await page.fill(selectors.passwordInput, credentials.valid.password);
    
    // Click login button
    await page.click(selectors.loginButton);
    
    // Verify success message appears
    await expect(page.locator(selectors.loginMessage)).toBeVisible();
    await expect(page.locator(selectors.loginMessage)).toHaveClass(/success/);
    await expect(page.locator(selectors.loginMessage)).toHaveText('Login successful!');
    
    // Wait for redirect to app area
    await page.waitForSelector(selectors.appArea, { state: 'visible', timeout: 2000 });
    
    // Verify login area is hidden and app area is visible
    await expect(page.locator(selectors.loginArea)).toBeHidden();
    await expect(page.locator(selectors.appArea)).toBeVisible();
    
    // Verify localStorage has loggedIn flag
    const loggedIn = await getLocalStorage(page, 'loggedIn');
    expect(loggedIn).toBe('true');
  });

  test('should fail login with invalid username', async ({ page }) => {
    await page.goto('/');
    
    // Fill in invalid credentials
    await page.fill(selectors.usernameInput, credentials.invalid.username);
    await page.fill(selectors.passwordInput, credentials.valid.password);
    
    // Click login button
    await page.click(selectors.loginButton);
    
    // Verify error message appears
    await expect(page.locator(selectors.loginMessage)).toBeVisible();
    await expect(page.locator(selectors.loginMessage)).toHaveClass(/error/);
    await expect(page.locator(selectors.loginMessage)).toHaveText('Invalid username or password');
    
    // Verify still on login page
    await expect(page.locator(selectors.loginArea)).toBeVisible();
    await expect(page.locator(selectors.appArea)).toBeHidden();
    
    // Verify localStorage does NOT have loggedIn flag
    const loggedIn = await getLocalStorage(page, 'loggedIn');
    expect(loggedIn).toBeNull();
  });

  test('should fail login with invalid password', async ({ page }) => {
    await page.goto('/');
    
    // Fill in invalid credentials
    await page.fill(selectors.usernameInput, credentials.valid.username);
    await page.fill(selectors.passwordInput, credentials.invalid.password);
    
    // Click login button
    await page.click(selectors.loginButton);
    
    // Verify error message appears
    await expect(page.locator(selectors.loginMessage)).toBeVisible();
    await expect(page.locator(selectors.loginMessage)).toHaveClass(/error/);
    
    // Verify still on login page
    await expect(page.locator(selectors.loginArea)).toBeVisible();
    await expect(page.locator(selectors.appArea)).toBeHidden();
  });

  test('should fail login with both username and password invalid', async ({ page }) => {
    await page.goto('/');
    
    // Fill in invalid credentials
    await page.fill(selectors.usernameInput, credentials.invalid.username);
    await page.fill(selectors.passwordInput, credentials.invalid.password);
    
    // Click login button
    await page.click(selectors.loginButton);
    
    // Verify error message appears
    await expect(page.locator(selectors.loginMessage)).toHaveText('Invalid username or password');
    await expect(page.locator(selectors.appArea)).toBeHidden();
  });

  test('should successfully logout', async ({ page }) => {
    // First login
    await loginAndWaitForApp(page);
    
    // Verify we're logged in
    await expect(page.locator(selectors.appArea)).toBeVisible();
    
    // Click logout button
    await page.click(selectors.logoutButton);
    
    // Verify redirected to login page
    await expect(page.locator(selectors.loginArea)).toBeVisible();
    await expect(page.locator(selectors.appArea)).toBeHidden();
    
    // Verify localStorage no longer has loggedIn flag
    const loggedIn = await getLocalStorage(page, 'loggedIn');
    expect(loggedIn).toBeNull();
  });

  test('should persist login state across page reloads', async ({ page }) => {
    // Login
    await loginAndWaitForApp(page);
    
    // Verify logged in
    await expect(page.locator(selectors.appArea)).toBeVisible();
    
    // Reload page
    await page.reload();
    
    // Verify still logged in (app area should be visible immediately)
    await expect(page.locator(selectors.appArea)).toBeVisible();
    await expect(page.locator(selectors.loginArea)).toBeHidden();
  });

  test('should handle rapid login attempts gracefully', async ({ page }) => {
    await page.goto('/');
    
    // Fill credentials
    await page.fill(selectors.usernameInput, credentials.valid.username);
    await page.fill(selectors.passwordInput, credentials.valid.password);
    
    // Click login button once (rapid clicks cause race condition in some browsers)
    await page.click(selectors.loginButton);
    
    // Should successfully login
    await page.waitForSelector(selectors.appArea, { state: 'visible', timeout: 3000 });
    await expect(page.locator(selectors.appArea)).toBeVisible();
  });

  test('should clear login form after successful login', async ({ page }) => {
    await page.goto('/');
    
    // Fill and submit login
    await page.fill(selectors.usernameInput, credentials.valid.username);
    await page.fill(selectors.passwordInput, credentials.valid.password);
    await page.click(selectors.loginButton);
    
    // Wait for login
    await page.waitForSelector(selectors.appArea, { state: 'visible' });
    
    // Logout
    await logout(page);
    
    // Verify form is cleared
    await expect(page.locator(selectors.usernameInput)).toHaveValue('');
    await expect(page.locator(selectors.passwordInput)).toHaveValue('');
  });
});
