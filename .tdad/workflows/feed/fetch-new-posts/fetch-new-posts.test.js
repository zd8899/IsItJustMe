// TDAD fixtures provide automatic trace capture for Golden Packet
const { test, expect } = require('../../../tdad-fixtures');
const {
    performFetchNewPostsAction,
    getOrCreateTestCategory,
    getCategoryBySlug,
    createTestPost,
    createMultipleTestPosts,
    getPostsFromResult,
    getPostCountFromResult,
    arePostsSortedByCreatedAt,
    allPostsBelongToCategory,
    validatePostFields,
    getErrorFromResult,
    postsDoNotOverlap,
    getLastPostId
} = require('./fetch-new-posts.action.js');

/**
 * Test based on Gherkin specification:
 * Feature: Fetch New Posts
 *   As a user
 *   I want to query posts sorted by creation date
 *   So that I can discover the latest frustrations
 */

test.describe('Fetch New Posts', () => {

    // ==========================================
    // API TESTS
    // ==========================================

    test('[API-302] Fetch new posts returns posts sorted by creation date', async ({ page, tdadTrace }) => {
        // Setup: Ensure posts exist with varying creation times
        const categoryResult = await getOrCreateTestCategory(page);
        expect(categoryResult.success).toBe(true);

        // Create multiple posts to ensure we have data
        const postsResult = await createMultipleTestPosts(page, 3, {
            categoryId: categoryResult.categoryId
        });
        expect(postsResult.success).toBe(true);

        // Action: Fetch new posts
        const result = await performFetchNewPostsAction(page, { mode: 'api' });

        // Record action result for trace
        tdadTrace.setActionResult(result);

        // Assertions
        expect(result.success).toBe(true);
        expect(result.statusCode).toBe(200);
        expect(Array.isArray(result.posts)).toBe(true);
        expect(result.posts.length).toBeGreaterThan(0);

        // Verify posts are sorted by creation date descending (newest first)
        expect(arePostsSortedByCreatedAt(result.posts)).toBe(true);
    });

    test('[API-303] Fetch new posts returns post data with required fields', async ({ page, tdadTrace }) => {
        // Setup: Ensure at least one post exists
        const categoryResult = await getOrCreateTestCategory(page);
        expect(categoryResult.success).toBe(true);

        const postResult = await createTestPost(page, {
            categoryId: categoryResult.categoryId
        });
        expect(postResult.success).toBe(true);

        // Action: Fetch new posts
        const result = await performFetchNewPostsAction(page, { mode: 'api' });

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

    test('[API-304] Fetch new posts with default pagination limit', async ({ page, tdadTrace }) => {
        // Setup: Ensure we have more than 20 posts
        const categoryResult = await getOrCreateTestCategory(page);
        expect(categoryResult.success).toBe(true);

        // Create 25 posts to ensure we exceed the default limit
        const postsResult = await createMultipleTestPosts(page, 25, {
            categoryId: categoryResult.categoryId
        });
        expect(postsResult.success).toBe(true);

        // Action: Fetch new posts without limit parameter
        const result = await performFetchNewPostsAction(page, { mode: 'api' });

        // Record action result for trace
        tdadTrace.setActionResult(result);

        // Assertions
        expect(result.success).toBe(true);
        expect(result.statusCode).toBe(200);
        expect(Array.isArray(result.posts)).toBe(true);

        // Default limit is 20, so we should get at most 20 posts
        expect(result.posts.length).toBeLessThanOrEqual(20);
    });

    test('[API-305] Fetch new posts with custom limit', async ({ page, tdadTrace }) => {
        // Setup: Ensure posts exist
        const categoryResult = await getOrCreateTestCategory(page);
        expect(categoryResult.success).toBe(true);

        const postsResult = await createMultipleTestPosts(page, 15, {
            categoryId: categoryResult.categoryId
        });
        expect(postsResult.success).toBe(true);

        // Action: Fetch new posts with limit 10
        const result = await performFetchNewPostsAction(page, {
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

    test('[API-306] Fetch new posts with cursor-based pagination', async ({ page, tdadTrace }) => {
        // Setup: Ensure we have enough posts for pagination
        const categoryResult = await getOrCreateTestCategory(page);
        expect(categoryResult.success).toBe(true);

        const postsResult = await createMultipleTestPosts(page, 15, {
            categoryId: categoryResult.categoryId
        });
        expect(postsResult.success).toBe(true);

        // Action: Fetch first page with limit 5
        const firstPageResult = await performFetchNewPostsAction(page, {
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
        const secondPageResult = await performFetchNewPostsAction(page, {
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

    test('[API-307] Fetch new posts filtered by category', async ({ page, tdadTrace }) => {
        // Setup: Get categories
        const categoriesResponse = await page.request.get('/api/categories');
        expect(categoriesResponse.ok()).toBe(true);
        const categories = await categoriesResponse.json();
        expect(Array.isArray(categories)).toBe(true);
        expect(categories.length).toBeGreaterThan(0);

        // Find or use "technology" category based on seed data
        const targetCategory = categories.find(c => c.slug === 'technology') || categories[0];

        // Create posts in the target category
        const postsResult = await createMultipleTestPosts(page, 3, {
            categoryId: targetCategory.id
        });
        expect(postsResult.success).toBe(true);

        // Action: Fetch new posts filtered by category slug
        const result = await performFetchNewPostsAction(page, {
            mode: 'api',
            categorySlug: targetCategory.slug
        });

        // Record action result for trace
        tdadTrace.setActionResult(result);

        // Assertions
        expect(result.success).toBe(true);
        expect(result.statusCode).toBe(200);
        expect(Array.isArray(result.posts)).toBe(true);

        // Verify all posts belong to the target category
        expect(allPostsBelongToCategory(result.posts, targetCategory.slug)).toBe(true);
    });

    test('[API-308] Fetch new posts returns empty array when no posts exist', async ({ page, tdadTrace }) => {
        // Note: We test with a non-existent category slug since we can't guarantee
        // the database is completely empty without direct DB access.

        // Action: Fetch new posts with a non-existent category slug
        const result = await performFetchNewPostsAction(page, {
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

    test('[API-309] Fetch new posts returns empty array for category with no posts', async ({ page, tdadTrace }) => {
        // Setup: Use a unique slug that likely doesn't exist (simulates "health" category with no posts)
        const emptySlug = `health-empty-${Date.now()}`;

        // Action: Fetch new posts with a category that has no posts
        const result = await performFetchNewPostsAction(page, {
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

    test('[API-310] Fetch new posts with invalid limit below minimum', async ({ page, tdadTrace }) => {
        // Action: Fetch new posts with limit 0 (below minimum of 1)
        const result = await performFetchNewPostsAction(page, {
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

    test('[API-311] Fetch new posts with invalid limit above maximum', async ({ page, tdadTrace }) => {
        // Action: Fetch new posts with limit 100 (above maximum of 50)
        const result = await performFetchNewPostsAction(page, {
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
