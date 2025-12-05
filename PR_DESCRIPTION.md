# Add Playwright Test Suite

## 📋 Overview
This PR adds a Playwright test suite with **33 tests** covering authentication, todo functionality, form validation, and basic accessibility.

## 🧪 Test Coverage

### Test Suites (4 categories)

| Suite | File | Tests | Purpose |
|-------|------|-------|---------|
| **Smoke** | `tests/smoke/auth.spec.js` | 9 | Login, logout, session persistence |
| **E2E** | `tests/e2e/todo.spec.js` | 12 | Todo CRUD operations, persistence |
| **Integration** | `tests/integration/form.spec.js` | 8 | Form validation, keyboard navigation |
| **Accessibility** | `tests/a11y/a11y.spec.js` | 4 | Basic a11y checks, keyboard support |

**Total: 33 tests** across 2 browsers (Chromium, Firefox)

## 📦 What's Added

### Dependencies
- `@playwright/test` v1.48.0 - Testing framework
- `@axe-core/playwright` v4.10.0 - Accessibility testing

### Configuration
- **playwright.config.js** - Multi-browser test configuration
- **tests/helpers/** - Reusable test utilities and fixtures
- **.github/workflows/playwright.yml** - CI/CD automation

### HTML Changes
Added `data-test-id` attributes for stable test selectors:
- Login: `username-input`, `password-input`, `login-button`
- Todo: `todo-input`, `add-todo-button`, `todo-item-{index}`
- Accessibility: `role` and `aria-live` attributes

**No functional changes** - attributes are for testing only.

## 🚀 Running Tests

```bash
# Start server
npm start

# Run all tests (in another terminal)
npm test

# Run specific suite
npx playwright test tests/smoke/
npx playwright test tests/e2e/

# Run with UI
npx playwright test --ui

# View report
npm run test:report
```

## ✅ CI/CD
GitHub Actions automatically runs tests on push/PR:
- Runs on Ubuntu with Node.js 18
- Tests across all configured browsers
- Uploads artifacts (screenshots, videos) on failure
- Smoke tests run separately for quick feedback

## 📝 Test Examples

**Authentication:**
- ✅ Login with valid credentials
- ✅ Login fails with invalid credentials
- ✅ Session persists after page reload
- ✅ Logout clears session

**Todo Functionality:**
- ✅ Add and delete todos
- ✅ Multiple todos persist
- ✅ Empty/whitespace validation

**Accessibility:**
- ✅ No axe-core violations
- ✅ Keyboard navigation works
- ✅ Labels properly associated


---

**Ready to merge!** All tests passing locally and in CI. 🎉
