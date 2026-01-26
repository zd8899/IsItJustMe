// TDAD fixtures provide automatic trace capture for Golden Packet
const { test, expect } = require('../../../tdad-fixtures');
const {
    performVerifyCredentialsAction,
    createTestUserForVerification,
    generateUniqueUsername
} = require('./verify-credentials.action.js');

/**
 * Test based on Gherkin specification:
 * Feature: Verify Credentials
 *
 *   As a user
 *   I want to verify my username and password
 *   So that I can securely log in to my account
 *
 *   NOTE: Consistent error message for security - prevents username enumeration
 */

test.describe('Verify Credentials', () => {

    // ==========================================
    // API TESTS
    // ==========================================

    test('[API-075] Verify Credentials - Valid Username and Password', async ({ page }) => {
        // Setup: Create a user first
        const uniqueUsername = generateUniqueUsername('testuser');
        const password = 'SecurePass123!';

        const setupResult = await createTestUserForVerification(page, uniqueUsername, password);
        expect(setupResult.success).toBe(true);

        // Test: Verify credentials
        const result = await performVerifyCredentialsAction(page, {
            mode: 'api',
            username: uniqueUsername,
            password: password
        });

        // Unconditional assertions
        expect(result.statusCode).toBe(200);
        expect(result.body.valid).toBe(true);
        expect(result.body.userId).toBeDefined();
        expect(result.body.username).toBe(uniqueUsername);
    });

    test('[API-076] Verify Credentials - User Not Found', async ({ page }) => {
        // Use a username that doesn't exist
        const nonExistentUsername = `nonexistent_${Date.now()}`;

        const result = await performVerifyCredentialsAction(page, {
            mode: 'api',
            username: nonExistentUsername,
            password: 'AnyPassword123'
        });

        // Unconditional assertions
        expect(result.statusCode).toBe(401);
        expect(result.body.error).toBe('Invalid username or password');
    });

    test('[API-077] Verify Credentials - Wrong Password', async ({ page }) => {
        // Setup: Create a user first
        const uniqueUsername = generateUniqueUsername('testuser');
        const correctPassword = 'CorrectPass123!';

        const setupResult = await createTestUserForVerification(page, uniqueUsername, correctPassword);
        expect(setupResult.success).toBe(true);

        // Test: Verify with wrong password
        const result = await performVerifyCredentialsAction(page, {
            mode: 'api',
            username: uniqueUsername,
            password: 'WrongPassword456'
        });

        // Unconditional assertions
        expect(result.statusCode).toBe(401);
        expect(result.body.error).toBe('Invalid username or password');
    });

    test('[API-078] Verify Credentials - Empty Username', async ({ page }) => {
        const result = await performVerifyCredentialsAction(page, {
            mode: 'api',
            username: '',
            password: 'SomePassword123'
        });

        // Unconditional assertions
        expect(result.statusCode).toBe(400);
        expect(result.body.error).toBe('Username is required');
    });

    test('[API-079] Verify Credentials - Empty Password', async ({ page }) => {
        const result = await performVerifyCredentialsAction(page, {
            mode: 'api',
            username: 'testuser',
            password: ''
        });

        // Unconditional assertions
        expect(result.statusCode).toBe(400);
        expect(result.body.error).toBe('Password is required');
    });

    test('[API-080] Verify Credentials - Missing Both Fields', async ({ page }) => {
        const result = await performVerifyCredentialsAction(page, {
            mode: 'api',
            emptyBody: true
        });

        // Unconditional assertions
        expect(result.statusCode).toBe(400);
        expect(result.body.error).toBe('Username is required');
    });

    test('[API-081] Verify Credentials - Case Sensitive Password', async ({ page }) => {
        // Setup: Create a user first
        const uniqueUsername = generateUniqueUsername('testuser');
        const password = 'CaseSensitive123';

        const setupResult = await createTestUserForVerification(page, uniqueUsername, password);
        expect(setupResult.success).toBe(true);

        // Test: Verify with different case password
        const result = await performVerifyCredentialsAction(page, {
            mode: 'api',
            username: uniqueUsername,
            password: 'casesensitive123'
        });

        // Unconditional assertions
        expect(result.statusCode).toBe(401);
        expect(result.body.error).toBe('Invalid username or password');
    });

    test('[API-082] Verify Credentials - Case Insensitive Username', async ({ page }) => {
        // Setup: Create a user with mixed case username
        const shortTimestamp = Date.now().toString().slice(-6);
        const mixedCaseUsername = `TestUser_${shortTimestamp}`;
        const password = 'MyPassword123!';

        const setupResult = await createTestUserForVerification(page, mixedCaseUsername, password);
        expect(setupResult.success).toBe(true);

        // Test: Verify with lowercase version of username
        const result = await performVerifyCredentialsAction(page, {
            mode: 'api',
            username: mixedCaseUsername.toLowerCase(),
            password: password
        });

        // Unconditional assertions
        expect(result.statusCode).toBe(200);
        expect(result.body.valid).toBe(true);
    });

});
