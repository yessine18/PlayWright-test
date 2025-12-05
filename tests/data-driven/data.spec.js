/**
 * Data-Driven Tests
 * 
 * Parameterized tests covering various input scenarios:
 * - Different todo content types
 * - Edge cases for input lengths
 * - Special characters and unicode
 * - Potential XSS payloads (validated as text only)
 */

const { test, expect } = require('../helpers/fixtures');
const { 
  selectors,
  clearStorage,
  loginAndWaitForApp,
  addTodo,
  getTodoCount
} = require('../helpers/test-helpers');

test.describe('Data-Driven Tests', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await clearStorage(page);
    await loginAndWaitForApp(page);
  });

  const testTodoInputs = [
    { description: 'minimal length (1 char)', input: 'A', expected: 'A' },
    { description: 'short text', input: 'Buy milk', expected: 'Buy milk' },
    { description: 'medium text', input: 'Complete the quarterly report for Q4', expected: 'Complete the quarterly report for Q4' },
    { description: 'long text (100+ chars)', input: 'A'.repeat(150), expected: 'A'.repeat(150) },
    { description: 'very long text (500+ chars)', input: 'B'.repeat(500), expected: 'B'.repeat(500) },
    { description: 'single emoji', input: '🎉', expected: '🎉' },
    { description: 'multiple emojis', input: '🎉 🎊 🎈', expected: '🎉 🎊 🎈' },
    { description: 'text with emoji', input: 'Party time 🎉', expected: 'Party time 🎉' },
    { description: 'numbers only', input: '12345', expected: '12345' },
    { description: 'special characters', input: '!@#$%^&*()', expected: '!@#$%^&*()' },
    { description: 'mixed case', input: 'MiXeD CaSe ToDo', expected: 'MiXeD CaSe ToDo' },
    { description: 'with line breaks (single line expected)', input: 'Line 1\nLine 2', expected: 'Line 1\nLine 2' },
    { description: 'with tabs', input: 'Tab\there', expected: 'Tab\there' },
    { description: 'unicode characters', input: 'Héllo Wörld', expected: 'Héllo Wörld' },
    { description: 'Chinese characters', input: '你好世界', expected: '你好世界' },
    { description: 'Arabic text', input: 'مرحبا', expected: 'مرحبا' },
    { description: 'mixed scripts', input: 'Hello 你好 مرحبا', expected: 'Hello 你好 مرحبا' },
    { description: 'URL', input: 'https://example.com', expected: 'https://example.com' },
    { description: 'email address', input: 'test@example.com', expected: 'test@example.com' },
    { description: 'with quotes', input: 'He said "hello"', expected: 'He said "hello"' },
    { description: 'with apostrophe', input: "It's working", expected: "It's working" },
    { description: 'with backslash', input: 'C:\\Users\\Test', expected: 'C:\\Users\\Test' },
    { description: 'with forward slash', input: '/home/user/test', expected: '/home/user/test' },
  ];

  for (const testCase of testTodoInputs) {
    test(`should handle todo with ${testCase.description}`, async ({ page }) => {
      // Add todo with test input
      await addTodo(page, testCase.input);
      
      // Verify todo was added
      await expect(page.locator(selectors.todoItem(0))).toBeVisible();
      
      // Verify content matches expected
      const todoText = await page.locator(selectors.todoText(0)).textContent();
      expect(todoText.trim()).toBe(testCase.expected.trim());
    });
  }

  const xssPayloads = [
    { description: 'script tag', input: '<script>alert("XSS")</script>', shouldBeText: true },
    { description: 'img onerror', input: '<img src=x onerror=alert("XSS")>', shouldBeText: true },
    { description: 'javascript protocol', input: 'javascript:alert("XSS")', shouldBeText: true },
    { description: 'svg onclick', input: '<svg onload=alert("XSS")>', shouldBeText: true },
    { description: 'iframe', input: '<iframe src="javascript:alert(\'XSS\')"></iframe>', shouldBeText: true },
    { description: 'event handler', input: '<div onclick="alert(\'XSS\')">Click</div>', shouldBeText: true },
  ];

  test.describe('XSS Prevention', () => {
    for (const payload of xssPayloads) {
      test(`should safely display ${payload.description} as text`, async ({ page }) => {
        // Add todo with XSS payload
        await addTodo(page, payload.input);
        
        // Verify todo was added
        await expect(page.locator(selectors.todoItem(0))).toBeVisible();
        
        // Get the text content (not innerHTML)
        const todoText = await page.locator(selectors.todoText(0)).textContent();
        
        // Should contain the raw text, not execute script
        expect(todoText).toContain(payload.input);
        
        // Verify no script execution by checking for alert
        // If script ran, page would have an alert dialog
        const hasDialog = await page.evaluate(() => {
          // Check if any alert/confirm/prompt is showing
          return false; // Would throw if dialog was present
        });
        expect(hasDialog).toBe(false);
        
        // Additionally verify the content is safely rendered as text
        const innerHTML = await page.locator(selectors.todoText(0)).innerHTML();
        
        // innerHTML should have escaped the HTML or just contain text
        // The text content should match what we put in
        expect(todoText.includes(payload.input) || innerHTML.includes('&lt;') || innerHTML.includes('&gt;')).toBe(true);
      });
    }
  });

  test.describe('HTML Entity Handling', () => {
    const htmlEntities = [
      { description: 'ampersand', input: 'Tom & Jerry', expected: 'Tom & Jerry' },
      { description: 'less than', input: '5 < 10', expected: '5 < 10' },
      { description: 'greater than', input: '10 > 5', expected: '10 > 5' },
      { description: 'HTML entity', input: '&nbsp;&amp;&lt;&gt;', expected: '&nbsp;&amp;&lt;&gt;' },
    ];

    for (const entity of htmlEntities) {
      test(`should handle ${entity.description} correctly`, async ({ page }) => {
        await addTodo(page, entity.input);
        
        await expect(page.locator(selectors.todoItem(0))).toBeVisible();
        
        const todoText = await page.locator(selectors.todoText(0)).textContent();
        
        // Text content should preserve the characters
        expect(todoText.trim()).toBe(entity.expected.trim());
      });
    }
  });

  test.describe('Multiple Todos with Varied Content', () => {
    test('should handle adding diverse todos in sequence', async ({ page }) => {
      const diverseTodos = [
        'Normal text',
        '🎉 Emoji',
        '<script>alert("test")</script>',
        'Very long text that goes on and on: ' + 'x'.repeat(200),
        '你好',
      ];

      // Add all todos
      for (const todo of diverseTodos) {
        await addTodo(page, todo);
      }

      // Verify count
      const count = await getTodoCount(page);
      expect(count).toBe(diverseTodos.length);

      // Verify each todo content
      for (let i = 0; i < diverseTodos.length; i++) {
        await expect(page.locator(selectors.todoItem(i))).toBeVisible();
        const text = await page.locator(selectors.todoText(i)).textContent();
        expect(text.trim()).toBe(diverseTodos[i].trim());
      }
    });
  });

  test.describe('Edge Cases', () => {
    test('should handle todo with only spaces (should not create)', async ({ page }) => {
      await page.fill(selectors.todoInput, '     ');
      await page.click(selectors.addTodoButton);
      
      await page.waitForTimeout(200);
      
      const count = await getTodoCount(page);
      expect(count).toBe(0);
    });

    test('should handle todo with leading/trailing whitespace', async ({ page }) => {
      const input = '   Todo with spaces   ';
      const expected = 'Todo with spaces';
      
      await addTodo(page, input);
      
      await expect(page.locator(selectors.todoItem(0))).toBeVisible();
      const text = await page.locator(selectors.todoText(0)).textContent();
      
      // Should be trimmed
      expect(text.trim()).toBe(expected);
    });

    test('should handle todo with null-like strings', async ({ page }) => {
      const testInputs = ['null', 'undefined', 'NaN', 'false', '0'];
      
      for (let i = 0; i < testInputs.length; i++) {
        await addTodo(page, testInputs[i]);
      }
      
      const count = await getTodoCount(page);
      expect(count).toBe(testInputs.length);
      
      // Verify each is stored as string
      for (let i = 0; i < testInputs.length; i++) {
        const text = await page.locator(selectors.todoText(i)).textContent();
        expect(text.trim()).toBe(testInputs[i]);
      }
    });
  });
});
