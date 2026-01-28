// TDAD fixtures provide automatic trace capture for Golden Packet
const { test, expect } = require('../../../tdad-fixtures');
const {
    performFetchHotPostsAction,
    getOrCreateTestCategory,
    getCategoryBySlug,
    createTestPost,
    createMultipleTestPosts,
    getPostsFromResult,
    getPostCountFromResult,
    arePostsSortedByHotScore,
    allPostsBelongToCategory,
    validatePostFields,
    getErrorFromResult,
    postsDoNotOverlap,
    getLastPostId
} = require('./fetch-hot-posts.action.js');

/**
 * Test based on Gherkin specification:
 * Feature: Fetch Hot Posts
 *   As a user
 *   I want to query posts sorted by hot score
 *   So that I can discover trending frustrations
 */

test.describe('Fetch Hot Posts', () => {

    // ==========================================
    // API TESTS
    // ==========================================

    test('[API-292] Fetch hot posts returns posts sorted by hot score', async ({ page, tdadTrace }) => {
        // Setup: Ensure posts exist with varying hot scores
        const categoryResult = await getOrCreateTestCategory(page);
        expect(categoryResult.success).toBe(true);

        // Create multiple posts to ensure we have data
        const postsResult = await createMultipleTestPosts(page, 3, {
            categoryId: categoryResult.categoryId
        });
        expect(postsResult.success).toBe(true);

        // Action: Fetch hot posts
        const result = await performFetchHotPostsAction(page, { mode: 'api' });

        // Record action result for trace
        tdadTrace.setActionResult(result);

        // Assertions
        expect(result.success).toBe(true);
        expect(result.statusCode).toBe(200);
        expect(Array.isArray(result.posts)).toBe(true);
        expect(result.posts.length).toBeGreaterThan(0);

        // Verify posts are sorted by hot score descending
        expect(arePostsSortedByHotScore(result.posts)).toBe(true);
    });

    test('[API-293] Fetch hot posts returns post data with required fields', async ({ page, tdadTrace }) => {
        // Setup: Ensure at least one post exists
        const categoryResult = await getOrCreateTestCategory(page);
        expect(categoryResult.success).toBe(true);

        const postResult = await createTestPost(page, {
            categoryId: categoryResult.categoryId
        });
        expect(postResult.success).toBe(true);

        // Action: Fetch hot posts
        const result = await performFetchHotPostsAction(page, { mode: 'api' });

        // Record action result for trace
        tdadTrace.setActionResult(result);

        // Assertions
        expect(result.success).toBe(true);
        expect(result.statusCode).toBe(200);
        expect(result.posts.length).toBeGreaterThan(0);

        // Validate required fields on the first post
        const firstPost = result.posts[0];

        // Check each required field
        expect(firstPost.id).toBeDefined();
        expect(firstPost.frustration).toBeDefined();
        expect(firstPost.identity).toBeDefined();
        expect(firstPost.upvotes).toBeDefined();
        expect(firstPost.downvotes).toBeDefined();
        expect(firstPost.score).toBeDefined();
        expect(firstPost.commentCount).toBeDefined();
        expect(firstPost.createdAt).toBeDefined();
        expect(firstPost.category).toBeDefined();
        expect(firstPost.category.name).toBeDefined();
        expect(firstPost.category.slug).toBeDefined();
    });

    test('[API-294] Fetch hot posts with default pagination limit', async ({ page, tdadTrace }) => {
        // Setup: Ensure we have more than 20 posts
        const categoryResult = await getOrCreateTestCategory(page);
        expect(categoryResult.success).toBe(true);

        // Create 25 posts to ensure we exceed the default limit
        const postsResult = await createMultipleTestPosts(page, 25, {
            categoryId: categoryResult.categoryId
        });
        expect(postsResult.success).toBe(true);

        // Action: Fetch hot posts without limit parameter
        const result = await performFetchHotPostsAction(page, { mode: 'api' });

        // Record action result for trace
        tdadTrace.setActionResult(result);

        // Assertions
        expect(result.success).toBe(true);
        expect(result.statusCode).toBe(200);
        expect(Array.isArray(result.posts)).toBe(true);

        // Default limit is 20, so we should get at most 20 posts
        expect(result.posts.length).toBeLessThanOrEqual(20);
    });

    test('[API-295] Fetch hot posts with custom limit', async ({ page, tdadTrace }) => {
        // Setup: Ensure posts exist
        const categoryResult = await getOrCreateTestCategory(page);
        expect(categoryResult.success).toBe(true);

        const postsResult = await createMultipleTestPosts(page, 15, {
            categoryId: categoryResult.categoryId
        });
        expect(postsResult.success).toBe(true);

        // Action: Fetch hot posts with limit 10
        const result = await performFetchHotPostsAction(page, {
            mode: 'api',
            limit: 10
        });

        // Record action result for trace
        tdadTrace.setActionResult(result);

        // Assertions
        expect(result.success).toBe(true);
        expect(result.statusCode).toBe(200);
        expect(Array.isArray(result.posts)).toBe(true);
        expect(result.posts.length).toBeLessThanOrEqual(10);
    });

    test('[API-296] Fetch hot posts with cursor-based pagination', async ({ page, tdadTrace }) => {
        // Setup: Ensure we have enough posts for pagination
        const categoryResult = await getOrCreateTestCategory(page);
        expect(categoryResult.success).toBe(true);

        const postsResult = await createMultipleTestPosts(page, 15, {
            categoryId: categoryResult.categoryId
        });
        expect(postsResult.success).toBe(true);

        // Action: Fetch first page with limit 5
        const firstPageResult = await performFetchHotPostsAction(page, {
            mode: 'api',
            limit: 5
        });

        // Assertions for first page
        expect(firstPageResult.success).toBe(true);
        expect(firstPageResult.statusCode).toBe(200);
        expect(firstPageResult.posts.length).toBeGreaterThan(0);

        // Get cursor from last post of first page
        const cursor = getLastPostId(firstPageResult.posts);
        expect(cursor).toBeTruthy();

        // Action: Fetch second page using cursor
        const secondPageResult = await performFetchHotPostsAction(page, {
            mode: 'api',
            limit: 5,
            cursor: cursor
        });

        // Record action result for trace
        tdadTrace.setActionResult(secondPageResult);

        // Assertions for second page
        expect(secondPageResult.success).toBe(true);
        expect(secondPageResult.statusCode).toBe(200);

        // Verify posts don't overlap between pages
        expect(postsDoNotOverlap(firstPageResult.posts, secondPageResult.posts)).toBe(true);
    });

    test('[API-297] Fetch hot posts filtered by category', async ({ page, tdadTrace }) => {
        // Setup: Get categories
        const categoriesResponse = await page.request.get('/api/categories');
        expect(categoriesResponse.ok()).toBe(true);
        const categories = await categoriesResponse.json();
        expect(Array.isArray(categories)).toBe(true);
        expect(categories.length).toBeGreaterThan(0);

        // Use the first category (typically "technology" based on seed data)
        const targetCategory = categories[0];

        // Create posts in the target category
        const postsResult = await createMultipleTestPosts(page, 3, {
            categoryId: targetCategory.id
        });
        expect(postsResult.success).toBe(true);

        // Action: Fetch hot posts filtered by category slug
        const result = await performFetchHotPostsAction(page, {
            mode: 'api',
            categorySlug: targetCategory.slug
        });

        // Record action result for trace
        tdadTrace.setActionResult(result);

        // Assertions
        expect(result.success).toBe(true);
        expect(result.statusCode).toBe(200);
        expect(Array.isArray(result.posts)).toBe(true);

        // If posts are returned, verify they all belong to the target category
        if (result.posts.length > 0) {
            expect(allPostsBelongToCategory(result.posts, targetCategory.slug)).toBe(true);
        }
    });

    test('[API-298] Fetch hot posts returns empty array when no posts exist', async ({ page, tdadTrace }) => {
        // Note: This test scenario is difficult to guarantee since we can't ensure
        // the database is completely empty without direct DB access.
        // Instead, we test with a category that likely has no posts.

        // Action: Fetch hot posts with a non-existent category slug
        const result = await performFetchHotPostsAction(page, {
            mode: 'api',
            categorySlug: `nonexistent-category-${Date.now()}`
        });

        // Record action result for trace
        tdadTrace.setActionResult(result);

        // Assertions
        expect(result.success).toBe(true);
        expect(result.statusCode).toBe(200);
        expect(Array.isArray(result.posts)).toBe(true);
        expect(result.posts.length).toBe(0);
    });

    test('[API-299] Fetch hot posts returns empty array for category with no posts', async ({ page, tdadTrace }) => {
        // Setup: Get categories
        const categoriesResponse = await page.request.get('/api/categories');
        expect(categoriesResponse.ok()).toBe(true);
        const categories = await categoriesResponse.json();
        expect(Array.isArray(categories)).toBe(true);

        // Find a category that might have fewer or no posts
        // Use a unique slug that likely doesn't exist
        const emptySlug = `empty-test-category-${Date.now()}`;

        // Action: Fetch hot posts with a category that has no posts
        const result = await performFetchHotPostsAction(page, {
            mode: 'api',
            categorySlug: emptySlug
        });

        // Record action result for trace
        tdadTrace.setActionResult(result);

        // Assertions
        expect(result.success).toBe(true);
        expect(result.statusCode).toBe(200);
        expect(Array.isArray(result.posts)).toBe(true);
        expect(result.posts.length).toBe(0);
    });

    test('[API-300] Fetch hot posts with invalid limit below minimum', async ({ page, tdadTrace }) => {
        // Action: Fetch hot posts with limit 0 (below minimum of 1)
        const result = await performFetchHotPostsAction(page, {
            mode: 'api',
            limit: 0
        });

        // Record action result for trace
        tdadTrace.setActionResult(result);

        // Assertions
        expect(result.success).toBe(false);
        expect(result.statusCode).toBe(400);

        // Error message should indicate invalid input
        const errorMessage = getErrorFromResult(result);
        expect(errorMessage).toBeTruthy();
    });

    test('[API-301] Fetch hot posts with invalid limit above maximum', async ({ page, tdadTrace }) => {
        // Action: Fetch hot posts with limit 100 (above maximum of 50)
        const result = await performFetchHotPostsAction(page, {
            mode: 'api',
            limit: 100
        });

        // Record action result for trace
        tdadTrace.setActionResult(result);

        // Assertions
        expect(result.success).toBe(false);
        expect(result.statusCode).toBe(400);

        // Error message should indicate invalid input
        const errorMessage = getErrorFromResult(result);
        expect(errorMessage).toBeTruthy();
    });

});
