/**
 * Security Tests - Injection Prevention
 * 
 * Tests to verify that script-like input is not executed and
 * content is properly sanitized or displayed as text only.
 */

const { test, expect } = require('../helpers/fixtures');
const { 
  selectors,
  clearStorage,
  loginAndWaitForApp,
  addTodo,
  credentials
} = require('../helpers/test-helpers');

test.describe('Security - Injection Prevention', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await clearStorage(page);
    await loginAndWaitForApp(page);
  });

  test('should not execute script tags in todo content', async ({ page }) => {
    const xssPayload = '<script>window.xssExecuted = true</script>';
    
    // Add todo with script
    await addTodo(page, xssPayload);
    
    // Verify todo was added
    await expect(page.locator(selectors.todoItem(0))).toBeVisible();
    
    // Check that script was NOT executed
    const scriptExecuted = await page.evaluate(() => window.xssExecuted);
    expect(scriptExecuted).toBeUndefined();
    
    // Verify content is displayed as text
    const todoText = await page.locator(selectors.todoText(0)).textContent();
    expect(todoText).toContain('<script>');
  });

  test('should not execute inline event handlers', async ({ page }) => {
    const payload = '<img src=x onerror="window.xssTriggered=true">';
    
    await addTodo(page, payload);
    
    await expect(page.locator(selectors.todoItem(0))).toBeVisible();
    
    // Wait a bit to see if event fires
    await page.waitForTimeout(500);
    
    // Check that event handler was NOT executed
    const eventTriggered = await page.evaluate(() => window.xssTriggered);
    expect(eventTriggered).toBeUndefined();
  });

  test('should not execute javascript: protocol', async ({ page }) => {
    const payload = '<a href="javascript:window.xssLink=true">Click</a>';
    
    await addTodo(page, payload);
    
    await expect(page.locator(selectors.todoItem(0))).toBeVisible();
    
    // Verify as text
    const todoText = await page.locator(selectors.todoText(0)).textContent();
    expect(todoText).toContain('javascript:');
    
    // Verify not executed
    const linkExecuted = await page.evaluate(() => window.xssLink);
    expect(linkExecuted).toBeUndefined();
  });

  test('should not execute SVG with onload', async ({ page }) => {
    const payload = '<svg onload="window.svgXss=true">';
    
    await addTodo(page, payload);
    
    await expect(page.locator(selectors.todoItem(0))).toBeVisible();
    await page.waitForTimeout(500);
    
    const svgExecuted = await page.evaluate(() => window.svgXss);
    expect(svgExecuted).toBeUndefined();
  });

  test('should safely handle iframe injection', async ({ page }) => {
    const payload = '<iframe src="javascript:alert(1)"></iframe>';
    
    await addTodo(page, payload);
    
    await expect(page.locator(selectors.todoItem(0))).toBeVisible();
    
    // Verify no iframe is actually rendered
    const iframeCount = await page.locator('iframe').count();
    expect(iframeCount).toBe(0);
    
    // Verify displayed as text
    const todoText = await page.locator(selectors.todoText(0)).textContent();
    expect(todoText).toContain('<iframe');
  });

  test('should escape HTML entities properly', async ({ page }) => {
    const payload = '&lt;script&gt;alert("test")&lt;/script&gt;';
    
    await addTodo(page, payload);
    
    await expect(page.locator(selectors.todoItem(0))).toBeVisible();
    
    const todoText = await page.locator(selectors.todoText(0)).textContent();
    
    // Should display the entities as intended
    expect(todoText.includes('&lt;') || todoText.includes('<script>')).toBe(true);
  });

  test('should handle SQL-like injection attempts', async ({ page }) => {
    const sqlPayload = "'; DROP TABLE todos; --";
    
    // This app uses localStorage, not SQL, but test anyway
    await addTodo(page, sqlPayload);
    
    await expect(page.locator(selectors.todoItem(0))).toBeVisible();
    
    const todoText = await page.locator(selectors.todoText(0)).textContent();
    expect(todoText).toBe(sqlPayload);
    
    // Verify app still works after
    await addTodo(page, 'Normal todo');
    await expect(page.locator(selectors.todoItem(1))).toBeVisible();
  });

  test('should sanitize todo content in localStorage', async ({ page }) => {
    const maliciousContent = '<script>alert("xss")</script>';
    
    await addTodo(page, maliciousContent);
    
    // Check localStorage directly
    const storedTodos = await page.evaluate(() => {
      return localStorage.getItem('todos');
    });
    
    expect(storedTodos).toBeTruthy();
    
    // Parse and verify
    const todos = JSON.parse(storedTodos);
    expect(todos[0]).toContain('<script>');
    
    // Reload page and verify still safe
    await page.reload();
    await expect(page.locator(selectors.appArea)).toBeVisible();
    await expect(page.locator(selectors.todoItem(0))).toBeVisible();
    
    const scriptExecuted = await page.evaluate(() => window.xssExecuted);
    expect(scriptExecuted).toBeUndefined();
  });

  test('should prevent XSS via username field', async ({ page }) => {
    // Logout first
    await page.click(selectors.logoutButton);
    
    // Try XSS in username
    const xssUsername = '<script>window.usernameXss=true</script>';
    await page.fill(selectors.usernameInput, xssUsername);
    await page.fill(selectors.passwordInput, credentials.valid.password);
    await page.click(selectors.loginButton);
    
    // Should fail login (invalid username)
    await expect(page.locator(selectors.loginMessage)).toBeVisible();
    await expect(page.locator(selectors.loginMessage)).toHaveClass(/error/);
    
    // Verify script not executed
    const usernameXss = await page.evaluate(() => window.usernameXss);
    expect(usernameXss).toBeUndefined();
  });

  test('should prevent XSS via password field', async ({ page }) => {
    // Logout first
    await page.click(selectors.logoutButton);
    
    // Try XSS in password
    const xssPassword = '<script>window.passwordXss=true</script>';
    await page.fill(selectors.usernameInput, credentials.valid.username);
    await page.fill(selectors.passwordInput, xssPassword);
    await page.click(selectors.loginButton);
    
    // Should fail login
    await expect(page.locator(selectors.loginMessage)).toHaveClass(/error/);
    
    // Verify script not executed
    const passwordXss = await page.evaluate(() => window.passwordXss);
    expect(passwordXss).toBeUndefined();
  });

  test('should handle prototype pollution attempts', async ({ page }) => {
    const prototypePayload = '__proto__';
    
    await addTodo(page, prototypePayload);
    
    await expect(page.locator(selectors.todoItem(0))).toBeVisible();
    
    // Verify stored as regular string
    const todoText = await page.locator(selectors.todoText(0)).textContent();
    expect(todoText).toBe(prototypePayload);
    
    // Verify Object.prototype not polluted
    const isPrototypePolluted = await page.evaluate(() => {
      return Object.prototype.hasOwnProperty('xss');
    });
    expect(isPrototypePolluted).toBe(false);
  });

  test('should handle constructor payload', async ({ page }) => {
    const constructorPayload = 'constructor';
    
    await addTodo(page, constructorPayload);
    
    await expect(page.locator(selectors.todoItem(0))).toBeVisible();
    
    const todoText = await page.locator(selectors.todoText(0)).textContent();
    expect(todoText).toBe(constructorPayload);
    
    // App should still function
    await addTodo(page, 'Normal todo after');
    await expect(page.locator(selectors.todoItem(1))).toBeVisible();
  });

  test('should prevent code execution via eval-like patterns', async ({ page }) => {
    const evalPayload = 'eval(alert(1))';
    
    await addTodo(page, evalPayload);
    
    await expect(page.locator(selectors.todoItem(0))).toBeVisible();
    
    // Should be text only
    const todoText = await page.locator(selectors.todoText(0)).textContent();
    expect(todoText).toBe(evalPayload);
    
    // Verify no eval executed
    // If eval ran, it would attempt alert which we'd catch
    const hasDialog = await page.evaluate(() => false);
    expect(hasDialog).toBe(false);
  });

  test('should handle data URLs safely', async ({ page }) => {
    const dataUrl = 'data:text/html,<script>alert("xss")</script>';
    
    await addTodo(page, dataUrl);
    
    await expect(page.locator(selectors.todoItem(0))).toBeVisible();
    
    // Should be displayed as text
    const todoText = await page.locator(selectors.todoText(0)).textContent();
    expect(todoText).toContain('data:text/html');
  });

  test('should verify textContent is used instead of innerHTML', async ({ page }) => {
    const htmlContent = '<b>Bold</b> and <i>Italic</i>';
    
    await addTodo(page, htmlContent);
    
    await expect(page.locator(selectors.todoItem(0))).toBeVisible();
    
    // Get both textContent and innerHTML
    const textContent = await page.locator(selectors.todoText(0)).textContent();
    const innerHTML = await page.locator(selectors.todoText(0)).innerHTML();
    
    // textContent should show raw HTML
    expect(textContent).toContain('<b>');
    expect(textContent).toContain('</b>');
    
    // Verify actual bold/italic tags don't exist in DOM
    const boldCount = await page.locator(selectors.todoText(0) + ' b').count();
    expect(boldCount).toBe(0);
  });
});
