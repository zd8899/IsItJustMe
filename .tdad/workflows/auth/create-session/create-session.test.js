// TDAD fixtures provide automatic trace capture for Golden Packet
const { test, expect } = require('../../../tdad-fixtures');
const {
    performCreateSessionAction,
    createFullSessionForUser,
    generateUniqueUsername
} = require('./create-session.action.js');

/**
 * Test based on Gherkin specification:
 * Feature: Create Session
 *
 *   As an authenticated user
 *   I want to receive a JWT token after successful credential verification
 *   So that I can access protected resources without re-authenticating
 *
 *   NOTE: Session tokens are created only after successful credential verification
 */

test.describe('Create Session', () => {

    // ==========================================
    // API TESTS
    // ==========================================

    test('[API-094] Create Session - Success', async ({ page }) => {
        // Setup: Create a user first to get a valid userId
        const uniqueUsername = generateUniqueUsername('session');
        const password = 'SecurePass123!';

        // Register user to get userId
        const registerResponse = await page.request.post('/api/auth/register', {
            data: { username: uniqueUsername, password }
        });
        expect(registerResponse.ok()).toBe(true);

        const registerBody = await registerResponse.json();
        const userId = registerBody.userId || registerBody.id;
        const username = registerBody.username || uniqueUsername;

        // Test: Create session with valid userId and username
        const result = await performCreateSessionAction(page, {
            mode: 'api',
            userId: userId,
            username: username
        });

        // Unconditional assertions
        expect(result.statusCode).toBe(200);
        expect(result.body.token).toBeDefined();
        expect(result.body.expiresIn).toBeDefined();
        expect(result.body.userId).toBe(userId);
        expect(result.body.username).toBe(username);
    });

    test('[API-095] Create Session - Missing UserId', async ({ page }) => {
        const result = await performCreateSessionAction(page, {
            mode: 'api',
            usernameOnly: true,
            username: 'testuser'
        });

        // Unconditional assertions
        expect(result.statusCode).toBe(400);
        expect(result.body.error).toBe('User ID is required');
    });

    test('[API-096] Create Session - Missing Username', async ({ page }) => {
        const result = await performCreateSessionAction(page, {
            mode: 'api',
            userIdOnly: true,
            userId: 'user123'
        });

        // Unconditional assertions
        expect(result.statusCode).toBe(400);
        expect(result.body.error).toBe('Username is required');
    });

    test('[API-097] Create Session - Empty Body', async ({ page }) => {
        const result = await performCreateSessionAction(page, {
            mode: 'api',
            emptyBody: true
        });

        // Unconditional assertions
        expect(result.statusCode).toBe(400);
        expect(result.body.error).toBe('User ID is required');
    });

    test('[API-098] Create Session - Invalid UserId Format (Empty String)', async ({ page }) => {
        const result = await performCreateSessionAction(page, {
            mode: 'api',
            userId: '',
            username: 'testuser'
        });

        // Unconditional assertions
        expect(result.statusCode).toBe(400);
        expect(result.body.error).toBe('User ID is required');
    });

    test('[API-099] Create Session - User Not Found', async ({ page }) => {
        const result = await performCreateSessionAction(page, {
            mode: 'api',
            userId: 'nonexistent123',
            username: 'testuser'
        });

        // Unconditional assertions
        expect(result.statusCode).toBe(404);
        expect(result.body.error).toBe('User not found');
    });

    test('[API-100] Create Session - Full Flow (Register + Session)', async ({ page }) => {
        // Test the helper function that does full registration + session creation
        const uniqueUsername = generateUniqueUsername('fullflow');
        const password = 'TestPassword123!';

        const result = await createFullSessionForUser(page, uniqueUsername, password);

        // Unconditional assertions
        expect(result.success).toBe(true);
        expect(result.userId).toBeDefined();
        expect(result.username).toBeDefined();
        expect(result.token).toBeDefined();
        expect(result.expiresIn).toBeDefined();
    });

});
