// TDAD fixtures provide automatic trace capture for Golden Packet
const { test, expect } = require('../../../tdad-fixtures');
const {
    performValidateUsernameAction,
    createTestUser,
    generateUniqueUsername
} = require('./validate-username.action.js');

/**
 * Test based on Gherkin specification:
 * Feature: Validate Username
 *
 *   As a user registering for an account
 *   I want my username to be validated
 *   So that I can have a unique and properly formatted username
 */

test.describe('Validate Username', () => {

    // ==========================================
    // API TESTS
    // ==========================================

    test('[API-042] Validate Username - Valid and Available', async ({ page }) => {
        // Use unique username to ensure it's available
        const uniqueUsername = generateUniqueUsername('testuser');

        const result = await performValidateUsernameAction(page, {
            mode: 'api',
            username: uniqueUsername
        });

        // Unconditional assertions
        expect(result.statusCode).toBe(200);
        expect(result.body.valid).toBe(true);
        expect(result.body.available).toBe(true);
    });

    test('[API-043] Validate Username - Too Short', async ({ page }) => {
        const result = await performValidateUsernameAction(page, {
            mode: 'api',
            username: 'ab'
        });

        // Unconditional assertions
        expect(result.statusCode).toBe(400);
        expect(result.body.error || result.body.message).toBe('Username must be at least 3 characters');
    });

    test('[API-044] Validate Username - Too Long', async ({ page }) => {
        const result = await performValidateUsernameAction(page, {
            mode: 'api',
            username: 'thisusernameiswaytoolongtobevalid'
        });

        // Unconditional assertions
        expect(result.statusCode).toBe(400);
        expect(result.body.error || result.body.message).toBe('Username must be at most 20 characters');
    });

    test('[API-045] Validate Username - Invalid Characters', async ({ page }) => {
        const result = await performValidateUsernameAction(page, {
            mode: 'api',
            username: 'user@name!'
        });

        // Unconditional assertions
        expect(result.statusCode).toBe(400);
        expect(result.body.error || result.body.message).toBe('Username can only contain letters, numbers, and underscores');
    });

    test('[API-046] Validate Username - Already Taken', async ({ page }) => {
        // Setup: Create a user first to make the username taken
        const existingUsername = generateUniqueUsername('existing');
        const setupResult = await createTestUser(page, existingUsername);
        expect(setupResult.success).toBe(true);

        // Test: Validate the same username
        const result = await performValidateUsernameAction(page, {
            mode: 'api',
            username: existingUsername
        });

        // Unconditional assertions
        expect(result.statusCode).toBe(200);
        expect(result.body.valid).toBe(true);
        expect(result.body.available).toBe(false);
        expect(result.body.message).toBe('Username is already taken');
    });

    test('[API-047] Validate Username - Empty Username', async ({ page }) => {
        const result = await performValidateUsernameAction(page, {
            mode: 'api',
            username: ''
        });

        // Unconditional assertions
        expect(result.statusCode).toBe(400);
        expect(result.body.error || result.body.message).toBe('Username is required');
    });

    test('[API-048] Validate Username - Whitespace Only', async ({ page }) => {
        const result = await performValidateUsernameAction(page, {
            mode: 'api',
            username: '   '
        });

        // Unconditional assertions
        expect(result.statusCode).toBe(400);
        expect(result.body.error || result.body.message).toBe('Username is required');
    });

    test('[API-049] Validate Username - Starting with Underscore (Valid)', async ({ page }) => {
        const uniqueUsername = `_valid${Date.now()}`;

        const result = await performValidateUsernameAction(page, {
            mode: 'api',
            username: uniqueUsername
        });

        // Unconditional assertions
        expect(result.statusCode).toBe(200);
        expect(result.body.valid).toBe(true);
    });

    test('[API-050] Validate Username - Case Insensitive Uniqueness Check', async ({ page }) => {
        // Setup: Create a user with mixed case username
        const baseUsername = `TestUser${Date.now()}`;
        const setupResult = await createTestUser(page, baseUsername);
        expect(setupResult.success).toBe(true);

        // Test: Validate lowercase version of the same username
        const result = await performValidateUsernameAction(page, {
            mode: 'api',
            username: baseUsername.toLowerCase()
        });

        // Unconditional assertions
        expect(result.statusCode).toBe(200);
        expect(result.body.available).toBe(false);
    });

});
