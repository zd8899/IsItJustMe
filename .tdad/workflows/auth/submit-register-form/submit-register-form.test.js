// TDAD fixtures provide automatic trace capture for Golden Packet
const { test, expect } = require('../../../tdad-fixtures');
const {
    performSubmitRegisterFormAction,
    checkLoadingStateDuringSubmission,
    submitFormAndCheckError,
    checkFormRetainsValues,
    generateUniqueUsername,
    createExistingUser
} = require('./submit-register-form.action.js');

test.describe('Submit Register Form', () => {

    // ==========================================
    // API TESTS
    // ==========================================

    test('[API-103] Submit registration with valid credentials', async ({ page }) => {
        // Use unique username to avoid conflicts
        const username = generateUniqueUsername('newuser');
        const password = 'SecurePass123!';

        const result = await performSubmitRegisterFormAction(page, {
            mode: 'api',
            username,
            password
        });

        // Unconditional assertions
        expect(result.statusCode).toBe(201);
        expect(result.body.id).toBeDefined();
        expect(result.body.username).toBe(username);
        expect(result.userId).toBeDefined();
    });

    test('[API-104] Submit registration with username already taken', async ({ page }) => {
        // Create existing user first (prerequisite setup)
        const existingUsername = generateUniqueUsername('existing');
        const setupResult = await createExistingUser(page, existingUsername, 'ValidPass123!');
        expect(setupResult.success).toBe(true);

        // Now try to register with same username
        const result = await performSubmitRegisterFormAction(page, {
            mode: 'api',
            username: existingUsername,
            password: 'ValidPass123!'
        });

        // Unconditional assertions
        expect(result.statusCode).toBe(409);
        expect(result.errorMessage).toBe('Username is already taken');
    });

    test('[API-105] Submit registration with username too short', async ({ page }) => {
        const result = await performSubmitRegisterFormAction(page, {
            mode: 'api',
            username: 'ab',
            password: 'ValidPass123!'
        });

        // Unconditional assertions
        expect(result.statusCode).toBe(400);
        expect(result.errorMessage).toBe('Username must be at least 3 characters');
    });

    test('[API-106] Submit registration with username too long', async ({ page }) => {
        const result = await performSubmitRegisterFormAction(page, {
            mode: 'api',
            username: 'thisusernameiswaytoolongtobevalid',
            password: 'ValidPass123!'
        });

        // Unconditional assertions
        expect(result.statusCode).toBe(400);
        expect(result.errorMessage).toBe('Username must be at most 20 characters');
    });

    test('[API-107] Submit registration with invalid username characters', async ({ page }) => {
        const result = await performSubmitRegisterFormAction(page, {
            mode: 'api',
            username: 'user@name!',
            password: 'ValidPass123!'
        });

        // Unconditional assertions
        expect(result.statusCode).toBe(400);
        expect(result.errorMessage).toBe('Username can only contain letters, numbers, and underscores');
    });

    test('[API-108] Submit registration with missing username', async ({ page }) => {
        const result = await performSubmitRegisterFormAction(page, {
            mode: 'api',
            username: '',
            password: 'ValidPass123!'
        });

        // Unconditional assertions
        expect(result.statusCode).toBe(400);
        expect(result.errorMessage).toBe('Username is required');
    });

    test('[API-109] Submit registration with missing password', async ({ page }) => {
        const result = await performSubmitRegisterFormAction(page, {
            mode: 'api',
            username: 'validuser',
            password: ''
        });

        // Unconditional assertions
        expect(result.statusCode).toBe(400);
        expect(result.errorMessage).toBe('Password is required');
    });

    // ==========================================
    // UI TESTS
    // ==========================================

    test('[UI-023] Successful registration redirects to home page', async ({ page }) => {
        // Use unique username to avoid conflicts
        const username = generateUniqueUsername('reguser');
        const password = 'SecurePass123!';

        const result = await performSubmitRegisterFormAction(page, {
            mode: 'ui',
            username,
            password
        });

        // Unconditional assertions
        expect(result.success).toBe(true);

        // Verify redirected to home page
        await expect(page).toHaveURL('/');

        // Verify username appears in header (round-trip verification)
        await expect(page.getByText(username)).toBeVisible();
    });

    test('[UI-025] Display error message when username is already taken', async ({ page }) => {
        // Create existing user first (prerequisite setup)
        const existingUsername = generateUniqueUsername('exist');
        const setupResult = await createExistingUser(page, existingUsername, 'ValidPass123!');
        expect(setupResult.success).toBe(true);

        // Try to register via UI with same username
        const result = await submitFormAndCheckError(page, {
            username: existingUsername,
            password: 'ValidPass123!'
        });

        // Unconditional assertions
        expect(result.success).toBe(true);
        expect(result.errorDisplayed).toBe(true);
        expect(result.errorMessage).toBe('Username is already taken');
    });

    test('[UI-026] Display validation error for short username', async ({ page }) => {
        const result = await submitFormAndCheckError(page, {
            username: 'ab',
            password: 'ValidPass123!'
        });

        // Unconditional assertions
        expect(result.success).toBe(true);
        expect(result.errorDisplayed).toBe(true);
        expect(result.errorMessage).toBe('Username must be at least 3 characters');
    });

    test('[UI-027] Display validation error for long username', async ({ page }) => {
        const result = await submitFormAndCheckError(page, {
            username: 'thisusernameiswaytoolongtobevalid',
            password: 'ValidPass123!'
        });

        // Unconditional assertions
        expect(result.success).toBe(true);
        expect(result.errorDisplayed).toBe(true);
        expect(result.errorMessage).toBe('Username must be at most 20 characters');
    });

    test('[UI-028] Display validation error for invalid username characters', async ({ page }) => {
        const result = await submitFormAndCheckError(page, {
            username: 'user@name!',
            password: 'ValidPass123!'
        });

        // Unconditional assertions
        expect(result.success).toBe(true);
        expect(result.errorDisplayed).toBe(true);
        expect(result.errorMessage).toBe('Username can only contain letters, numbers, and underscores');
    });

    test('[UI-029] Display error when username field is empty on submit', async ({ page }) => {
        const result = await submitFormAndCheckError(page, {
            username: '',
            password: 'ValidPass123!'
        });

        // Unconditional assertions
        expect(result.success).toBe(true);
        expect(result.errorDisplayed).toBe(true);
        expect(result.errorMessage).toBe('Username is required');
    });

    test('[UI-030] Display error when password field is empty on submit', async ({ page }) => {
        const result = await submitFormAndCheckError(page, {
            username: 'validuser',
            password: ''
        });

        // Unconditional assertions
        expect(result.success).toBe(true);
        expect(result.errorDisplayed).toBe(true);
        expect(result.errorMessage).toBe('Password is required');
    });

    test('[UI-031] Form fields retain values after validation error', async ({ page }) => {
        const result = await checkFormRetainsValues(page, {
            username: 'ab',
            password: 'ValidPass123!'
        });

        // Unconditional assertions
        expect(result.success).toBe(true);

        // Verify username field still contains the entered value after error
        expect(result.usernameValue).toBe('ab');

        // Verify error is displayed
        await expect(page.locator('.bg-red-50')).toContainText('Username must be at least 3 characters');
    });

});
