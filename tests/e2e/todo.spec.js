/**
 * End-to-End Tests - Todo Functionality
 * 
 * Full E2E flows testing the complete todo management lifecycle:
 * - Adding single and multiple todos
 * - Deleting todos
 * - Persistence across page reloads
 * - Long session flows with multiple operations
 */

const { test, expect } = require('../helpers/fixtures');
const { 
  selectors,
  loginAndWaitForApp,
  addTodo,
  deleteTodo,
  getTodoCount,
  getAllTodoTexts,
  logout,
  clearStorage
} = require('../helpers/test-helpers');

test.describe('Todo Management - E2E Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Start with clean state and login
    await page.goto('/');
    await clearStorage(page);
    await loginAndWaitForApp(page);
  });

  test('should add a single todo item', async ({ page }) => {
    const todoText = 'Buy groceries';
    
    // Add todo
    await addTodo(page, todoText);
    
    // Verify todo appears in the list
    await expect(page.locator(selectors.todoItem(0))).toBeVisible();
    await expect(page.locator(selectors.todoText(0))).toHaveText(todoText);
    
    // Verify count
    const count = await getTodoCount(page);
    expect(count).toBe(1);
  });

  test('should add multiple todo items', async ({ page }) => {
    const todos = ['Task 1', 'Task 2', 'Task 3'];
    
    // Add multiple todos
    for (const todo of todos) {
      await addTodo(page, todo);
    }
    
    // Verify all todos appear
    const count = await getTodoCount(page);
    expect(count).toBe(3);
    
    // Verify content of each todo
    const todoTexts = await getAllTodoTexts(page);
    expect(todoTexts).toEqual(todos);
  });

  test('should delete a todo item', async ({ page }) => {
    // Add a todo first
    await addTodo(page, 'Todo to delete');
    
    // Verify it exists
    await expect(page.locator(selectors.todoItem(0))).toBeVisible();
    
    // Delete the todo
    await deleteTodo(page, 0);
    
    // Verify it's removed
    const count = await getTodoCount(page);
    expect(count).toBe(0);
  });

  test('should delete specific todo from multiple items', async ({ page }) => {
    const todos = ['First', 'Second', 'Third'];
    
    // Add multiple todos
    for (const todo of todos) {
      await addTodo(page, todo);
    }
    
    // Delete the middle one (index 1)
    await deleteTodo(page, 1);
    
    // Verify remaining todos
    const count = await getTodoCount(page);
    expect(count).toBe(2);
    
    // Verify correct todos remain (note: indices shift after deletion)
    const remainingTexts = await getAllTodoTexts(page);
    expect(remainingTexts).toEqual(['First', 'Third']);
  });

  test('should persist todos after page reload', async ({ page }) => {
    const todos = ['Persistent todo 1', 'Persistent todo 2'];
    
    // Add todos
    for (const todo of todos) {
      await addTodo(page, todo);
    }
    
    // Verify todos exist
    let count = await getTodoCount(page);
    expect(count).toBe(2);
    
    // Reload page
    await page.reload();
    
    // Wait for app area to be visible (should auto-login from localStorage)
    await expect(page.locator(selectors.appArea)).toBeVisible();
    
    // Verify todos still exist
    count = await getTodoCount(page);
    expect(count).toBe(2);
    
    const todoTexts = await getAllTodoTexts(page);
    expect(todoTexts).toEqual(todos);
  });

  test('should clear input field after adding todo', async ({ page }) => {
    const todoText = 'Test todo';
    
    // Add todo
    await page.fill(selectors.todoInput, todoText);
    await page.click(selectors.addTodoButton);
    
    // Wait for todo to appear
    await expect(page.locator(selectors.todoItem(0))).toBeVisible();
    
    // Verify input is cleared
    await expect(page.locator(selectors.todoInput)).toHaveValue('');
  });

  test('should maintain focus on input after adding todo', async ({ page }) => {
    const todoText = 'Test todo';
    
    // Add todo
    await page.fill(selectors.todoInput, todoText);
    await page.click(selectors.addTodoButton);
    
    // Wait briefly
    await page.waitForTimeout(200);
    
    // Note: The app sets focus back to input after adding
    // We can verify by checking if we can immediately type
    await page.keyboard.type('Second todo');
    const inputValue = await page.locator(selectors.todoInput).inputValue();
    expect(inputValue).toBe('Second todo');
  });

  test('should handle long session with multiple operations', async ({ page }) => {
    // Step 1: Add 3 todos
    await addTodo(page, 'Todo 1');
    await addTodo(page, 'Todo 2');
    await addTodo(page, 'Todo 3');
    
    let count = await getTodoCount(page);
    expect(count).toBe(3);
    
    // Step 2: Reload page
    await page.reload();
    await expect(page.locator(selectors.appArea)).toBeVisible();
    
    count = await getTodoCount(page);
    expect(count).toBe(3);
    
    // Step 3: Delete first todo
    await deleteTodo(page, 0);
    
    count = await getTodoCount(page);
    expect(count).toBe(2);
    
    // Step 4: Add another todo
    await addTodo(page, 'Todo 4');
    
    count = await getTodoCount(page);
    expect(count).toBe(3);
    
    // Step 5: Verify final state
    const finalTodos = await getAllTodoTexts(page);
    expect(finalTodos).toEqual(['Todo 2', 'Todo 3', 'Todo 4']);
    
    // Step 6: Logout
    await logout(page);
    
    // Step 7: Login again
    await loginAndWaitForApp(page);
    
    // Step 8: Verify todos still persist
    count = await getTodoCount(page);
    expect(count).toBe(3);
    
    const persistedTodos = await getAllTodoTexts(page);
    expect(persistedTodos).toEqual(['Todo 2', 'Todo 3', 'Todo 4']);
  });

  test('should add todo using Enter key', async ({ page }) => {
    const todoText = 'Todo via Enter key';
    
    // Fill input
    await page.fill(selectors.todoInput, todoText);
    
    // Press Enter
    await page.press(selectors.todoInput, 'Enter');
    
    // Verify todo added
    await expect(page.locator(selectors.todoItem(0))).toBeVisible();
    await expect(page.locator(selectors.todoText(0))).toHaveText(todoText);
  });

  test('should handle adding many todos (stress test)', async ({ page }) => {
    const todoCount = 20;
    
    // Add many todos
    for (let i = 1; i <= todoCount; i++) {
      await addTodo(page, `Todo ${i}`);
    }
    
    // Verify count
    const count = await getTodoCount(page);
    expect(count).toBe(todoCount);
    
    // Verify first and last todos
    await expect(page.locator(selectors.todoText(0))).toHaveText('Todo 1');
    await expect(page.locator(selectors.todoText(todoCount - 1))).toHaveText(`Todo ${todoCount}`);
  });

  test('should handle delete all todos one by one', async ({ page }) => {
    // Add multiple todos
    await addTodo(page, 'Todo 1');
    await addTodo(page, 'Todo 2');
    await addTodo(page, 'Todo 3');
    
    let count = await getTodoCount(page);
    expect(count).toBe(3);
    
    // Delete all todos (always delete index 0)
    for (let i = 0; i < 3; i++) {
      await deleteTodo(page, 0);
    }
    
    // Verify all deleted
    count = await getTodoCount(page);
    expect(count).toBe(0);
    
    // Verify list is empty
    const listItems = await page.locator(selectors.todoList + ' li').count();
    expect(listItems).toBe(0);
  });

  test('should maintain correct indices after multiple deletes', async ({ page }) => {
    // Add 5 todos
    for (let i = 1; i <= 5; i++) {
      await addTodo(page, `Todo ${i}`);
    }
    
    // Delete todos at various positions
    await deleteTodo(page, 1); // Delete "Todo 2"
    await deleteTodo(page, 2); // Delete "Todo 4" (now at index 2)
    
    // Verify remaining todos
    const remainingTodos = await getAllTodoTexts(page);
    expect(remainingTodos).toEqual(['Todo 1', 'Todo 3', 'Todo 5']);
  });
});
