/**
 * Performance Tests
 * 
 * Basic performance checks including:
 * - Page load times
 * - Operation timing (add todo, delete todo)
 * - Thresholds for acceptable performance
 * 
 * THRESHOLDS (configured in comments):
 * - Page load: < 3000ms
 * - Add todo operation: < 500ms
 * - Delete todo operation: < 300ms
 */

const { test, expect } = require('../helpers/fixtures');
const { 
  selectors,
  clearStorage,
  loginAndWaitForApp,
  measureDuration,
  addTodo
} = require('../helpers/test-helpers');

test.describe('Performance Tests', () => {
  // Performance thresholds (in milliseconds)
  const THRESHOLDS = {
    PAGE_LOAD: 3000,
    LOGIN_OPERATION: 2000,
    ADD_TODO: 500,
    DELETE_TODO: 300,
    RENDER_MANY_TODOS: 2000,
  };

  test('should load initial page within acceptable time', async ({ page }) => {
    const startTime = Date.now();
    
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');
    
    const loadTime = Date.now() - startTime;
    
    console.log(`Page load time: ${loadTime}ms`);
    expect(loadTime).toBeLessThan(THRESHOLDS.PAGE_LOAD);
  });

  test('should complete login within acceptable time', async ({ page }) => {
    await page.goto('/');
    await clearStorage(page);
    
    // Measure login operation
    const { duration } = await measureDuration(async () => {
      await page.fill(selectors.usernameInput, 'user');
      await page.fill(selectors.passwordInput, 'pw');
      await page.click(selectors.loginButton);
      await page.waitForSelector(selectors.appArea, { state: 'visible' });
    });
    
    console.log(`Login operation time: ${duration}ms`);
    expect(duration).toBeLessThan(THRESHOLDS.LOGIN_OPERATION);
  });

  test('should add todo within acceptable time', async ({ page }) => {
    await page.goto('/');
    await clearStorage(page);
    await loginAndWaitForApp(page);
    
    // Measure add todo operation
    const { duration } = await measureDuration(async () => {
      await page.fill(selectors.todoInput, 'Performance test todo');
      await page.click(selectors.addTodoButton);
      await page.waitForSelector(selectors.todoItem(0), { state: 'visible' });
    });
    
    console.log(`Add todo operation time: ${duration}ms`);
    expect(duration).toBeLessThan(THRESHOLDS.ADD_TODO);
  });

  test('should delete todo within acceptable time', async ({ page }) => {
    await page.goto('/');
    await clearStorage(page);
    await loginAndWaitForApp(page);
    
    // Add a todo first
    await addTodo(page, 'Todo to delete');
    await expect(page.locator(selectors.todoItem(0))).toBeVisible();
    
    // Measure delete operation
    const { duration } = await measureDuration(async () => {
      await page.click(selectors.deleteTodoButton(0));
      await page.waitForTimeout(100); // Brief wait for DOM update
    });
    
    console.log(`Delete todo operation time: ${duration}ms`);
    expect(duration).toBeLessThan(THRESHOLDS.DELETE_TODO);
  });

  test('should render many todos within acceptable time', async ({ page }) => {
    await page.goto('/');
    await clearStorage(page);
    await loginAndWaitForApp(page);
    
    const todoCount = 50;
    
    // Measure adding many todos
    const { duration } = await measureDuration(async () => {
      for (let i = 1; i <= todoCount; i++) {
        await page.fill(selectors.todoInput, `Todo ${i}`);
        await page.click(selectors.addTodoButton);
      }
      
      // Wait for last todo to be visible
      await page.waitForSelector(selectors.todoItem(todoCount - 1), { state: 'visible' });
    });
    
    console.log(`Rendering ${todoCount} todos took: ${duration}ms`);
    expect(duration).toBeLessThan(THRESHOLDS.RENDER_MANY_TODOS);
  });

  test('should measure navigation timing', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('load');
    
    const timing = await page.evaluate(() => {
      const perfData = window.performance.timing;
      return {
        dns: perfData.domainLookupEnd - perfData.domainLookupStart,
        tcp: perfData.connectEnd - perfData.connectStart,
        request: perfData.responseStart - perfData.requestStart,
        response: perfData.responseEnd - perfData.responseStart,
        dom: perfData.domComplete - perfData.domLoading,
        load: perfData.loadEventEnd - perfData.loadEventStart,
        total: perfData.loadEventEnd - perfData.navigationStart,
      };
    });
    
    console.log('Navigation timing:', timing);
    
    // Verify timing data is reasonable
    expect(timing.total).toBeGreaterThan(0);
    expect(timing.total).toBeLessThan(THRESHOLDS.PAGE_LOAD);
  });

  test('should measure localStorage operations performance', async ({ page }) => {
    await page.goto('/');
    await clearStorage(page);
    await loginAndWaitForApp(page);
    
    // Measure time to add and persist 10 todos
    const { duration } = await measureDuration(async () => {
      for (let i = 1; i <= 10; i++) {
        await addTodo(page, `Todo ${i}`);
      }
    });
    
    console.log(`Adding 10 todos with localStorage: ${duration}ms`);
    
    // Should be reasonably fast
    expect(duration).toBeLessThan(2000);
  });

  test('should reload page with stored data quickly', async ({ page }) => {
    await page.goto('/');
    await clearStorage(page);
    await loginAndWaitForApp(page);
    
    // Add some todos
    for (let i = 1; i <= 10; i++) {
      await addTodo(page, `Todo ${i}`);
    }
    
    // Measure reload time
    const { duration } = await measureDuration(async () => {
      await page.reload();
      await page.waitForLoadState('domcontentloaded');
      await expect(page.locator(selectors.appArea)).toBeVisible();
      await expect(page.locator(selectors.todoItem(9))).toBeVisible();
    });
    
    console.log(`Reload with 10 todos: ${duration}ms`);
    expect(duration).toBeLessThan(THRESHOLDS.PAGE_LOAD);
  });

  test('should measure input responsiveness', async ({ page }) => {
    await page.goto('/');
    await clearStorage(page);
    await loginAndWaitForApp(page);
    
    const longText = 'A'.repeat(500);
    
    // Measure time to type long text
    const { duration } = await measureDuration(async () => {
      await page.fill(selectors.todoInput, longText);
    });
    
    console.log(`Typing ${longText.length} characters: ${duration}ms`);
    
    // Should be instant (fill is fast)
    expect(duration).toBeLessThan(100);
  });

  test('should handle rapid interactions without lag', async ({ page }) => {
    await page.goto('/');
    await clearStorage(page);
    await loginAndWaitForApp(page);
    
    // Rapidly add multiple todos
    const { duration } = await measureDuration(async () => {
      for (let i = 1; i <= 5; i++) {
        await page.fill(selectors.todoInput, `Rapid ${i}`);
        await page.click(selectors.addTodoButton);
      }
    });
    
    console.log(`5 rapid todo additions: ${duration}ms`);
    
    // Should complete quickly
    expect(duration).toBeLessThan(1500);
    
    // Verify all todos were added
    const count = await page.locator(selectors.todoList + ' li').count();
    expect(count).toBe(5);
  });
});
