// TDAD fixtures provide automatic trace capture for Golden Packet
const { test, expect } = require('../../../tdad-fixtures');
const {
    performFetchUserProfileAction,
    createTestUser,
    generateUniqueUsername,
    createTestPost,
    createTestComment,
    getUserIdFromResult,
    getUsernameFromResult,
    getKarmaFromResult,
    getCountsFromResult,
    isProfileNull,
    isValidationError
} = require('./fetch-user-profile.action.js');

/**
 * Test based on Gherkin specification:
 * Feature: Fetch User Profile
 *   As a user
 *   I want to fetch a user profile from the database
 *   So that I can view user information and statistics
 */

test.describe('Fetch User Profile', () => {

    // ==========================================
    // API TESTS
    // ==========================================

    test('[API-330] Fetch user profile successfully', async ({ page }) => {
        // Setup: Create a user with a unique username
        const uniqueUsername = generateUniqueUsername('testuser');
        const setupResult = await createTestUser(page, 'testuser');
        expect(setupResult.success).toBe(true);
        const userId = setupResult.userId;
        const createdUsername = setupResult.username;

        // Test: Fetch the user profile
        const result = await performFetchUserProfileAction(page, {
            mode: 'api',
            userId: userId
        });

        // Unconditional assertions
        expect(result.success).toBe(true);
        expect(result.statusCode).toBe(200);

        // Response should contain required fields
        expect(result.userId).toBeDefined();
        expect(result.userId).toBe(userId);
        expect(result.username).toBeDefined();
        expect(result.username).toBe(createdUsername);
        expect(result.karma).toBeDefined();
        expect(typeof result.karma).toBe('number');
        expect(result.createdAt).toBeDefined();
    });

    test('[API-331] Fetch user profile includes post and comment counts', async ({ page }) => {
        // Setup: Create a user
        const setupResult = await createTestUser(page, 'activeuser');
        expect(setupResult.success).toBe(true);
        const userId = setupResult.userId;

        // Create a post for this user
        const postResult = await createTestPost(page, { userId: userId });
        // Note: Posts might not be associated with user if not logged in,
        // but we still test the _count structure exists

        // Create a comment (need a post first)
        if (postResult.success && postResult.postId) {
            await createTestComment(page, { postId: postResult.postId, userId: userId });
        }

        // Test: Fetch the user profile
        const result = await performFetchUserProfileAction(page, {
            mode: 'api',
            userId: userId
        });

        // Unconditional assertions
        expect(result.success).toBe(true);
        expect(result.statusCode).toBe(200);

        // Response should contain _count object
        expect(result._count).toBeDefined();
        expect(result._count).not.toBeNull();

        // _count should include posts and comments fields
        expect(result._count.posts).toBeDefined();
        expect(typeof result._count.posts).toBe('number');
        expect(result._count.comments).toBeDefined();
        expect(typeof result._count.comments).toBe('number');
    });

    test('[API-332] Fetch profile for non-existent user', async ({ page }) => {
        // Test: Fetch profile with non-existent user ID
        const result = await performFetchUserProfileAction(page, {
            mode: 'api',
            nonExistent: true
        });

        // Unconditional assertions
        // The request should succeed (200) but return null profile
        expect(result.success).toBe(true);
        expect(result.statusCode).toBe(200);

        // Response should be null
        expect(isProfileNull(result)).toBe(true);
        expect(result.profile).toBeNull();
    });

    test('[API-333] Fetch user profile with invalid input', async ({ page }) => {
        // Test: Send query with empty userId
        const result = await performFetchUserProfileAction(page, {
            mode: 'api',
            emptyUserId: true
        });

        // Unconditional assertions
        // Should indicate validation error (either 400 status or tRPC error structure)
        expect(result.success).toBe(false);
        expect(isValidationError(result)).toBe(true);
    });

});
