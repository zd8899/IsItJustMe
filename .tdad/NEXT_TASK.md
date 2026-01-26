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



## 2. TEST CONFIGURATION

- **Target Layer:** API


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



});
```

---

# Test Generation: Seed Categories

## Context
**Description:** Insert predefined categories into database

**Gherkin Specification:**
```gherkin
Feature: Seed Categories
  As a developer
  I want to insert predefined categories into the database
  So that users can categorize their frustration posts

  # NOTE: Categories are predefined as per PRD: Work, Relationships, Technology,
  # Health, Parenting, Finance, Daily Life, Social, Other


  # ==========================================
  # API SCENARIOS (API Request & Response)
  # ==========================================

  # --- Happy Path: Seed Execution ---
  Scenario: [API] Seed creates all predefined categories
    Given the database migration has been executed
    And the Category table is empty
    When the database seed is executed
    Then the Category table should contain 9 categories
    And the client sends GET request to "/api/trpc/category.list"
    And the response status should be 200
    And the response should contain 9 categories

  Scenario: [API] Seed creates Work category with correct data
    Given the database migration has been executed
    When the database seed is executed
    Then the Category table should contain a category with name "Work"
    And the category should have slug "work"

  Scenario: [API] Seed creates Relationships category with correct data
    Given the database migration has been executed
    When the database seed is executed
    Then the Category table should contain a category with name "Relationships"
    And the category should have slug "relationships"

  Scenario: [API] Seed creates Technology category with correct data
    Given the database migration has been executed
    When the database seed is executed
    Then the Category table should contain a category with name "Technology"
    And the category should have slug "technology"

  Scenario: [API] Seed creates Health category with correct data
    Given the database migration has been executed
    When the database seed is executed
    Then the Category table should contain a category with name "Health"
    And the category should have slug "health"

  Scenario: [API] Seed creates Parenting category with correct data
    Given the database migration has been executed
    When the database seed is executed
    Then the Category table should contain a category with name "Parenting"
    And the category should have slug "parenting"

  Scenario: [API] Seed creates Finance category with correct data
    Given the database migration has been executed
    When the database seed is executed
    Then the Category table should contain a category with name "Finance"
    And the category should have slug "finance"

  Scenario: [API] Seed creates Daily Life category with correct data
    Given the database migration has been executed
    When the database seed is executed
    Then the Category table should contain a category with name "Daily Life"
    And the category should have slug "daily-life"

  Scenario: [API] Seed creates Social category with correct data
    Given the database migration has been executed
    When the database seed is executed
    Then the Category table should contain a category with name "Social"
    And the category should have slug "social"

  Scenario: [API] Seed creates Other category with correct data
    Given the database migration has been executed
    When the database seed is executed
    Then the Category table should contain a category with name "Other"
    And the category should have slug "other"

  # --- API Verification ---
  Scenario: [API] Category list API returns all seeded categories
    Given the database migration has been executed
    And the database seed has been executed
    When the client sends GET request to "/api/trpc/category.list"
    Then the response status should be 200
    And the response should contain category with name "Work"
    And the response should contain category with name "Relationships"
    And the response should contain category with name "Technology"
    And the response should contain category with name "Health"
    And the response should contain category with name "Parenting"
    And the response should contain category with name "Finance"
    And the response should contain category with name "Daily Life"
    And the response should contain category with name "Social"
    And the response should contain category with name "Other"

  Scenario: [API] Category list API returns categories with id and slug
    Given the database migration has been executed
    And the database seed has been executed
    When the client sends GET request to "/api/trpc/category.list"
    Then the response status should be 200
    And each category in the response should have an "id" field
    And each category in the response should have a "name" field
    And each category in the response should have a "slug" field

  # --- Edge Cases: Idempotency ---
  Scenario: [API] Seed is idempotent when run multiple times
    Given the database migration has been executed
    And the database seed has been executed
    When the database seed is executed again
    Then no errors should occur
    And the Category table should contain exactly 9 categories
    And no duplicate categories should exist

  Scenario: [API] Seed handles existing categories gracefully
    Given the database migration has been executed
    And the Category table already contains category "Work" with slug "work"
    When the database seed is executed
    Then no errors should occur
    And only one category with name "Work" should exist

  # --- Edge Cases: Error Handling ---
  Scenario: [API] Seed fails gracefully without database connection
    Given the database connection is unavailable
    When the database seed is attempted
    Then the seed should fail with connection error
    And no partial data should be inserted

  Scenario: [API] Seed fails if migration has not been executed
    Given the database migration has not been executed
    When the database seed is attempted
    Then the seed should fail with table not found error
```


## Dependencies

### Run Database Migration
- **Action File:** `.tdad/workflows/database/run-database-migration/run-database-migration.action.js`
{{#if ../isESM}}
- **Import:** `import { performRunDatabaseMigrationAction } from '../run-database-migration/run-database-migration.action.js';`
{{else}}
- **Import:** `const { performRunDatabaseMigrationAction } = require('../run-database-migration/run-database-migration.action.js');`
{{/if}}
- **Usage:** Call action directly to get fresh data (e.g., `const result = await performRunDatabaseMigrationAction(page);`)




## Documentation Context

**DOCUMENTATION CONTEXT:**
The following documentation files are provided for context:

- docs\ARCHITECTURE.md
- docs\PRD.md
- docs\README.md



---

## Your Task
Implement `.tdad/workflows/database/seed-categories/seed-categories.action.js` and `.tdad/workflows/database/seed-categories/seed-categories.test.js`.
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

