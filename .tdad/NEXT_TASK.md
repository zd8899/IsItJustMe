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

# Test Generation: Run Database Migration

## Context
**Description:** Execute Prisma migrate to create tables

**Gherkin Specification:**
```gherkin
Feature: Run Database Migration
  As a developer
  I want to execute Prisma migrations to create database tables
  So that the application can persist and retrieve data

  # NOTE: This feature validates that Prisma migrations successfully create
  # all required database tables as defined in the schema.


  # ==========================================
  # API SCENARIOS (API Request & Response)
  # ==========================================

  # --- Migration Execution ---
  Scenario: [API] Database migration creates User table
    Given the Prisma schema defines the User model
    When the database migration is executed
    Then the User table should exist in the database
    And the client sends POST request to "/api/trpc/user.register" with:
      | username | migrationtest |
      | password | testpass123   |
    And the response status should be 200

  Scenario: [API] Database migration creates Category table
    Given the Prisma schema defines the Category model
    When the database migration is executed
    Then the Category table should exist in the database
    And the client sends GET request to "/api/trpc/category.list"
    And the response status should be 200

  Scenario: [API] Database migration creates Post table
    Given the Prisma schema defines the Post model
    When the database migration is executed
    Then the Post table should exist in the database
    And the Post table has foreign key to Category table
    And the Post table has nullable foreign key to User table

  Scenario: [API] Database migration creates Comment table
    Given the Prisma schema defines the Comment model
    When the database migration is executed
    Then the Comment table should exist in the database
    And the Comment table has foreign key to Post table with cascade delete
    And the Comment table has nullable foreign key to User table
    And the Comment table has self-referencing foreign key for nested comments

  Scenario: [API] Database migration creates Vote table
    Given the Prisma schema defines the Vote model
    When the database migration is executed
    Then the Vote table should exist in the database
    And the Vote table has nullable foreign key to Post table with cascade delete
    And the Vote table has nullable foreign key to Comment table with cascade delete
    And the Vote table has nullable foreign key to User table

  # --- Index Verification ---
  Scenario: [API] Database migration creates required indexes on Post table
    Given the Prisma schema defines indexes on Post model
    When the database migration is executed
    Then the Post table should have index on categoryId
    And the Post table should have composite index on score and createdAt
    And the Post table should have index on createdAt

  Scenario: [API] Database migration creates required indexes on Comment table
    Given the Prisma schema defines indexes on Comment model
    When the database migration is executed
    Then the Comment table should have index on postId
    And the Comment table should have index on parentId

  Scenario: [API] Database migration creates required indexes on Vote table
    Given the Prisma schema defines indexes on Vote model
    When the database migration is executed
    Then the Vote table should have index on ipHash

  # --- Unique Constraints ---
  Scenario: [API] Database migration creates unique constraint on User username
    Given the Prisma schema defines unique constraint on User.username
    When the database migration is executed
    Then the User table should have unique constraint on username column

  Scenario: [API] Database migration creates unique constraints on Category
    Given the Prisma schema defines unique constraints on Category model
    When the database migration is executed
    Then the Category table should have unique constraint on name column
    And the Category table should have unique constraint on slug column

  Scenario: [API] Database migration creates composite unique constraints on Vote
    Given the Prisma schema defines composite unique constraints on Vote model
    When the database migration is executed
    Then the Vote table should have unique constraint on postId and userId
    And the Vote table should have unique constraint on postId and anonymousId
    And the Vote table should have unique constraint on commentId and userId
    And the Vote table should have unique constraint on commentId and anonymousId

  # --- Default Values ---
  Scenario: [API] Database migration applies default values to User model
    Given the Prisma schema defines default values on User model
    When the database migration is executed
    And a new user is created without specifying karma
    Then the user karma should default to 0
    And the user createdAt should be automatically set

  Scenario: [API] Database migration applies default values to Post model
    Given the Prisma schema defines default values on Post model
    When the database migration is executed
    And a new post is created without specifying vote counts
    Then the post upvotes should default to 0
    And the post downvotes should default to 0
    And the post score should default to 0
    And the post commentCount should default to 0

  Scenario: [API] Database migration applies default values to Comment model
    Given the Prisma schema defines default values on Comment model
    When the database migration is executed
    And a new comment is created without specifying vote counts
    Then the comment upvotes should default to 0
    And the comment downvotes should default to 0
    And the comment score should default to 0

  # --- Edge Cases ---
  Scenario: [API] Migration is idempotent when run multiple times
    Given the database migration has already been executed
    When the database migration is executed again
    Then no errors should occur
    And the existing data should remain intact

  Scenario: [API] Migration fails gracefully with invalid database connection
    Given the database connection string is invalid
    When the database migration is attempted
    Then the migration should fail with connection error
    And no partial schema changes should be applied
```


## Dependencies

### Create Prisma Schema
- **Action File:** `.tdad/workflows/database/create-prisma-schema/create-prisma-schema.action.js`
{{#if ../isESM}}
- **Import:** `import { performCreatePrismaSchemaAction } from '../create-prisma-schema/create-prisma-schema.action.js';`
{{else}}
- **Import:** `const { performCreatePrismaSchemaAction } = require('../create-prisma-schema/create-prisma-schema.action.js');`
{{/if}}
- **Usage:** Call action directly to get fresh data (e.g., `const result = await performCreatePrismaSchemaAction(page);`)




## Documentation Context

**DOCUMENTATION CONTEXT:**
The following documentation files are provided for context:

- docs\ARCHITECTURE.md
- docs\PRD.md
- docs\README.md



---

## Your Task
Implement `.tdad/workflows/database/run-database-migration/run-database-migration.action.js` and `.tdad/workflows/database/run-database-migration/run-database-migration.test.js`.
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

