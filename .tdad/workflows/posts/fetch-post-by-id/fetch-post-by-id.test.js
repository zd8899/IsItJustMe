// TDAD fixtures provide automatic trace capture for Golden Packet
const { test, expect } = require('../../../tdad-fixtures');
const {
    performFetchPostByIdAction,
    createTestPost,
    getTestCategory,
    getCategoryFromResult,
    getVoteCountsFromResult,
    getErrorFromResult
} = require('./fetch-post-by-id.action.js');

/**
 * Test based on Gherkin specification:
 * Feature: Fetch Post By ID
 *
 *   As a user
 *   I want to retrieve a single post by its ID
 *   So that I can view the full post details and comments
 */

test.describe('Fetch Post By ID', () => {

    // ==========================================
    // API TESTS
    // ==========================================

    test('[API-139] Fetch post by ID success', async ({ page }) => {
        // Setup: Get a valid category
        const categoryResult = await getTestCategory(page);
        expect(categoryResult.success).toBe(true);

        // Setup: Create a test post
        const createResult = await createTestPost(page, {
            categoryId: categoryResult.categoryId
        });
        expect(createResult.success).toBe(true);
        expect(createResult.postId).toBeDefined();

        // Execute: Fetch the post by ID
        const result = await performFetchPostByIdAction(page, {
            mode: 'api',
            postId: createResult.postId
        });

        // Assert: API returns 200 with post details
        expect(result.statusCode).toBe(200);
        expect(result.body.id).toBeDefined();
        expect(result.body.frustration).toBeDefined();
        expect(result.body.identity).toBeDefined();
        expect(result.body.categoryId).toBeDefined();
        expect(result.body.createdAt).toBeDefined();

        // Assert: Post ID matches the one we created
        expect(result.body.id).toBe(createResult.postId);
    });

    test('[API-140] Fetch post by ID returns post with category details', async ({ page }) => {
        // Setup: Get a valid category
        const categoryResult = await getTestCategory(page);
        expect(categoryResult.success).toBe(true);

        // Setup: Create a test post
        const createResult = await createTestPost(page, {
            categoryId: categoryResult.categoryId
        });
        expect(createResult.success).toBe(true);

        // Execute: Fetch the post by ID
        const result = await performFetchPostByIdAction(page, {
            mode: 'api',
            postId: createResult.postId
        });

        // Assert: API returns 200
        expect(result.statusCode).toBe(200);

        // Assert: Response contains category details
        const category = getCategoryFromResult(result);
        expect(category).toBeDefined();
        expect(category.name).toBeDefined();
        expect(category.slug).toBeDefined();
    });

    test('[API-141] Fetch post by ID returns vote counts', async ({ page }) => {
        // Setup: Get a valid category
        const categoryResult = await getTestCategory(page);
        expect(categoryResult.success).toBe(true);

        // Setup: Create a test post
        const createResult = await createTestPost(page, {
            categoryId: categoryResult.categoryId
        });
        expect(createResult.success).toBe(true);

        // Execute: Fetch the post by ID
        const result = await performFetchPostByIdAction(page, {
            mode: 'api',
            postId: createResult.postId
        });

        // Assert: API returns 200
        expect(result.statusCode).toBe(200);

        // Assert: Response contains vote counts
        const voteCounts = getVoteCountsFromResult(result);
        expect(voteCounts.upvotes).toBeDefined();
        expect(voteCounts.downvotes).toBeDefined();
        expect(voteCounts.score).toBeDefined();

        // Assert: Vote counts are numbers (default 0 for new posts)
        expect(typeof result.body.upvotes).toBe('number');
        expect(typeof result.body.downvotes).toBe('number');
        expect(typeof result.body.score).toBe('number');
    });

    test('[API-142] Fetch post by ID failure - post not found', async ({ page }) => {
        // Execute: Attempt to fetch a non-existent post
        const result = await performFetchPostByIdAction(page, {
            mode: 'api',
            nonExistent: true
        });

        // Assert: API returns 404
        expect(result.statusCode).toBe(404);

        // Assert: Error message is "Post not found"
        const error = getErrorFromResult(result);
        expect(error).toBe('Post not found');
    });

    test('[API-143] Fetch post by ID failure - invalid ID format', async ({ page }) => {
        // Execute: Attempt to fetch with invalid ID format
        const result = await performFetchPostByIdAction(page, {
            mode: 'api',
            invalidFormat: true
        });

        // Assert: API returns 400
        expect(result.statusCode).toBe(400);

        // Assert: Error message is "Invalid post ID"
        const error = getErrorFromResult(result);
        expect(error).toBe('Invalid post ID');
    });

});
