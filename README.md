# Playwright Test Playground

A minimal Node.js web application with a **comprehensive Playwright test suite**. This project demonstrates best practices for E2E testing, including smoke tests, integration tests, visual regression, accessibility checks, security tests, and more.

## About This Project

This is a simple Express-based web app with:
- **Fake authentication system**: Login with username `user` and password `pw`
- **Todo list functionality**: Add and delete todos (stored in localStorage)
- **Clean HTML structure**: All interactive elements have stable IDs and data-test-id attributes for reliable test selectors
- **Full test coverage**: Comprehensive Playwright test suite covering all major scenarios

## Installation

```bash
npm install
```

## Running the Application

Start the server:

```bash
npm start
```

Or use nodemon for development (auto-restart on file changes):

```bash
npm run dev
```

The application will be available at **http://localhost:3000**

## Application Behavior

### Login Flow
- Navigate to http://localhost:3000
- **Valid credentials**: username = `user`, password = `pw`
- **Invalid credentials**: Any other combination will show an error message
- Successful login stores a flag in localStorage and displays the todo app
- Login state persists across page refreshes

### Todo Management
- Once logged in, you can:
  - Add new todos via the input field
  - Delete existing todos via the delete button
  - All todos are stored in localStorage
  - Todos persist across sessions

### Logout
- Click the logout button to clear the login state and return to the login screen

## DOM Element IDs for Testing

The following stable IDs and data-test-id attributes are available for writing Playwright selectors:

### Login Area
- `[data-test-id="login-area"]` - Container for login section
- `[data-test-id="login-form"]` - Login form element
- `[data-test-id="username-input"]` - Username input field
- `[data-test-id="password-input"]` - Password input field
- `[data-test-id="login-button"]` - Login submit button
- `[data-test-id="login-message"]` - Status message (shows success/error, has `role="status"` and `aria-live="polite"`)

### App Area
- `[data-test-id="app-area"]` - Container for todo app (hidden until logged in)
- `[data-test-id="logout-button"]` - Logout button
- `[data-test-id="todo-form"]` - Form for adding todos
- `[data-test-id="todo-input"]` - Input field for new todo text
- `[data-test-id="add-todo-button"]` - Add todo button
- `[data-test-id="todo-list"]` - Unordered list container for todos (has `role="list"`)

### Dynamic Todo Items
- `[data-test-id="todo-item-{index}"]` - Individual todo item container
- `[data-test-id="todo-text-{index}"]` - Todo text content
- `[data-test-id="delete-todo-{index}"]` - Delete button for specific todo

**Note**: All `data-test-id` attributes were added specifically for test stability and do not affect application functionality. Legacy `id` attributes remain for backward compatibility.

## Project Structure

```
.
├── .github/
│   └── workflows/
│       └── playwright.yml   # CI/CD workflow for automated testing
├── tests/                   # Playwright test suites
│   ├── helpers/
│   │   ├── test-helpers.js # Reusable test utilities and selectors
│   │   └── fixtures.js     # Custom Playwright fixtures
│   ├── smoke/
│   │   └── auth.spec.js    # Smoke tests for authentication (10 tests)
│   ├── e2e/
│   │   └── todo.spec.js    # End-to-end todo functionality tests (12 tests)
│   ├── integration/
│   │   └── form.spec.js    # Form validation tests (15+ tests)
│   └── a11y/
│       └── a11y.spec.js    # Basic accessibility tests (4 tests)
├── server.js                # Express server
├── package.json             # Dependencies and test scripts
├── playwright.config.js     # Playwright configuration
├── public/
│   ├── index.html          # Main HTML page (with data-test-id attributes)
│   └── app.js              # Client-side JavaScript
└── README.md               # This file
```

## Testing

### Prerequisites

Install Playwright browsers (first time only):

```bash
npx playwright install
```

Or with system dependencies:

```bash
npx playwright install --with-deps
```

### Running Tests Locally

**Important**: Start the server before running tests:

```bash
# Terminal 1: Start the server
npm start

# Terminal 2: Run tests
npm test
```

### Test Commands

```bash
# Run all tests
npm test

# Run tests in headed mode (see browser)
npm run test:headed

# Run specific test file
npx playwright test tests/smoke/auth.spec.js

# Run tests for specific browser
npx playwright test --project=chromium
npx playwright test --project=firefox
npx playwright test --project=webkit

# Run tests in debug mode
npx playwright test --debug

# Run tests with UI mode (interactive)
npx playwright test --ui

# Run specific test suite
npx playwright test tests/e2e/
npx playwright test tests/smoke/
npx playwright test tests/a11y/

# View HTML test report
npm run test:report

# Run tests in CI mode
npm run test:ci
```

### Test Suites Overview

This project includes **~40 total tests** covering essential functionality:

| Suite | Description | Test Count |
|-------|-------------|------------|
| **smoke/auth.spec.js** | Core authentication: login, logout, session persistence | 10 tests |
| **e2e/todo.spec.js** | Complete todo flows: add, delete, persistence, multiple items | 12 tests |
| **integration/form.spec.js** | Form validation, keyboard navigation, required fields | 15 tests |
| **a11y/a11y.spec.js** | Basic accessibility: axe-core checks, keyboard nav, labels | 4 tests |

**Total: ~41 tests** covering authentication, core features, form validation, and accessibility basics.

### Debugging Tests

```bash
# Run with Playwright Inspector
npx playwright test --debug

# Run specific test in debug mode
npx playwright test tests/smoke/auth.spec.js:10 --debug

# Generate trace for failed tests (already configured)
npx playwright show-trace trace.zip

# Open last HTML report
npx playwright show-report
```

### Test Artifacts

Tests automatically generate artifacts on failure:
- **Screenshots**: Captured on test failure
- **Videos**: Recorded for failed tests
- **Traces**: Full execution traces for debugging (open with `npx playwright show-trace`)
- **HTML Report**: Comprehensive report with test results

Artifacts are stored in:
- `test-results/` - Test execution artifacts
- `playwright-report/` - HTML report
- `tests/__snapshots__/` - Visual regression baseline images

### CI/CD Integration

Tests run automatically on:
- Push to `main` or `test/playwright` branches
- Pull requests to `main`

The CI workflow:
1. Runs smoke tests across all browsers
2. Executes full test suite in matrix (chromium, firefox, webkit)
3. Uploads test reports and artifacts
4. Publishes results as GitHub Actions artifacts

View CI results in the **Actions** tab of the GitHub repository.

### Environment Variables

Override the base URL for tests:

```bash
PLAYWRIGHT_BASE_URL=http://localhost:3000 npm test
```

## Next Steps

Explore the test files to learn:
- How to structure Playwright tests
- Best practices for selectors and fixtures
- Patterns for authentication and state management
- Visual regression and accessibility testing
- Performance measurement and security validation

Happy testing! 🎭
