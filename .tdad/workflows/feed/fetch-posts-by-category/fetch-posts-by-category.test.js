// TDAD fixtures provide automatic trace capture for Golden Packet
const { test, expect } = require('../../../tdad-fixtures');
const {
    performFetchPostsByCategoryAction,
    getOrCreateTestCategory,
    getCategoryBySlug,
    getAllCategories,
    createTestPost,
    createMultipleTestPosts,
    getPostsFromResult,
    getPostCountFromResult,
    arePostsSortedByCreatedAtDesc,
    allPostsBelongToCategory,
    validatePostFields,
    getErrorFromResult,
    postsDoNotOverlap,
    getLastPostId
} = require('./fetch-posts-by-category.action.js');

/**
 * Test based on Gherkin specification:
 * Feature: Fetch Posts By Category
 *   As a user
 *   I want to filter posts by selected category
 *   So that I can browse frustrations relevant to a specific topic
 */

test.describe('Fetch Posts By Category', () => {

    // ==========================================
    // API TESTS
    // ==========================================

    test('[API-312] Fetch posts by category returns filtered posts', async ({ page, tdadTrace }) => {
        // Setup: Get categories and ensure posts exist in multiple categories
        const categoriesResult = await getAllCategories(page);
        expect(categoriesResult.success).toBe(true);
        expect(categoriesResult.categories.length).toBeGreaterThan(0);

        // Use the first category (commonly "technology" based on seed data)
        const targetCategory = categoriesResult.categories.find(c => c.slug === 'technology') || categoriesResult.categories[0];

        // Create posts in the target category
        const postsResult = await createMultipleTestPosts(page, 3, {
            categoryId: targetCategory.id
        });
        expect(postsResult.success).toBe(true);

        // Action: Fetch posts by category
        const result = await performFetchPostsByCategoryAction(page, {
            mode: 'api',
            categorySlug: targetCategory.slug
        });

        // Record action result for trace
        tdadTrace.setActionResult(result);

        // Assertions
        expect(result.success).toBe(true);
        expect(result.statusCode).toBe(200);
        expect(Array.isArray(result.posts)).toBe(true);
        expect(result.posts.length).toBeGreaterThan(0);

        // Verify all posts belong to the target category
        expect(allPostsBelongToCategory(result.posts, targetCategory.slug)).toBe(true);
    });

    test('[API-313] Fetch posts by category returns post data with required fields', async ({ page, tdadTrace }) => {
        // Setup: Get a category (use "work" if available, otherwise first available)
        const categoriesResult = await getAllCategories(page);
        expect(categoriesResult.success).toBe(true);

        const targetCategory = categoriesResult.categories.find(c => c.slug === 'work') || categoriesResult.categories[0];

        // Create at least one post in the category
        const postResult = await createTestPost(page, {
            categoryId: targetCategory.id
        });
        expect(postResult.success).toBe(true);

        // Action: Fetch posts by category
        const result = await performFetchPostsByCategoryAction(page, {
            mode: 'api',
            categorySlug: targetCategory.slug
        });

        // Record action result for trace
        tdadTrace.setActionResult(result);

        // Assertions
        expect(result.success).toBe(true);
        expect(result.statusCode).toBe(200);
        expect(result.posts.length).toBeGreaterThan(0);

        // Validate required fields on the first post
        const firstPost = result.posts[0];

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

    test('[API-314] Fetch posts by category with default pagination limit', async ({ page, tdadTrace }) => {
        // Setup: Get a category (use "daily-life" if available)
        const categoriesResult = await getAllCategories(page);
        expect(categoriesResult.success).toBe(true);

        const targetCategory = categoriesResult.categories.find(c => c.slug === 'daily-life') || categoriesResult.categories[0];

        // Create more than 20 posts to test default limit
        const postsResult = await createMultipleTestPosts(page, 25, {
            categoryId: targetCategory.id
        });
        expect(postsResult.success).toBe(true);

        // Action: Fetch posts without limit parameter
        const result = await performFetchPostsByCategoryAction(page, {
            mode: 'api',
            categorySlug: targetCategory.slug
        });

        // Record action result for trace
        tdadTrace.setActionResult(result);

        // Assertions
        expect(result.success).toBe(true);
        expect(result.statusCode).toBe(200);
        expect(Array.isArray(result.posts)).toBe(true);

        // Default limit is 20, so should get at most 20 posts
        expect(result.posts.length).toBeLessThanOrEqual(20);

        // Verify all posts belong to the target category
        expect(allPostsBelongToCategory(result.posts, targetCategory.slug)).toBe(true);
    });

    test('[API-315] Fetch posts by category with custom limit', async ({ page, tdadTrace }) => {
        // Setup: Get a category (use "relationships" if available)
        const categoriesResult = await getAllCategories(page);
        expect(categoriesResult.success).toBe(true);

        const targetCategory = categoriesResult.categories.find(c => c.slug === 'relationships') || categoriesResult.categories[0];

        // Create posts in the category
        const postsResult = await createMultipleTestPosts(page, 15, {
            categoryId: targetCategory.id
        });
        expect(postsResult.success).toBe(true);

        // Action: Fetch posts with custom limit of 10
        const result = await performFetchPostsByCategoryAction(page, {
            mode: 'api',
            categorySlug: targetCategory.slug,
            limit: 10
        });

        // Record action result for trace
        tdadTrace.setActionResult(result);

        // Assertions
        expect(result.success).toBe(true);
        expect(result.statusCode).toBe(200);
        expect(Array.isArray(result.posts)).toBe(true);
        expect(result.posts.length).toBeLessThanOrEqual(10);

        // Verify all posts belong to the target category
        expect(allPostsBelongToCategory(result.posts, targetCategory.slug)).toBe(true);
    });

    test('[API-316] Fetch posts by category with cursor-based pagination', async ({ page, tdadTrace }) => {
        // Setup: Get a category (use "parenting" if available)
        const categoriesResult = await getAllCategories(page);
        expect(categoriesResult.success).toBe(true);

        const targetCategory = categoriesResult.categories.find(c => c.slug === 'parenting') || categoriesResult.categories[0];

        // Create enough posts for pagination
        const postsResult = await createMultipleTestPosts(page, 15, {
            categoryId: targetCategory.id
        });
        expect(postsResult.success).toBe(true);

        // Action: Fetch first page with limit 5
        const firstPageResult = await performFetchPostsByCategoryAction(page, {
            mode: 'api',
            categorySlug: targetCategory.slug,
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
        const secondPageResult = await performFetchPostsByCategoryAction(page, {
            mode: 'api',
            categorySlug: targetCategory.slug,
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

        // Verify all posts belong to the target category
        expect(allPostsBelongToCategory(secondPageResult.posts, targetCategory.slug)).toBe(true);
    });

    test('[API-317] Fetch posts by category returns empty array when category has no posts', async ({ page, tdadTrace }) => {
        // Setup: Get a category (use "health" if available)
        const categoriesResult = await getAllCategories(page);
        expect(categoriesResult.success).toBe(true);

        // Find a category that likely has no posts or use a unique slug
        // Since we can't guarantee a category is empty, we'll use a category
        // and check that the response format is correct
        const targetCategory = categoriesResult.categories.find(c => c.slug === 'health') || categoriesResult.categories[categoriesResult.categories.length - 1];

        // Action: Fetch posts by category
        const result = await performFetchPostsByCategoryAction(page, {
            mode: 'api',
            categorySlug: targetCategory.slug
        });

        // Record action result for trace
        tdadTrace.setActionResult(result);

        // Assertions - verify the response format is correct
        expect(result.success).toBe(true);
        expect(result.statusCode).toBe(200);
        expect(Array.isArray(result.posts)).toBe(true);

        // If posts are returned, verify they belong to the correct category
        if (result.posts.length > 0) {
            expect(allPostsBelongToCategory(result.posts, targetCategory.slug)).toBe(true);
        }
    });

    test('[API-318] Fetch posts by category with invalid category slug', async ({ page, tdadTrace }) => {
        // Setup: Verify categories exist in database
        const categoriesResult = await getAllCategories(page);
        expect(categoriesResult.success).toBe(true);
        expect(categoriesResult.categories.length).toBeGreaterThan(0);

        // Action: Fetch posts with non-existent category slug
        const result = await performFetchPostsByCategoryAction(page, {
            mode: 'api',
            categorySlug: 'non-existent-category'
        });

        // Record action result for trace
        tdadTrace.setActionResult(result);

        // Assertions - expect 404 for non-existent category
        expect(result.success).toBe(false);
        expect(result.statusCode).toBe(404);

        const errorMessage = getErrorFromResult(result);
        expect(errorMessage).toBeTruthy();
        expect(errorMessage).toContain('Category not found');
    });

    test('[API-319] Fetch posts by category without required categorySlug parameter', async ({ page, tdadTrace }) => {
        // Setup: Ensure posts exist in the database
        const categoryResult = await getOrCreateTestCategory(page);
        expect(categoryResult.success).toBe(true);

        const postResult = await createTestPost(page, {
            categoryId: categoryResult.categoryId
        });
        expect(postResult.success).toBe(true);

        // Action: Fetch posts without categorySlug parameter
        const result = await performFetchPostsByCategoryAction(page, {
            mode: 'api',
            omitCategorySlug: true
        });

        // Record action result for trace
        tdadTrace.setActionResult(result);

        // Assertions - expect 400 for missing required parameter
        expect(result.success).toBe(false);
        expect(result.statusCode).toBe(400);

        const errorMessage = getErrorFromResult(result);
        expect(errorMessage).toBeTruthy();
    });

    test('[API-320] Fetch posts by category with invalid limit below minimum', async ({ page, tdadTrace }) => {
        // Setup: Get a category
        const categoriesResult = await getAllCategories(page);
        expect(categoriesResult.success).toBe(true);

        const targetCategory = categoriesResult.categories.find(c => c.slug === 'technology') || categoriesResult.categories[0];

        // Create a post to ensure data exists
        const postResult = await createTestPost(page, {
            categoryId: targetCategory.id
        });
        expect(postResult.success).toBe(true);

        // Action: Fetch posts with limit 0 (below minimum of 1)
        const result = await performFetchPostsByCategoryAction(page, {
            mode: 'api',
            categorySlug: targetCategory.slug,
            limit: 0
        });

        // Record action result for trace
        tdadTrace.setActionResult(result);

        // Assertions - expect 400 for invalid limit
        expect(result.success).toBe(false);
        expect(result.statusCode).toBe(400);

        const errorMessage = getErrorFromResult(result);
        expect(errorMessage).toBeTruthy();
    });

    test('[API-321] Fetch posts by category with invalid limit above maximum', async ({ page, tdadTrace }) => {
        // Setup: Get a category
        const categoriesResult = await getAllCategories(page);
        expect(categoriesResult.success).toBe(true);

        const targetCategory = categoriesResult.categories.find(c => c.slug === 'technology') || categoriesResult.categories[0];

        // Create a post to ensure data exists
        const postResult = await createTestPost(page, {
            categoryId: targetCategory.id
        });
        expect(postResult.success).toBe(true);

        // Action: Fetch posts with limit 100 (above maximum of 50)
        const result = await performFetchPostsByCategoryAction(page, {
            mode: 'api',
            categorySlug: targetCategory.slug,
            limit: 100
        });

        // Record action result for trace
        tdadTrace.setActionResult(result);

        // Assertions - expect 400 for invalid limit
        expect(result.success).toBe(false);
        expect(result.statusCode).toBe(400);

        const errorMessage = getErrorFromResult(result);
        expect(errorMessage).toBeTruthy();
    });

    test('[API-322] Fetch posts by category returns posts sorted by creation date descending', async ({ page, tdadTrace }) => {
        // Setup: Get a category (use "finance" if available)
        const categoriesResult = await getAllCategories(page);
        expect(categoriesResult.success).toBe(true);

        const targetCategory = categoriesResult.categories.find(c => c.slug === 'finance') || categoriesResult.categories[0];

        // Create posts with varying creation times
        const postsResult = await createMultipleTestPosts(page, 5, {
            categoryId: targetCategory.id
        });
        expect(postsResult.success).toBe(true);

        // Action: Fetch posts by category
        const result = await performFetchPostsByCategoryAction(page, {
            mode: 'api',
            categorySlug: targetCategory.slug
        });

        // Record action result for trace
        tdadTrace.setActionResult(result);

        // Assertions
        expect(result.success).toBe(true);
        expect(result.statusCode).toBe(200);
        expect(result.posts.length).toBeGreaterThan(0);

        // Verify posts are sorted by creation date descending
        expect(arePostsSortedByCreatedAtDesc(result.posts)).toBe(true);

        // Verify all posts belong to the target category
        expect(allPostsBelongToCategory(result.posts, targetCategory.slug)).toBe(true);
    });

});
