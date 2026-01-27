// TDAD fixtures provide automatic trace capture for Golden Packet
const { test, expect } = require('../../../tdad-fixtures');
const {
    performSubmitLoginFormAction,
    submitFormAndCheckValidationError,
    generateUniqueUsername,
    createTestUser
} = require('./submit-login-form.action.js');

/**
 * Test based on Gherkin specification:
 * Feature: Submit Login Form
 *
 *   As a returning user
 *   I want to submit my login credentials
 *   So that I can access my account and personalized features
 */

test.describe('Submit Login Form', () => {

    // ==========================================
    // API TESTS
    // ==========================================

    test('[API-110] Login API Success', async ({ page }) => {
        // Setup: Create a test user
        const username = generateUniqueUsername('login');
        const password = 'Password123';

        const setupResult = await createTestUser(page, username, password);
        expect(setupResult.success).toBe(true);

        // Execute: Attempt to login with valid credentials
        const result = await performSubmitLoginFormAction(page, {
            mode: 'api',
            username: username,
            password: password
        });

        // Assert: API returns 200 with token, userId, and username
        expect(result.statusCode).toBe(200);
        expect(result.body.token).toBeDefined();
        expect(result.body.userId).toBeDefined();
        expect(result.body.username).toBe(username);
    });

    test('[API-111] Login API Failure - Invalid Password', async ({ page }) => {
        // Setup: Create a test user
        const username = generateUniqueUsername('login');
        const password = 'Password123';

        const setupResult = await createTestUser(page, username, password);
        expect(setupResult.success).toBe(true);

        // Execute: Attempt to login with wrong password
        const result = await performSubmitLoginFormAction(page, {
            mode: 'api',
            username: username,
            password: 'wrongpassword'
        });

        // Assert: API returns 401 with generic error message
        expect(result.statusCode).toBe(401);
        expect(result.body.error).toBe('Invalid username or password');
    });

    test('[API-112] Login API Failure - User Not Found', async ({ page }) => {
        // Execute: Attempt to login with non-existent user
        const result = await performSubmitLoginFormAction(page, {
            mode: 'api',
            username: 'nonexistent_user',
            password: 'Password123'
        });

        // Assert: API returns 401 with generic error message
        expect(result.statusCode).toBe(401);
        expect(result.body.error).toBe('Invalid username or password');
    });

    test('[API-113] Login API Failure - Missing Username', async ({ page }) => {
        // Execute: Attempt to login with password only
        const result = await performSubmitLoginFormAction(page, {
            mode: 'api',
            password: 'Password123',
            passwordOnly: true
        });

        // Assert: API returns 400 with validation error
        expect(result.statusCode).toBe(400);
        expect(result.body.error).toBe('Username is required');
    });

    test('[API-114] Login API Failure - Missing Password', async ({ page }) => {
        // Execute: Attempt to login with username only
        const result = await performSubmitLoginFormAction(page, {
            mode: 'api',
            username: 'testuser',
            usernameOnly: true
        });

        // Assert: API returns 400 with validation error
        expect(result.statusCode).toBe(400);
        expect(result.body.error).toBe('Password is required');
    });

    test('[API-115] Login API Failure - Empty Body', async ({ page }) => {
        // Execute: Attempt to login with empty body
        const result = await performSubmitLoginFormAction(page, {
            mode: 'api',
            emptyBody: true
        });

        // Assert: API returns 400 with validation error
        expect(result.statusCode).toBe(400);
        expect(result.body.error).toBe('Username is required');
    });


    // ==========================================
    // UI TESTS
    // ==========================================

    test('[UI-032] Successful login flow', async ({ page }) => {
        // Setup: Create a test user via API
        const username = generateUniqueUsername('login');
        const password = 'Password123';

        const setupResult = await createTestUser(page, username, password);
        expect(setupResult.success).toBe(true);

        // Execute: Login via UI
        const result = await performSubmitLoginFormAction(page, {
            mode: 'ui',
            username: username,
            password: password
        });

        // Assert: Login succeeds
        expect(result.success).toBe(true);

        // Assert: User is redirected to home page
        await expect(page).toHaveURL('/');

        // Assert: Username is visible in header (user is logged in)
        await expect(page.getByText(username)).toBeVisible();

        // Round-trip verification: verify session actually works by accessing protected API
        const profileResponse = await page.request.get('/api/auth/me');
        expect(profileResponse.ok()).toBe(true);
    });

    test('[UI-033] Failed login - Invalid credentials', async ({ page }) => {
        // Setup: Create a test user via API
        const username = generateUniqueUsername('login');
        const password = 'Password123';

        const setupResult = await createTestUser(page, username, password);
        expect(setupResult.success).toBe(true);

        // Execute: Attempt to login with wrong password
        const result = await performSubmitLoginFormAction(page, {
            mode: 'ui',
            username: username,
            password: 'wrongpassword'
        });

        // Assert: Login fails
        expect(result.success).toBe(false);

        // Assert: Error message is displayed
        expect(result.errorMessage).toContain('Invalid username or password');

        // Assert: User remains on login page
        await expect(page).toHaveURL(/.*\/auth\/login/);
    });

    test('[UI-034] Failed login - User does not exist', async ({ page }) => {
        // Execute: Attempt to login with non-existent user
        const result = await performSubmitLoginFormAction(page, {
            mode: 'ui',
            username: 'nonexistent_user_' + Date.now(),
            password: 'Password123'
        });

        // Assert: Login fails
        expect(result.success).toBe(false);

        // Assert: Error message is displayed
        expect(result.errorMessage).toContain('Invalid username or password');

        // Assert: User remains on login page
        await expect(page).toHaveURL(/.*\/auth\/login/);
    });

    test('[UI-035] Client-side validation - Empty username', async ({ page }) => {
        // Execute: Submit form with empty username
        const result = await submitFormAndCheckValidationError(page, {
            username: '',
            password: 'Password123'
        });

        // Assert: Validation error is displayed
        expect(result.success).toBe(true);
        expect(result.errorDisplayed).toBe(true);
        expect(result.errorMessage).toContain('Username is required');
    });

    test('[UI-036] Client-side validation - Empty password', async ({ page }) => {
        // Execute: Submit form with empty password
        const result = await submitFormAndCheckValidationError(page, {
            username: 'testuser',
            password: ''
        });

        // Assert: Validation error is displayed
        expect(result.success).toBe(true);
        expect(result.errorDisplayed).toBe(true);
        expect(result.errorMessage).toContain('Password is required');
    });

});
