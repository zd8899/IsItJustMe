# SYSTEM RULES: AUTOMATED TEST GENERATION
**CRITICAL:** You are a Test Generation Agent. Generate `.action.js` (Logic) and `.test.js` (Assertions).
**DO NOT RUN TESTS.**


**MODULE SYSTEM:** This project uses **CommonJS**.
- Use `require` / `module.exports` syntax


## 1. CORE CONSTRAINTS
- **Action Protocol:** Actions must NEVER throw. Always return `{ success: true/false, errorMessage, ...data }`.
- **Playwright Selectors:** Use `getByRole`, `getByText`, `getByLabel` etc. ❌ NO `xpath`, `css` selectors.
- **NO waitForTimeout:** ❌ NEVER use `page.waitForTimeout()` or `setTimeout()`. ✅ ALWAYS use Playwright's auto-waiting: `waitForLoadState()`, `waitForURL()`, or `expect(locator).toBeVisible()`.
- **Playwright Assertions:** Use `await expect(locator).toBeVisible()` or `.toContainText()`. ❌ NO extracting content first with `textContent()`, `innerText()`, etc. then asserting.
- **Unique Data:** ALWAYS use timestamps/random strings for creating records (e.g., `user_${Date.now()}@test.com`) to avoid conflicts.
- **Real Tests:** NO mocks/stubs unless explicitly requested. Use real browser/API interactions.
- **Exports:** Actions must export reusable data helpers (e.g., `getUserId`) for downstream tests.
- **No Conditional Assertions:** Never wrap assertions in `if` blocks. Always assert unconditionally.
- **Test Self-Containment:** Tests MUST create their own prerequisites. NEVER skip because "data doesn't exist".
- **Round-Trip Verification:** Don't just assert UI feedback. Verify the action actually worked (e.g., after registration, verify login works).

- **Ordering:** Implement **API** tests first, followed by **UI** tests.



## 2. TEST CONFIGURATION

- **Target Layer:** UI + API


### Base URLs (Playwright Projects)
URLs are configured in `playwright.config.js` via projects. Use **relative URLs** in your tests:
- **ui**: http://localhost:5173

**Example usage (relative URLs):**
```javascript
// Playwright automatically prepends baseURL from the active project
await page.goto('/login');        // Frontend tests
await page.request.get('/api/users');  // API tests
```



### API Testing
- **Scenarios:** Look for `[API]` prefix in Gherkin. API tests make HTTP requests directly (page.request).
```javascript
// Check status AND data
expect(result.statusCode).toBe(200);
expect(result.body.id).toBeDefined();
```



### UI Testing (TDD)
- **Scenarios:** Look for `[UI]` prefix in Gherkin. UI tests interact with the browser (page.goto, clicks, forms).
- **Golden Rule:** Tests MUST fail on blank/404 pages.
```javascript
// ❌ WRONG (Passes on blank page)
expect(page.url()).toContain('/profile');

// ✅ CORRECT (Fails if missing)
await expect(page.getByText('Profile')).toBeVisible();
```



## 3. REFERENCE IMPLEMENTATION (FOLLOW THIS PATTERN)
**Adopt this EXACT structure for Artifacts, Error Detection, and Return values.**

### ❌ Anti-Patterns → ✅ Correct Patterns
```javascript
// ANTI-FLAKINESS
await page.waitForTimeout(2000);              // ❌ Arbitrary delay
await page.waitForLoadState('domcontentloaded'); // ✅ Wait for actual state

const text = await el.textContent();          // ❌ Manual check
expect(text).toMatch(/pattern/);
await expect(el).toContainText(/pattern/);    // ✅ Playwright assertion

// NO CONDITIONAL ASSERTIONS
if (result.success) {                         // ❌ Zero assertions if false → passes!
  expect(result.success).toBe(true);
}
expect(result.success).toBe(true);            // ✅ Always asserts, fails if false

// TEST SELF-CONTAINMENT
if (items.length < 3) { test.skip(); }        // ❌ Skipping because data doesn't exist
const setup = await performSetupAction(page); // ✅ Call dependency action
expect(setup.success).toBe(true);             // ✅ Assert setup worked

// ROUND-TRIP VERIFICATION
await expect(page.getByText('Registered!')).toBeVisible(); // ❌ UI says success
const login = await performLoginAction(page, { email, password }); // ✅ Verify it actually worked
expect(login.success).toBe(true);
```

**Input Gherkin:**
```gherkin
Feature: Login

  Scenario: Login API Success
    When I send POST /login
    Then status is 200


  Scenario: Successful login flow
    Given I am on the login page
    When I click "Sign In"
    Then I should be redirected to the dashboard

```

**Output `.action.js`:**
```javascript
async function performLoginAction(page, context = {}) {
  try {

    // [API] API Request Logic
    // Only run if context.mode is 'api' OR if this is a shared action
    if (context.mode === 'api' || !context.mode) {
        // ... perform fetch/request ...
        const response = await page.request.post('/api/login', { ... });
        // If specifically testing API, return early with response
        if (context.mode === 'api') {
             return { success: response.ok(), statusCode: response.status(), body: await response.json() };
        }
    }



    // [UI] UI Interaction
    await page.goto('/login');
    await page.getByLabel('Email').fill('test@example.com');
    await page.getByLabel('Password').fill('Password123!');
    await page.getByRole('button', { name: 'Sign In' }).click();

    // [UI] Error Detection Pattern (Promise.race)
    const errorLocator = page.getByRole('alert');
    const outcome = await Promise.race([
        page.waitForURL('**/dashboard', { timeout: 5000 }).then(() => ({ type: 'success' })),
        errorLocator.first().waitFor({ state: 'visible', timeout: 5000 }).then(() => ({ type: 'error' }))
    ]).catch(() => ({ type: 'timeout' }));

    // Handle Outcome
    if (outcome.type === 'error' || outcome.type === 'timeout') {
      const msg = outcome.type === 'error' ? await errorLocator.textContent() : 'Timeout waiting for dashboard';
      return { success: false, errorMessage: msg };
    }

    // ✅ Anti-flakiness: waitForLoadState, not waitForTimeout
    await page.waitForLoadState('domcontentloaded');


    // Return result for downstream dependencies (call action directly, no file artifacts)
    const token = await page.evaluate(() => localStorage.getItem('token')).catch(() => null);
    return { success: true, userId: '123', token };

  } catch (error) {
    return { success: false, errorMessage: error.message };
  }
}


module.exports = { performLoginAction };

```

**Output `.test.js`:**
```javascript

const { test, expect } = require('../../../tdad-fixtures');
const { performLoginAction } = require('./login.action.js');


test.describe('Login', () => {


  // ==========================================
  // API TESTS
  // ==========================================
  test('[API] Login API', async ({ page }) => {
    const result = await performLoginAction(page, { mode: 'api' });

    // ✅ Unconditional assertions (never wrap in if blocks)
    expect(result.statusCode).toBe(200);
    expect(result.body.userId).toBeDefined();
  });



  // ==========================================
  // UI TESTS
  // ==========================================
  test('[UI] Successful login flow', async ({ page }) => {
    const result = await performLoginAction(page, { mode: 'ui' });

    // ✅ Unconditional - always assert, never wrap in if(result.success)
    expect(result.success).toBe(true, `Action failed: ${result.errorMessage}`);

    // ✅ Playwright assertions (not manual text checks)
    await expect(page).toHaveURL(/.*dashboard/);
    await expect(page.getByText('Welcome back')).toBeVisible();

    // ✅ Round-trip: verify session actually works (access protected resource)
    const profile = await page.request.get('/api/user/profile');
    expect(profile.ok()).toBe(true);
  });

});
```

---

# Test Generation: Submit Register Form

## Context
**Description:** Handle registration form submission

**Gherkin Specification:**
```gherkin
Feature: Submit Register Form
  As a user
  I want to submit the registration form
  So that I can create an account and access member features

  # NOTE: Form submission handles validation, API call, and user feedback
  # Error messages must match upstream Create User Record API responses


  # ==========================================
  # API SCENARIOS (API Request & Response)
  # ==========================================

  Scenario: [API] Submit registration with valid credentials
    Given the username "newuser123" is valid and available
    When the client sends POST request to "/api/auth/register" with username "newuser123" and password "SecurePass123!"
    Then the response status should be 201
    And the response body should contain "id"
    And the response body should contain "username" as "newuser123"

  Scenario: [API] Submit registration with username already taken
    Given a user already exists with username "existinguser"
    When the client sends POST request to "/api/auth/register" with username "existinguser" and password "ValidPass123!"
    Then the response status should be 409
    And the response error should be "Username is already taken"

  Scenario: [API] Submit registration with username too short
    When the client sends POST request to "/api/auth/register" with username "ab" and password "ValidPass123!"
    Then the response status should be 400
    And the response error should be "Username must be at least 3 characters"

  Scenario: [API] Submit registration with username too long
    When the client sends POST request to "/api/auth/register" with username "thisusernameiswaytoolongtobevalid" and password "ValidPass123!"
    Then the response status should be 400
    And the response error should be "Username must be at most 20 characters"

  Scenario: [API] Submit registration with invalid username characters
    When the client sends POST request to "/api/auth/register" with username "user@name!" and password "ValidPass123!"
    Then the response status should be 400
    And the response error should be "Username can only contain letters, numbers, and underscores"

  Scenario: [API] Submit registration with missing username
    When the client sends POST request to "/api/auth/register" with username "" and password "ValidPass123!"
    Then the response status should be 400
    And the response error should be "Username is required"

  Scenario: [API] Submit registration with missing password
    When the client sends POST request to "/api/auth/register" with username "validuser" and password ""
    Then the response status should be 400
    And the response error should be "Password is required"


  # ==========================================
  # UI SCENARIOS (User Actions & UI)
  # ==========================================

  Scenario: [UI] Successful registration redirects to home page
    Given the user is on the registration page
    And the user has entered "newuser123" in the "Username" field
    And the user has entered "SecurePass123!" in the "Password" field
    When the user clicks the "Create Account" button
    Then the user should be redirected to the home page
    And the user should see their username "newuser123" in the header

  Scenario: [UI] Display loading state during form submission
    Given the user is on the registration page
    And the user has entered "newuser123" in the "Username" field
    And the user has entered "SecurePass123!" in the "Password" field
    When the user clicks the "Create Account" button
    Then the "Create Account" button should be disabled
    And the user should see a loading indicator

  Scenario: [UI] Display error message when username is already taken
    Given the user is on the registration page
    And a user already exists with username "existinguser"
    When the user enters "existinguser" in the "Username" field
    And the user enters "ValidPass123!" in the "Password" field
    And the user clicks the "Create Account" button
    Then the user should see error message "Username is already taken"

  Scenario: [UI] Display validation error for short username
    Given the user is on the registration page
    When the user enters "ab" in the "Username" field
    And the user enters "ValidPass123!" in the "Password" field
    And the user clicks the "Create Account" button
    Then the user should see error message "Username must be at least 3 characters"

  Scenario: [UI] Display validation error for long username
    Given the user is on the registration page
    When the user enters "thisusernameiswaytoolongtobevalid" in the "Username" field
    And the user enters "ValidPass123!" in the "Password" field
    And the user clicks the "Create Account" button
    Then the user should see error message "Username must be at most 20 characters"

  Scenario: [UI] Display validation error for invalid username characters
    Given the user is on the registration page
    When the user enters "user@name!" in the "Username" field
    And the user enters "ValidPass123!" in the "Password" field
    And the user clicks the "Create Account" button
    Then the user should see error message "Username can only contain letters, numbers, and underscores"

  Scenario: [UI] Display error when username field is empty on submit
    Given the user is on the registration page
    When the user enters "ValidPass123!" in the "Password" field
    And the user clicks the "Create Account" button
    Then the user should see error message "Username is required"

  Scenario: [UI] Display error when password field is empty on submit
    Given the user is on the registration page
    When the user enters "validuser" in the "Username" field
    And the user clicks the "Create Account" button
    Then the user should see error message "Password is required"

  Scenario: [UI] Form fields retain values after validation error
    Given the user is on the registration page
    When the user enters "ab" in the "Username" field
    And the user enters "ValidPass123!" in the "Password" field
    And the user clicks the "Create Account" button
    Then the user should see error message "Username must be at least 3 characters"
    And the "Username" field should contain "ab"
```


## Dependencies

### Show Register Form
- **Action File:** `.tdad/workflows/auth/show-register-form/show-register-form.action.js`
{{#if ../isESM}}
- **Import:** `import { performShowRegisterFormAction } from '../show-register-form/show-register-form.action.js';`
{{else}}
- **Import:** `const { performShowRegisterFormAction } = require('../show-register-form/show-register-form.action.js');`
{{/if}}
- **Usage:** Call action directly to get fresh data (e.g., `const result = await performShowRegisterFormAction(page);`)

### Create User Record
- **Action File:** `.tdad/workflows/auth/create-user-record/create-user-record.action.js`
{{#if ../isESM}}
- **Import:** `import { performCreateUserRecordAction } from '../create-user-record/create-user-record.action.js';`
{{else}}
- **Import:** `const { performCreateUserRecordAction } = require('../create-user-record/create-user-record.action.js');`
{{/if}}
- **Usage:** Call action directly to get fresh data (e.g., `const result = await performCreateUserRecordAction(page);`)




## Documentation Context

**DOCUMENTATION CONTEXT:**
The following documentation files are provided for context:

- docs\ARCHITECTURE.md
- docs\PRD.md
- docs\README.md



---

## Your Task
Implement `.tdad/workflows/auth/submit-register-form/submit-register-form.action.js` and `.tdad/workflows/auth/submit-register-form/submit-register-form.test.js`.
1. **Analyze** the Gherkin and Dependencies.
2. **Implement Action:** Follow the **Reference Implementation** (Error Detection, Artifacts, Return Object).
3. **Export Helpers:** Create and export helper functions for any data (IDs, tokens) that future steps might need.
4. **Implement Test:** Group tests into `[API]` and `[UI]` sections. **Use `[API]` or `[UI]` prefix on test names** (numbering is auto-assigned later).
5. **Validation:** Tests must Assert `result.success` at the top level.

## Verification
- [ ] Every Gherkin scenario has a test
- [ ] Action returns `{ success, errorMessage, ...data }`, never throws
- [ ] NO `waitForTimeout()` or `setTimeout()` - only Playwright auto-waits
- [ ] Playwright assertions (`.toBeVisible()`, `.toContainText()`) - no `textContent()` extraction first
- [ ] Dependencies called directly (import action, call function)
- [ ] Helper functions exported if needed (extract data from action result)
- [ ] No conditional assertions
- [ ] Tests create their own prerequisites (no skipping for missing data)
- [ ] Success tests verify outcome (round-trip), not just UI feedback

