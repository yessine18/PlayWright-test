/**
 * Network Mocking Tests
 * 
 * Tests network interception and mocking scenarios.
 * Note: This app uses localStorage (no network for data), so we test:
 * - Static file loading failures
 * - Simulated network delays
 * - Conceptual network failure handling
 */

const { test, expect } = require('../helpers/fixtures');
const { 
  selectors,
  clearStorage,
  loginAndWaitForApp,
  addTodo
} = require('../helpers/test-helpers');

test.describe('Network Mocking Tests', () => {
  
  test('should handle slow network for static resources', async ({ page }) => {
    // Intercept and delay CSS loading
    await page.route('**/*.css', async (route) => {
      await new Promise(resolve => setTimeout(resolve, 1000));
      route.continue();
    });
    
    const startTime = Date.now();
    await page.goto('/');
    const loadTime = Date.now() - startTime;
    
    // Should still load but take longer
    await expect(page.locator('.container')).toBeVisible();
    expect(loadTime).toBeGreaterThan(1000);
  });

  test('should handle slow JavaScript loading', async ({ page }) => {
    // Intercept and delay JS loading
    await page.route('**/app.js', async (route) => {
      await new Promise(resolve => setTimeout(resolve, 1500));
      route.continue();
    });
    
    await page.goto('/');
    
    // Page should eventually become interactive
    await expect(page.locator(selectors.loginForm)).toBeVisible({ timeout: 5000 });
  });

  test('should simulate slow server response for HTML', async ({ page }) => {
    // Delay HTML response
    await page.route('**/', async (route) => {
      await new Promise(resolve => setTimeout(resolve, 2000));
      route.continue();
    });
    
    const startTime = Date.now();
    await page.goto('/');
    const loadTime = Date.now() - startTime;
    
    await expect(page.locator('h1')).toBeVisible();
    expect(loadTime).toBeGreaterThan(2000);
  });

  test('should handle network offline scenario during usage', async ({ page }) => {
    await page.goto('/');
    await clearStorage(page);
    await loginAndWaitForApp(page);
    
    // Add a todo
    await addTodo(page, 'Todo before offline');
    await expect(page.locator(selectors.todoItem(0))).toBeVisible();
    
    // Simulate going offline
    await page.context().setOffline(true);
    
    // App should still work (uses localStorage)
    await addTodo(page, 'Todo while offline');
    await expect(page.locator(selectors.todoItem(1))).toBeVisible();
    
    // Go back online
    await page.context().setOffline(false);
    
    // Add another todo
    await addTodo(page, 'Todo after online');
    await expect(page.locator(selectors.todoItem(2))).toBeVisible();
  });

  test('should handle failed static resource loading gracefully', async ({ page }) => {
    // Block CSS from loading
    await page.route('**/*.css', route => route.abort());
    
    await page.goto('/');
    
    // Page should still load (just unstyled)
    await expect(page.locator('h1')).toBeVisible();
    await expect(page.locator(selectors.loginForm)).toBeVisible();
    
    // Functionality should still work
    await clearStorage(page);
    await page.fill(selectors.usernameInput, 'user');
    await page.fill(selectors.passwordInput, 'pw');
    await page.click(selectors.loginButton);
    
    await expect(page.locator(selectors.appArea)).toBeVisible({ timeout: 3000 });
  });

  test('should measure impact of network delay on user interaction', async ({ page }) => {
    // Add delay to all requests
    await page.route('**/*', async (route) => {
      await new Promise(resolve => setTimeout(resolve, 500));
      route.continue();
    });
    
    const startTime = Date.now();
    await page.goto('/');
    await clearStorage(page);
    await loginAndWaitForApp(page);
    const totalTime = Date.now() - startTime;
    
    console.log(`Login with 500ms delay: ${totalTime}ms`);
    
    // Should complete despite delay
    await expect(page.locator(selectors.appArea)).toBeVisible();
  });

  test('should handle intermittent network failures', async ({ page }) => {
    let requestCount = 0;
    
    // Fail every other request
    await page.route('**/*', (route) => {
      requestCount++;
      if (requestCount % 2 === 0) {
        route.abort();
      } else {
        route.continue();
      }
    });
    
    // May fail to load, but test error handling
    try {
      await page.goto('/', { timeout: 5000 });
    } catch (error) {
      // Expected to fail
      console.log('Page load failed as expected with intermittent network');
    }
  });

  test('should verify no external API calls are made', async ({ page }) => {
    const externalCalls = [];
    
    // Monitor all network requests
    page.on('request', request => {
      const url = request.url();
      // Check if it's an external domain
      if (!url.includes('localhost') && !url.startsWith('data:')) {
        externalCalls.push(url);
      }
    });
    
    await page.goto('/');
    await clearStorage(page);
    await loginAndWaitForApp(page);
    await addTodo(page, 'Test todo');
    
    // Should have no external API calls
    expect(externalCalls.length).toBe(0);
  });

  test('should handle page reload with network failures', async ({ page }) => {
    await page.goto('/');
    await clearStorage(page);
    await loginAndWaitForApp(page);
    
    // Add todos
    await addTodo(page, 'Todo 1');
    await addTodo(page, 'Todo 2');
    
    // Block network for reload (but localStorage persists)
    await page.route('**/*', route => route.abort());
    
    // Try to reload - will fail to load page but localStorage survives
    try {
      await page.reload({ timeout: 2000 });
    } catch (error) {
      // Expected to fail
      console.log('Reload failed as expected');
    }
    
    // Re-enable network and reload
    await page.unroute('**/*');
    await page.reload();
    
    // Verify todos persisted
    await expect(page.locator(selectors.appArea)).toBeVisible();
    const count = await page.locator(selectors.todoList + ' li').count();
    expect(count).toBe(2);
  });

  test('should track all network requests during session', async ({ page }) => {
    const requests = [];
    
    page.on('request', request => {
      requests.push({
        url: request.url(),
        method: request.method(),
        resourceType: request.resourceType(),
      });
    });
    
    await page.goto('/');
    await clearStorage(page);
    await loginAndWaitForApp(page);
    await addTodo(page, 'Test');
    
    // Log requests for debugging
    console.log(`Total requests: ${requests.length}`);
    
    // Verify expected resources loaded
    const htmlRequests = requests.filter(r => r.resourceType === 'document');
    const jsRequests = requests.filter(r => r.resourceType === 'script');
    const cssRequests = requests.filter(r => r.resourceType === 'stylesheet');
    
    expect(htmlRequests.length).toBeGreaterThan(0);
    expect(jsRequests.length).toBeGreaterThan(0);
    // CSS may or may not be separate depending on inline styles
  });

  test('should handle concurrent network requests', async ({ page }) => {
    let concurrentCount = 0;
    let maxConcurrent = 0;
    
    page.on('request', () => {
      concurrentCount++;
      maxConcurrent = Math.max(maxConcurrent, concurrentCount);
    });
    
    page.on('response', () => {
      concurrentCount--;
    });
    
    await page.goto('/');
    await clearStorage(page);
    await loginAndWaitForApp(page);
    
    console.log(`Max concurrent requests: ${maxConcurrent}`);
    
    // Just verify it completes without issues
    await expect(page.locator(selectors.appArea)).toBeVisible();
  });

  test('should mock a hypothetical API call for todos', async ({ page }) => {
    // Conceptual test: if app used an API, we'd mock it like this
    await page.route('**/api/todos', (route) => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([
          { id: 1, text: 'Mocked todo 1' },
          { id: 2, text: 'Mocked todo 2' },
        ]),
      });
    });
    
    // This won't actually trigger in our app, but demonstrates the pattern
    await page.goto('/');
    await clearStorage(page);
    await loginAndWaitForApp(page);
    
    // Add a real todo (not from API)
    await addTodo(page, 'Real todo');
    await expect(page.locator(selectors.todoItem(0))).toBeVisible();
  });

  test('should simulate API error response', async ({ page }) => {
    // Mock an API error (conceptual for this app)
    await page.route('**/api/**', (route) => {
      route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'Internal Server Error' }),
      });
    });
    
    await page.goto('/');
    await clearStorage(page);
    await loginAndWaitForApp(page);
    
    // App still works with localStorage
    await addTodo(page, 'Local todo');
    await expect(page.locator(selectors.todoItem(0))).toBeVisible();
  });

  test('should handle timeout scenarios', async ({ page }) => {
    // Add significant delay
    await page.route('**/app.js', async (route) => {
      await new Promise(resolve => setTimeout(resolve, 5000));
      route.continue();
    });
    
    // Try to load with timeout
    try {
      await page.goto('/', { timeout: 3000 });
    } catch (error) {
      // Expected timeout
      expect(error.message).toContain('timeout');
    }
  });
});
