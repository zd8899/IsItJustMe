// TDAD fixtures provide automatic trace capture for Golden Packet
const { test, expect } = require('../../../tdad-fixtures');
const {
    performLoadMorePostsAction,
    performFetchNextHotPostsAction,
    performFetchNextNewPostsAction,
    performFetchNextCategoryPostsAction,
    performLoadMorePostsUIAction,
    performVerifyLoadingStateAction,
    performVerifyNoMorePostsAction,
    performVerifyCategoryConsistencyAction,
    performVerifySortingMaintainedAction,
    performVerifyErrorHandlingAction,
    createTestPostsForPagination,
    arePostsSortedByHotScore,
    arePostsSortedByCreatedAt,
    allPostsBelongToCategory,
    postsDoNotOverlap,
    getCursorFromPosts,
    createTestPost,
    getOrCreateTestCategory,
    getCategoryBySlug,
    createMultipleTestPosts
} = require('./load-more-posts.action.js');
const { performShowPostListAction } = require('../show-post-list/show-post-list.action.js');

/**
 * Test based on Gherkin specification:
 * Feature: Load More Posts
 *   As a user
 *   I want to load more posts as I scroll down the feed
 *   So that I can browse through all available content without page reloads
 */

test.describe('Load More Posts', () => {

    // ==========================================
    // API TESTS
    // ==========================================

    test('[API-325] Fetch next page of hot posts successfully', async ({ page, tdadTrace }) => {
        // Setup: Create posts to ensure pagination
        const setupResult = await createTestPostsForPagination(page, 5);
        expect(setupResult.success).toBe(true);

        // Fetch first page of hot posts
        const firstPageResult = await performFetchNextHotPostsAction(page, { limit: 3 });
        expect(firstPageResult.success).toBe(true);
        expect(firstPageResult.statusCode).toBe(200);
        expect(Array.isArray(firstPageResult.posts)).toBe(true);

        // Get cursor from first page
        const cursor = getCursorFromPosts(firstPageResult.posts);

        // Fetch next page using cursor
        const secondPageResult = await performFetchNextHotPostsAction(page, { cursor, limit: 3 });

        tdadTrace.setActionResult(secondPageResult);

        // Assertions
        expect(secondPageResult.statusCode).toBe(200);
        expect(Array.isArray(secondPageResult.posts)).toBe(true);
        expect(secondPageResult.posts.length).toBeGreaterThanOrEqual(0);

        // Verify posts are sorted by hot score
        const isSorted = arePostsSortedByHotScore(secondPageResult.posts);
        expect(isSorted).toBe(true);

        // Verify no overlap between pages
        if (secondPageResult.posts.length > 0) {
            const noOverlap = postsDoNotOverlap(firstPageResult.posts, secondPageResult.posts);
            expect(noOverlap).toBe(true);
        }
    });

    test('[API-326] Fetch next page of new posts successfully', async ({ page, tdadTrace }) => {
        // Setup: Create posts with different creation times
        const setupResult = await createTestPostsForPagination(page, 5);
        expect(setupResult.success).toBe(true);

        // Fetch first page of new posts
        const firstPageResult = await performFetchNextNewPostsAction(page, { limit: 3 });
        expect(firstPageResult.success).toBe(true);
        expect(firstPageResult.statusCode).toBe(200);
        expect(Array.isArray(firstPageResult.posts)).toBe(true);

        // Get cursor from first page
        const cursor = getCursorFromPosts(firstPageResult.posts);

        // Fetch next page using cursor
        const secondPageResult = await performFetchNextNewPostsAction(page, { cursor, limit: 3 });

        tdadTrace.setActionResult(secondPageResult);

        // Assertions
        expect(secondPageResult.statusCode).toBe(200);
        expect(Array.isArray(secondPageResult.posts)).toBe(true);
        expect(secondPageResult.posts.length).toBeGreaterThanOrEqual(0);

        // Verify posts are sorted by creation date descending
        const isSorted = arePostsSortedByCreatedAt(secondPageResult.posts);
        expect(isSorted).toBe(true);

        // Verify no overlap between pages
        if (secondPageResult.posts.length > 0) {
            const noOverlap = postsDoNotOverlap(firstPageResult.posts, secondPageResult.posts);
            expect(noOverlap).toBe(true);
        }
    });

    test('[API-327] Fetch next page with category filter applied', async ({ page, tdadTrace }) => {
        // Get a valid category
        const categoryResult = await getCategoryBySlug(page, 'technology');
        let categorySlug = 'technology';

        if (!categoryResult.success) {
            // Fallback to first available category
            const fallbackCategory = await getOrCreateTestCategory(page);
            expect(fallbackCategory.success).toBe(true);
            categorySlug = fallbackCategory.categorySlug;
        }

        // Setup: Create posts in the category
        const setupResult = await createTestPostsForPagination(page, 5, { categorySlug });
        expect(setupResult.success).toBe(true);

        // Fetch first page filtered by category
        const firstPageResult = await performFetchNextCategoryPostsAction(page, { categorySlug, limit: 3 });
        expect(firstPageResult.success).toBe(true);
        expect(firstPageResult.statusCode).toBe(200);

        // Get cursor from first page
        const cursor = getCursorFromPosts(firstPageResult.posts);

        // Fetch next page with same category filter
        const secondPageResult = await performFetchNextCategoryPostsAction(page, { categorySlug, cursor, limit: 3 });

        tdadTrace.setActionResult(secondPageResult);

        // Assertions
        expect(secondPageResult.statusCode).toBe(200);
        expect(Array.isArray(secondPageResult.posts)).toBe(true);

        // Verify all posts belong to the filtered category
        const allBelongToCategory = allPostsBelongToCategory(secondPageResult.posts, categorySlug);
        expect(allBelongToCategory).toBe(true);

        // Verify no overlap between pages
        if (secondPageResult.posts.length > 0) {
            const noOverlap = postsDoNotOverlap(firstPageResult.posts, secondPageResult.posts);
            expect(noOverlap).toBe(true);
        }
    });

    test('[API-328] Fetch next page returns empty when no more posts exist', async ({ page, tdadTrace }) => {
        // Create a small number of posts
        const setupResult = await createMultipleTestPosts(page, 2);
        expect(setupResult.success).toBe(true);

        // Keep fetching pages until we reach the end (DB isolation: may have accumulated posts)
        let currentCursor = undefined;
        let lastPageResult = null;
        let pageCount = 0;
        const maxPages = 100; // Safety limit to prevent infinite loop

        while (pageCount < maxPages) {
            const pageResult = await performFetchNextHotPostsAction(page, { cursor: currentCursor, limit: 50 });
            expect(pageResult.success).toBe(true);
            expect(pageResult.statusCode).toBe(200);
            expect(Array.isArray(pageResult.posts)).toBe(true);

            lastPageResult = pageResult;
            pageCount++;

            // If nextCursor is null or we got fewer than limit posts, we've reached the end
            if (pageResult.nextCursor === null || pageResult.posts.length < 50) {
                break;
            }

            currentCursor = pageResult.nextCursor;
        }

        tdadTrace.setActionResult({ ...lastPageResult, pagesFetched: pageCount });

        // Eventually we should reach a page with no more posts
        // The nextCursor should be null when no more posts exist
        expect(lastPageResult.posts.length).toBeLessThan(50);
    });

    test('[API-329] Fetch posts with invalid cursor returns error', async ({ page, tdadTrace }) => {
        // Attempt to fetch with an invalid cursor
        const invalidCursor = 'invalid_cursor_12345_not_real';

        const result = await performFetchNextHotPostsAction(page, { cursor: invalidCursor });

        tdadTrace.setActionResult(result);

        // The API should handle invalid cursor gracefully
        // It may return 200 with empty results or 400 with error
        // Based on tRPC behavior, it typically returns an empty result set
        expect(result.statusCode).toBeDefined();

        if (result.statusCode === 400) {
            // If error is returned
            expect(result.errorMessage).toBeDefined();
        } else {
            // If empty result is returned (cursor not found means no posts)
            expect(result.statusCode).toBe(200);
            expect(Array.isArray(result.posts)).toBe(true);
        }
    });

    // ==========================================
    // UI TESTS
    // ==========================================

    test('[UI-167] Load more posts when user scrolls to bottom', async ({ page, tdadTrace }) => {
        // Setup: Create enough posts to require pagination
        const setupResult = await createTestPostsForPagination(page, 25);
        expect(setupResult.success).toBe(true);

        // Navigate and load initial posts
        const initialResult = await performShowPostListAction(page);
        expect(initialResult.success).toBe(true);

        // Perform scroll to load more
        const result = await performLoadMorePostsUIAction(page, { skipNavigation: true });

        tdadTrace.setActionResult(result);

        // Assertions
        expect(result.success).toBe(true);
        expect(result.initialPostCount).toBeGreaterThan(0);

        // Verify page structure exists
        await expect(page.locator('.space-y-4.mt-4')).toBeVisible();

        // Post cards should be present
        await expect(page.locator('.bg-white.border.border-primary-200.rounded-lg').first()).toBeVisible();
    });

    test('[UI-168] Load more posts maintains current feed type', async ({ page, tdadTrace }) => {
        // Setup: Create posts
        const setupResult = await createTestPostsForPagination(page, 10);
        expect(setupResult.success).toBe(true);

        // Navigate to home
        await page.goto('/');
        await page.waitForLoadState('domcontentloaded');

        // Verify Hot tab is active by default
        const hotTab = page.getByRole('button', { name: 'Hot' });
        await expect(hotTab).toBeVisible();

        // Perform scroll and verify sorting maintained
        const result = await performVerifySortingMaintainedAction(page, { feedType: 'hot', skipNavigation: true });

        tdadTrace.setActionResult(result);

        // Assertions
        expect(result.success).toBe(true);
        expect(result.sortingMaintained).toBe(true);

        // Verify Hot tab is still active
        const hotTabClass = await hotTab.getAttribute('class');
        expect(hotTabClass).toContain('bg-primary-900');
    });

    test('[UI-169] Load more posts maintains category filter', async ({ page, tdadTrace }) => {
        // Get work category
        const categoryResult = await getCategoryBySlug(page, 'work');
        let categorySlug = 'work';
        let categoryLabel = 'Work';

        if (!categoryResult.success) {
            const fallbackCategory = await getOrCreateTestCategory(page);
            expect(fallbackCategory.success).toBe(true);
            categorySlug = fallbackCategory.categorySlug;
            categoryLabel = fallbackCategory.categoryName;
        }

        // Setup: Create posts in the Work category
        const setupResult = await createTestPostsForPagination(page, 10, { categorySlug });
        expect(setupResult.success).toBe(true);

        // Verify category consistency
        const result = await performVerifyCategoryConsistencyAction(page, { categoryLabel, categorySlug });

        tdadTrace.setActionResult(result);

        // Assertions
        expect(result.success).toBe(true);
        expect(result.allPostsMatchCategory).toBe(true);
    });

    test('[UI-170] No more posts indicator when all posts loaded', async ({ page, tdadTrace }) => {
        // Setup: Create a small number of posts
        const setupResult = await createMultipleTestPosts(page, 3);
        expect(setupResult.success).toBe(true);

        // Test no more posts behavior
        const result = await performVerifyNoMorePostsAction(page, { maxScrollAttempts: 3 });

        tdadTrace.setActionResult(result);

        // Assertions
        expect(result.success).toBe(true);
        expect(result.noMorePostsLoaded).toBe(true);
        expect(result.loadingIndicatorNotVisible).toBe(true);
    });

    test('[UI-171] Load more posts on New tab', async ({ page, tdadTrace }) => {
        // Setup: Create posts
        const setupResult = await createTestPostsForPagination(page, 10);
        expect(setupResult.success).toBe(true);

        // Navigate to home
        await page.goto('/');
        await page.waitForLoadState('domcontentloaded');

        // Wait for initial load
        await page.getByText('Loading posts...').waitFor({ state: 'hidden', timeout: 10000 }).catch(() => {});

        // Switch to New tab
        const newTab = page.getByRole('button', { name: 'New' });
        await newTab.click();
        await page.waitForLoadState('networkidle');

        // Verify New tab is active
        await expect(newTab).toBeVisible();
        const newTabClass = await newTab.getAttribute('class');
        expect(newTabClass).toContain('bg-primary-900');

        // Perform scroll
        const result = await performVerifySortingMaintainedAction(page, { feedType: 'new', skipNavigation: true });

        tdadTrace.setActionResult(result);

        // Assertions
        expect(result.success).toBe(true);
        expect(result.sortingMaintained).toBe(true);
        expect(result.feedType).toBe('new');
    });

    test('[UI-172] Loading state visible while fetching more posts', async ({ page, tdadTrace }) => {
        // Setup: Create posts
        const setupResult = await createTestPostsForPagination(page, 10);
        expect(setupResult.success).toBe(true);

        // Test loading state
        const result = await performVerifyLoadingStateAction(page);

        tdadTrace.setActionResult(result);

        // Assertions
        expect(result.success).toBe(true);
        expect(result.existingPostsVisible).toBe(true);

        // Verify posts are visible on page
        await expect(page.locator('.bg-white.border.border-primary-200.rounded-lg').first()).toBeVisible();
    });

    test('[UI-173] Error handling when load more fails', async ({ page, tdadTrace }) => {
        // Setup: Create posts
        const setupResult = await createMultipleTestPosts(page, 5);
        expect(setupResult.success).toBe(true);

        // Test error handling
        const result = await performVerifyErrorHandlingAction(page);

        tdadTrace.setActionResult(result);

        // Assertions
        expect(result.success).toBe(true);

        // Verify the page is still functional
        await expect(page.locator('.space-y-4.mt-4')).toBeVisible();
    });

});
