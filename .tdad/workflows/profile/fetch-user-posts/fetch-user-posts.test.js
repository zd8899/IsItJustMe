// TDAD fixtures provide automatic trace capture for Golden Packet
const { test, expect } = require('../../../tdad-fixtures');
const {
    performFetchUserPostsAction,
    createTestUser,
    createUserWithPost,
    createUserWithMultiplePosts,
    getOrCreateCategory,
    getPostsFromResult,
    getPostCountFromResult,
    isPostsEmpty,
    getFirstPostFromResult,
    getSecondPostFromResult,
    isValidationError,
    postHasRequiredFields,
    categoryHasRequiredFields
} = require('./fetch-user-posts.action.js');

/**
 * Test based on Gherkin specification:
 * Feature: Fetch User Posts
 *   As a user
 *   I want to fetch posts created by a specific user
 *   So that I can view their post history on their profile
 */

test.describe('Fetch User Posts', () => {

    // ==========================================
    // API TESTS
    // ==========================================

    test('[API-338] Fetch user posts successfully', async ({ page }) => {
        // Setup: Create a user with username prefix "postauthor" and a post
        const setupResult = await createUserWithPost(page, {
            prefix: 'pstauth',
            frustration: 'find parking downtown'
        });
        expect(setupResult.success).toBe(true);
        const userId = setupResult.userId;

        // Test: Fetch the user's posts
        const result = await performFetchUserPostsAction(page, {
            mode: 'api',
            userId: userId
        });

        // Unconditional assertions
        expect(result.success).toBe(true);
        expect(result.statusCode).toBe(200);

        // Response should be an array
        expect(Array.isArray(result.posts)).toBe(true);

        // Should contain at least 1 post
        expect(getPostCountFromResult(result)).toBeGreaterThanOrEqual(1);

        // Each post should contain required fields
        const posts = getPostsFromResult(result);
        for (const post of posts) {
            expect(post.id).toBeDefined();
            expect(post.frustration).toBeDefined();
            expect(post.identity).toBeDefined();
            expect(post.category).toBeDefined();
        }
    });

    test('[API-339] Fetch user posts returns posts in descending order by creation date', async ({ page }) => {
        // Setup: Create a user with multiple posts
        const setupResult = await createUserWithMultiplePosts(page, {
            prefix: 'actauth',
            frustrations: [
                'find a good restaurant',
                'get a taxi on Friday night'
            ]
        });
        expect(setupResult.success).toBe(true);
        const userId = setupResult.userId;

        // Test: Fetch the user's posts
        const result = await performFetchUserPostsAction(page, {
            mode: 'api',
            userId: userId
        });

        // Unconditional assertions
        expect(result.success).toBe(true);
        expect(result.statusCode).toBe(200);

        // Should contain 2 posts
        expect(getPostCountFromResult(result)).toBe(2);

        // Posts should be in descending order (newest first)
        // The second post created ("get a taxi on Friday night") should be first
        const firstPost = getFirstPostFromResult(result);
        const secondPost = getSecondPostFromResult(result);

        expect(firstPost).not.toBeNull();
        expect(secondPost).not.toBeNull();
        expect(firstPost.frustration).toContain('get a taxi on Friday night');
        expect(secondPost.frustration).toContain('find a good restaurant');
    });

    test('[API-340] Fetch posts for user with no posts', async ({ page }) => {
        // Setup: Create a user without any posts
        const userResult = await createTestUser(page, 'newuser');
        expect(userResult.success).toBe(true);
        const userId = userResult.userId;

        // Test: Fetch the user's posts
        const result = await performFetchUserPostsAction(page, {
            mode: 'api',
            userId: userId
        });

        // Unconditional assertions
        expect(result.success).toBe(true);
        expect(result.statusCode).toBe(200);

        // Response should be an empty array
        expect(Array.isArray(result.posts)).toBe(true);
        expect(isPostsEmpty(result)).toBe(true);
        expect(getPostCountFromResult(result)).toBe(0);
    });

    test('[API-341] Fetch posts for non-existent user', async ({ page }) => {
        // Test: Fetch posts for a non-existent user ID
        const result = await performFetchUserPostsAction(page, {
            mode: 'api',
            nonExistent: true
        });

        // Unconditional assertions
        // The request should succeed (200) but return empty array
        expect(result.success).toBe(true);
        expect(result.statusCode).toBe(200);

        // Response should be an empty array
        expect(Array.isArray(result.posts)).toBe(true);
        expect(isPostsEmpty(result)).toBe(true);
    });

    test('[API-342] Fetch user posts with invalid input', async ({ page }) => {
        // Test: Send query with empty userId
        const result = await performFetchUserPostsAction(page, {
            mode: 'api',
            emptyUserId: true
        });

        // Unconditional assertions
        // Should indicate validation error (either 400 status or tRPC error structure)
        expect(result.success).toBe(false);
        expect(isValidationError(result)).toBe(true);
    });

    test('[API-343] Fetch user posts includes category information', async ({ page }) => {
        // Setup: Get or verify technology category exists
        const catResult = await getOrCreateCategory(page, 'technology');
        // Note: Technology category may not exist, so we'll use any available category

        // Create a user with a post in a category
        const setupResult = await createUserWithPost(page, {
            prefix: 'catauth',
            frustration: 'understand new tech frameworks',
            categorySlug: catResult.success ? catResult.categorySlug : undefined
        });
        expect(setupResult.success).toBe(true);
        const userId = setupResult.userId;

        // Test: Fetch the user's posts
        const result = await performFetchUserPostsAction(page, {
            mode: 'api',
            userId: userId
        });

        // Unconditional assertions
        expect(result.success).toBe(true);
        expect(result.statusCode).toBe(200);

        // Should contain at least 1 post
        expect(getPostCountFromResult(result)).toBeGreaterThanOrEqual(1);

        // Each post should contain category
        const posts = getPostsFromResult(result);
        for (const post of posts) {
            expect(post.category).toBeDefined();
            expect(post.category).not.toBeNull();

            // Category should contain required fields
            expect(categoryHasRequiredFields(post.category)).toBe(true);
            expect(post.category.id).toBeDefined();
            expect(post.category.name).toBeDefined();
            expect(post.category.slug).toBeDefined();
        }
    });

});
