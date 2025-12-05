/**
 * Test helpers and utilities for Playwright tests
 * Provides common functions for authentication, cleanup, and selectors
 */

const { expect } = require('@playwright/test');
const path = require('path');
const fs = require('fs');

/**
 * Centralized selectors for the application
 */
const selectors = {
  // Login page selectors
  loginArea: '[data-test-id="login-area"]',
  loginForm: '[data-test-id="login-form"]',
  usernameInput: '[data-test-id="username-input"]',
  passwordInput: '[data-test-id="password-input"]',
  loginButton: '[data-test-id="login-button"]',
  loginMessage: '[data-test-id="login-message"]',
  
  // App area selectors
  appArea: '[data-test-id="app-area"]',
  logoutButton: '[data-test-id="logout-button"]',
  todoForm: '[data-test-id="todo-form"]',
  todoInput: '[data-test-id="todo-input"]',
  addTodoButton: '[data-test-id="add-todo-button"]',
  todoList: '[data-test-id="todo-list"]',
  
  // Dynamic selectors
  todoItem: (index) => `[data-test-id="todo-item-${index}"]`,
  todoText: (index) => `[data-test-id="todo-text-${index}"]`,
  deleteTodoButton: (index) => `[data-test-id="delete-todo-${index}"]`,
};

/**
 * Valid credentials for the application
 */
const credentials = {
  valid: {
    username: 'user',
    password: 'pw',
  },
  invalid: {
    username: 'wronguser',
    password: 'wrongpass',
  },
};

/**
 * Clear localStorage to ensure test isolation
 * @param {import('@playwright/test').Page} page - Playwright page object
 */
async function clearStorage(page) {
  await page.evaluate(() => {
    localStorage.clear();
    sessionStorage.clear();
  });
}

/**
 * Perform login via UI
 * @param {import('@playwright/test').Page} page - Playwright page object
 * @param {string} username - Username to login with
 * @param {string} password - Password to login with
 */
async function login(page, username = credentials.valid.username, password = credentials.valid.password) {
  await page.goto('/');
  await page.fill(selectors.usernameInput, username);
  await page.fill(selectors.passwordInput, password);
  await page.click(selectors.loginButton);
  
  // Wait for either success or error message
  await page.waitForSelector(selectors.loginMessage, { state: 'visible', timeout: 5000 });
}

/**
 * Perform login and wait for app area to be visible
 * @param {import('@playwright/test').Page} page - Playwright page object
 */
async function loginAndWaitForApp(page) {
  await login(page);
  await page.waitForSelector(selectors.appArea, { state: 'visible' });
  await expect(page.locator(selectors.loginArea)).toBeHidden();
}

/**
 * Generate authenticated storage state for reuse across tests
 * @param {import('@playwright/test').Page} page - Playwright page object
 * @param {string} storageStatePath - Path to save the storage state
 */
async function generateAuthState(page, storageStatePath) {
  await loginAndWaitForApp(page);
  
  // Save storage state
  await page.context().storageState({ path: storageStatePath });
  
  return storageStatePath;
}

/**
 * Load authenticated storage state path
 * @returns {string} Path to the auth state file
 */
function getAuthStatePath() {
  return path.join(__dirname, 'auth-state.json');
}

/**
 * Add a todo item via UI
 * @param {import('@playwright/test').Page} page - Playwright page object
 * @param {string} todoText - Text of the todo to add
 */
async function addTodo(page, todoText) {
  await page.fill(selectors.todoInput, todoText);
  await page.click(selectors.addTodoButton);
  
  // Wait for the todo to appear in the list
  await page.waitForTimeout(100); // Brief wait for DOM update
}

/**
 * Delete a todo item by index
 * @param {import('@playwright/test').Page} page - Playwright page object
 * @param {number} index - Index of the todo to delete
 */
async function deleteTodo(page, index) {
  await page.click(selectors.deleteTodoButton(index));
  await page.waitForTimeout(100); // Brief wait for DOM update
}

/**
 * Get count of todos in the list
 * @param {import('@playwright/test').Page} page - Playwright page object
 * @returns {Promise<number>} Count of todos
 */
async function getTodoCount(page) {
  const todos = await page.locator(selectors.todoList + ' li').count();
  return todos;
}

/**
 * Get all todo texts from the list
 * @param {import('@playwright/test').Page} page - Playwright page object
 * @returns {Promise<string[]>} Array of todo texts
 */
async function getAllTodoTexts(page) {
  const todoItems = await page.locator(selectors.todoList + ' li span').allTextContents();
  return todoItems;
}

/**
 * Wait for the application to be ready
 * @param {import('@playwright/test').Page} page - Playwright page object
 */
async function waitForApp(page) {
  await page.waitForLoadState('domcontentloaded');
  await page.waitForSelector('.container', { state: 'visible' });
}

/**
 * Check if user is logged in (app area visible)
 * @param {import('@playwright/test').Page} page - Playwright page object
 * @returns {Promise<boolean>} True if logged in
 */
async function isLoggedIn(page) {
  return await page.locator(selectors.appArea).isVisible();
}

/**
 * Perform logout
 * @param {import('@playwright/test').Page} page - Playwright page object
 */
async function logout(page) {
  await page.click(selectors.logoutButton);
  await page.waitForSelector(selectors.loginArea, { state: 'visible' });
}

/**
 * Set localStorage data directly
 * @param {import('@playwright/test').Page} page - Playwright page object
 * @param {Object} data - Key-value pairs to set in localStorage
 */
async function setLocalStorage(page, data) {
  await page.evaluate((storageData) => {
    for (const [key, value] of Object.entries(storageData)) {
      localStorage.setItem(key, value);
    }
  }, data);
}

/**
 * Get localStorage data
 * @param {import('@playwright/test').Page} page - Playwright page object
 * @param {string} key - Key to retrieve from localStorage
 * @returns {Promise<string|null>} Value from localStorage
 */
async function getLocalStorage(page, key) {
  return await page.evaluate((storageKey) => {
    return localStorage.getItem(storageKey);
  }, key);
}

/**
 * Measure page load time
 * @param {import('@playwright/test').Page} page - Playwright page object
 * @returns {Promise<number>} Load time in milliseconds
 */
async function measurePageLoadTime(page) {
  const timing = await page.evaluate(() => {
    const perfData = window.performance.timing;
    return perfData.loadEventEnd - perfData.navigationStart;
  });
  return timing;
}

/**
 * Measure action duration
 * @param {Function} action - Async function to measure
 * @returns {Promise<{result: any, duration: number}>} Result and duration in ms
 */
async function measureDuration(action) {
  const start = Date.now();
  const result = await action();
  const duration = Date.now() - start;
  return { result, duration };
}

module.exports = {
  selectors,
  credentials,
  clearStorage,
  login,
  loginAndWaitForApp,
  generateAuthState,
  getAuthStatePath,
  addTodo,
  deleteTodo,
  getTodoCount,
  getAllTodoTexts,
  waitForApp,
  isLoggedIn,
  logout,
  setLocalStorage,
  getLocalStorage,
  measurePageLoadTime,
  measureDuration,
};
