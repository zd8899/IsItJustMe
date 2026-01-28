/**
 * Load More Posts Action
 *
 * Provides functionality for pagination of posts in the feed.
 * Supports cursor-based pagination for hot, new, and category-filtered posts.
 * Handles both API requests and UI infinite scroll interactions.
 *
 * @param {Object} page - Playwright page object
 * @param {Object} context - Test context and options
 * @returns {Promise<Object>} - Returns { success, errorMessage, ...data }
 */

const { performShowPostListAction, getVisiblePostCount, createTestPostsForPostList, getActiveFeedTab } = require('../show-post-list/show-post-list.action.js');
const { createTestPost, getOrCreateTestCategory, getCategoryBySlug, getLastPostId, createMultipleTestPosts } = require('../fetch-hot-posts/fetch-hot-posts.action.js');

/**
 * Main action: Load more posts (handles both API and UI modes)
 * @param {Object} page - Playwright page object
 * @param {Object} context - Test context with mode, cursor, feedType options
 * @returns {Promise<Object>} - Returns { success, errorMessage, ...data }
 */
async function performLoadMorePostsAction(page, context = {}) {
    try {
        const { mode, feedType = 'hot', cursor, limit = 20, categorySlug } = context;

        // ==========================================
        // API MODE
        // ==========================================
        if (mode === 'api') {
            if (feedType === 'new') {
                return await performFetchNextNewPostsAction(page, { cursor, limit, categorySlug });
            } else if (feedType === 'category' && categorySlug) {
                return await performFetchNextCategoryPostsAction(page, { cursor, limit, categorySlug });
            } else {
                return await performFetchNextHotPostsAction(page, { cursor, limit, categorySlug });
            }
        }

        // ==========================================
        // UI MODE - Infinite scroll
        // ==========================================
        return await performLoadMorePostsUIAction(page, context);
    } catch (error) {
        return { success: false, errorMessage: error.message };
    }
}

/**
 * Fetch next page of hot posts via API
 * @param {Object} page - Playwright page object
 * @param {Object} context - Context with cursor and limit options
 * @returns {Promise<Object>} - Returns { success, statusCode, posts, nextCursor, errorMessage }
 */
async function performFetchNextHotPostsAction(page, context = {}) {
    try {
        const { cursor, limit = 20, categorySlug } = context;

        // Build input parameters
        const inputParams = { limit };

        if (cursor !== undefined) {
            inputParams.cursor = cursor;
        }

        if (categorySlug !== undefined) {
            inputParams.categorySlug = categorySlug;
        }

        // Build URL with encoded input parameter
        const encodedInput = encodeURIComponent(JSON.stringify({ json: inputParams }));
        const url = `/api/trpc/post.listHot?input=${encodedInput}`;

        const response = await page.request.get(url);
        const status = response.status();
        let body = null;

        try {
            body = await response.json();
        } catch (e) {
            body = await response.text();
        }

        // Extract error message from tRPC error response
        let errorMessage = null;
        if (!response.ok()) {
            const zodError = body?.error?.json?.data?.zodError;
            if (zodError && zodError.fieldErrors) {
                const fieldErrors = Object.values(zodError.fieldErrors);
                if (fieldErrors.length > 0 && Array.isArray(fieldErrors[0]) && fieldErrors[0].length > 0) {
                    errorMessage = fieldErrors[0][0];
                }
            }
            if (!errorMessage) {
                errorMessage = body?.error?.json?.message || body?.error?.message || 'Fetch hot posts failed';
            }
        }

        // Extract posts data from successful response
        // API returns { posts, nextCursor } object
        const responseData = body?.result?.data?.json || body?.result?.data || {};
        const postsArray = Array.isArray(responseData) ? responseData : (Array.isArray(responseData.posts) ? responseData.posts : []);
        const nextCursor = responseData.nextCursor !== undefined ? responseData.nextCursor : (postsArray.length >= limit ? getLastPostId(postsArray) : null);

        return {
            success: response.ok(),
            statusCode: status,
            body: body,
            posts: postsArray,
            postCount: postsArray.length,
            nextCursor: nextCursor,
            errorMessage: errorMessage
        };
    } catch (error) {
        return { success: false, errorMessage: error.message };
    }
}

/**
 * Fetch next page of new posts via API
 * @param {Object} page - Playwright page object
 * @param {Object} context - Context with cursor and limit options
 * @returns {Promise<Object>} - Returns { success, statusCode, posts, nextCursor, errorMessage }
 */
async function performFetchNextNewPostsAction(page, context = {}) {
    try {
        const { cursor, limit = 20, categorySlug } = context;

        // Build input parameters
        const inputParams = { limit };

        if (cursor !== undefined) {
            inputParams.cursor = cursor;
        }

        if (categorySlug !== undefined) {
            inputParams.categorySlug = categorySlug;
        }

        // Build URL with encoded input parameter
        const encodedInput = encodeURIComponent(JSON.stringify({ json: inputParams }));
        const url = `/api/trpc/post.listNew?input=${encodedInput}`;

        const response = await page.request.get(url);
        const status = response.status();
        let body = null;

        try {
            body = await response.json();
        } catch (e) {
            body = await response.text();
        }

        // Extract error message from tRPC error response
        let errorMessage = null;
        if (!response.ok()) {
            const zodError = body?.error?.json?.data?.zodError;
            if (zodError && zodError.fieldErrors) {
                const fieldErrors = Object.values(zodError.fieldErrors);
                if (fieldErrors.length > 0 && Array.isArray(fieldErrors[0]) && fieldErrors[0].length > 0) {
                    errorMessage = fieldErrors[0][0];
                }
            }
            if (!errorMessage) {
                errorMessage = body?.error?.json?.message || body?.error?.message || 'Fetch new posts failed';
            }
        }

        // Extract posts data from successful response
        // API returns { posts, nextCursor } object
        const responseData = body?.result?.data?.json || body?.result?.data || {};
        const postsArray = Array.isArray(responseData) ? responseData : (Array.isArray(responseData.posts) ? responseData.posts : []);
        const nextCursor = responseData.nextCursor !== undefined ? responseData.nextCursor : (postsArray.length >= limit ? getLastPostId(postsArray) : null);

        return {
            success: response.ok(),
            statusCode: status,
            body: body,
            posts: postsArray,
            postCount: postsArray.length,
            nextCursor: nextCursor,
            errorMessage: errorMessage
        };
    } catch (error) {
        return { success: false, errorMessage: error.message };
    }
}

/**
 * Fetch next page of posts filtered by category via API
 * @param {Object} page - Playwright page object
 * @param {Object} context - Context with categorySlug, cursor and limit options
 * @returns {Promise<Object>} - Returns { success, statusCode, posts, nextCursor, errorMessage }
 */
async function performFetchNextCategoryPostsAction(page, context = {}) {
    try {
        const { categorySlug, cursor, limit = 20 } = context;

        if (!categorySlug) {
            return { success: false, errorMessage: 'categorySlug is required' };
        }

        // Build input parameters
        const inputParams = { categorySlug, limit };

        if (cursor !== undefined) {
            inputParams.cursor = cursor;
        }

        // Build URL with encoded input parameter
        const encodedInput = encodeURIComponent(JSON.stringify({ json: inputParams }));
        const url = `/api/trpc/post.listByCategory?input=${encodedInput}`;

        const response = await page.request.get(url);
        const status = response.status();
        let body = null;

        try {
            body = await response.json();
        } catch (e) {
            body = await response.text();
        }

        // Extract error message from tRPC error response
        let errorMessage = null;
        if (!response.ok()) {
            const zodError = body?.error?.json?.data?.zodError;
            if (zodError && zodError.fieldErrors) {
                const fieldErrors = Object.values(zodError.fieldErrors);
                if (fieldErrors.length > 0 && Array.isArray(fieldErrors[0]) && fieldErrors[0].length > 0) {
                    errorMessage = fieldErrors[0][0];
                }
            }
            if (!errorMessage) {
                errorMessage = body?.error?.json?.message || body?.error?.message || 'Fetch category posts failed';
            }
        }

        // Extract posts data from successful response
        // API returns { posts, nextCursor } object
        const responseData = body?.result?.data?.json || body?.result?.data || {};
        const postsArray = Array.isArray(responseData) ? responseData : (Array.isArray(responseData.posts) ? responseData.posts : []);
        const nextCursor = responseData.nextCursor !== undefined ? responseData.nextCursor : (postsArray.length >= limit ? getLastPostId(postsArray) : null);

        return {
            success: response.ok(),
            statusCode: status,
            body: body,
            posts: postsArray,
            postCount: postsArray.length,
            nextCursor: nextCursor,
            errorMessage: errorMessage
        };
    } catch (error) {
        return { success: false, errorMessage: error.message };
    }
}

/**
 * UI Action: Scroll to bottom and load more posts
 * @param {Object} page - Playwright page object
 * @param {Object} context - Test context
 * @returns {Promise<Object>} - Returns { success, initialPostCount, finalPostCount, additionalPostsLoaded, errorMessage }
 */
async function performLoadMorePostsUIAction(page, context = {}) {
    try {
        const { skipNavigation = false } = context;

        if (!skipNavigation) {
            await page.goto('/');
            await page.waitForLoadState('domcontentloaded');
        }

        // Wait for initial load to complete
        const loadingText = page.getByText('Loading posts...');
        await loadingText.waitFor({ state: 'hidden', timeout: 10000 }).catch(() => {});

        // Get initial post count
        const postCards = page.locator('.bg-white.border.border-primary-200.rounded-lg');
        const initialPostCount = await postCards.count();

        if (initialPostCount === 0) {
            return {
                success: true,
                initialPostCount: 0,
                finalPostCount: 0,
                additionalPostsLoaded: false,
                reason: 'No initial posts to scroll'
            };
        }

        // Scroll to the bottom of the page to trigger infinite scroll
        await page.evaluate(() => {
            window.scrollTo(0, document.body.scrollHeight);
        });

        // Wait for potential loading indicator at bottom
        const loadMoreIndicator = page.locator('.loading-indicator, [data-testid="load-more-spinner"]');
        let loadingIndicatorVisible = false;
        try {
            await loadMoreIndicator.waitFor({ state: 'visible', timeout: 2000 });
            loadingIndicatorVisible = true;
            // Wait for it to disappear (loading complete)
            await loadMoreIndicator.waitFor({ state: 'hidden', timeout: 10000 });
        } catch (e) {
            // Loading indicator may not be present or may be too fast
        }

        // Wait for network to settle
        await page.waitForLoadState('networkidle');

        // Get updated post count
        const finalPostCount = await postCards.count();
        const additionalPostsLoaded = finalPostCount > initialPostCount;

        return {
            success: true,
            initialPostCount: initialPostCount,
            finalPostCount: finalPostCount,
            additionalPostsLoaded: additionalPostsLoaded,
            loadingIndicatorVisible: loadingIndicatorVisible
        };
    } catch (error) {
        return { success: false, errorMessage: error.message };
    }
}

/**
 * UI Action: Verify loading indicator appears while fetching more posts
 * @param {Object} page - Playwright page object
 * @param {Object} context - Test context
 * @returns {Promise<Object>} - Returns { success, loadingIndicatorVisible, existingPostsVisible, errorMessage }
 */
async function performVerifyLoadingStateAction(page, context = {}) {
    try {
        const { skipNavigation = false } = context;

        if (!skipNavigation) {
            await page.goto('/');
            await page.waitForLoadState('domcontentloaded');
        }

        // Wait for initial load to complete
        const loadingText = page.getByText('Loading posts...');
        await loadingText.waitFor({ state: 'hidden', timeout: 10000 }).catch(() => {});

        // Get initial post cards
        const postCards = page.locator('.bg-white.border.border-primary-200.rounded-lg');
        const initialPostCount = await postCards.count();

        if (initialPostCount === 0) {
            return {
                success: true,
                loadingIndicatorVisible: false,
                existingPostsVisible: false,
                reason: 'No posts to test loading state'
            };
        }

        // Scroll to bottom
        await page.evaluate(() => {
            window.scrollTo(0, document.body.scrollHeight);
        });

        // Check if loading indicator appears
        const loadMoreIndicator = page.locator('.loading-indicator, [data-testid="load-more-spinner"], .animate-spin');
        let loadingIndicatorVisible = false;
        try {
            await loadMoreIndicator.first().waitFor({ state: 'visible', timeout: 3000 });
            loadingIndicatorVisible = true;
        } catch (e) {
            // Loading indicator may be too fast to catch
        }

        // Check that existing posts remain visible during loading
        const existingPostsVisible = await postCards.first().isVisible();

        return {
            success: true,
            loadingIndicatorVisible: loadingIndicatorVisible,
            existingPostsVisible: existingPostsVisible
        };
    } catch (error) {
        return { success: false, errorMessage: error.message };
    }
}

/**
 * UI Action: Verify no more posts indicator when all posts loaded
 * @param {Object} page - Playwright page object
 * @param {Object} context - Test context
 * @returns {Promise<Object>} - Returns { success, noMorePostsVisible, finalPostCount, errorMessage }
 */
async function performVerifyNoMorePostsAction(page, context = {}) {
    try {
        const { skipNavigation = false, maxScrollAttempts = 5 } = context;

        if (!skipNavigation) {
            await page.goto('/');
            await page.waitForLoadState('domcontentloaded');
        }

        // Wait for initial load
        const loadingText = page.getByText('Loading posts...');
        await loadingText.waitFor({ state: 'hidden', timeout: 10000 }).catch(() => {});

        const postCards = page.locator('.bg-white.border.border-primary-200.rounded-lg');
        let previousCount = 0;
        let currentCount = await postCards.count();
        let scrollAttempts = 0;

        // Keep scrolling until no more posts are loaded
        while (scrollAttempts < maxScrollAttempts && currentCount > previousCount) {
            previousCount = currentCount;

            await page.evaluate(() => {
                window.scrollTo(0, document.body.scrollHeight);
            });

            await page.waitForLoadState('networkidle');
            currentCount = await postCards.count();
            scrollAttempts++;
        }

        // After all posts loaded, scroll again and verify no more load
        await page.evaluate(() => {
            window.scrollTo(0, document.body.scrollHeight);
        });

        await page.waitForLoadState('networkidle');

        const finalCount = await postCards.count();
        const noMorePostsLoaded = finalCount === currentCount;

        // Check for "no more posts" indicator
        const noMoreIndicator = page.locator('[data-testid="no-more-posts"], .end-of-feed');
        let noMoreIndicatorVisible = false;
        try {
            noMoreIndicatorVisible = await noMoreIndicator.isVisible();
        } catch (e) {
            // Indicator may not exist
        }

        // Check that loading indicator doesn't appear
        const loadMoreIndicator = page.locator('.loading-indicator, [data-testid="load-more-spinner"]');
        let loadingIndicatorVisible = false;
        try {
            loadingIndicatorVisible = await loadMoreIndicator.isVisible();
        } catch (e) {
            // Good - no loading indicator
        }

        return {
            success: true,
            noMorePostsLoaded: noMorePostsLoaded,
            noMoreIndicatorVisible: noMoreIndicatorVisible,
            loadingIndicatorNotVisible: !loadingIndicatorVisible,
            finalPostCount: finalCount
        };
    } catch (error) {
        return { success: false, errorMessage: error.message };
    }
}

/**
 * UI Action: Verify category badge consistency when loading more posts
 * @param {Object} page - Playwright page object
 * @param {Object} context - Test context with categoryLabel and categorySlug
 * @returns {Promise<Object>} - Returns { success, allPostsMatchCategory, errorMessage }
 */
async function performVerifyCategoryConsistencyAction(page, context = {}) {
    try {
        const { categoryLabel = 'Work', categorySlug = 'work', skipNavigation = false } = context;

        if (!skipNavigation) {
            await page.goto('/');
            await page.waitForLoadState('domcontentloaded');
        }

        // Wait for initial load
        const loadingText = page.getByText('Loading posts...');
        await loadingText.waitFor({ state: 'hidden', timeout: 10000 }).catch(() => {});

        // Select category filter
        const categoryFilter = page.getByRole('combobox');
        await categoryFilter.first().waitFor({ state: 'visible', timeout: 5000 });
        await categoryFilter.first().selectOption({ value: categorySlug });

        // Wait for feed to update
        await page.waitForLoadState('networkidle');
        await loadingText.waitFor({ state: 'hidden', timeout: 10000 }).catch(() => {});

        // Get initial count
        const postCards = page.locator('.bg-white.border.border-primary-200.rounded-lg');
        const initialCount = await postCards.count();

        if (initialCount === 0) {
            return {
                success: true,
                allPostsMatchCategory: true,
                reason: 'No posts in category'
            };
        }

        // Scroll to load more
        await page.evaluate(() => {
            window.scrollTo(0, document.body.scrollHeight);
        });

        await page.waitForLoadState('networkidle');

        // Check all category badges
        const categoryBadges = page.locator('.bg-primary-100.rounded');
        const badgeCount = await categoryBadges.count();

        let allMatch = true;
        const foundCategories = [];

        for (let i = 0; i < badgeCount; i++) {
            const badgeText = await categoryBadges.nth(i).textContent();
            const trimmedText = badgeText.trim();
            foundCategories.push(trimmedText);
            if (trimmedText !== categoryLabel) {
                allMatch = false;
            }
        }

        return {
            success: true,
            allPostsMatchCategory: allMatch,
            expectedCategory: categoryLabel,
            foundCategories: [...new Set(foundCategories)],
            postCount: badgeCount
        };
    } catch (error) {
        return { success: false, errorMessage: error.message };
    }
}

/**
 * UI Action: Verify sorting maintained when loading more posts
 * @param {Object} page - Playwright page object
 * @param {Object} context - Test context with feedType (hot/new)
 * @returns {Promise<Object>} - Returns { success, sortingMaintained, feedType, errorMessage }
 */
async function performVerifySortingMaintainedAction(page, context = {}) {
    try {
        const { feedType = 'hot', skipNavigation = false } = context;

        if (!skipNavigation) {
            await page.goto('/');
            await page.waitForLoadState('domcontentloaded');
        }

        // Wait for initial load
        const loadingText = page.getByText('Loading posts...');
        await loadingText.waitFor({ state: 'hidden', timeout: 10000 }).catch(() => {});

        // Switch to appropriate tab if needed
        if (feedType === 'new') {
            const newTab = page.getByRole('button', { name: 'New' });
            await newTab.click();
            await page.waitForLoadState('networkidle');
        }

        // Verify correct tab is active
        const activeTab = await getActiveFeedTab(page);
        const expectedTab = feedType === 'new' ? 'New' : 'Hot';

        if (activeTab !== expectedTab) {
            return { success: false, errorMessage: `Expected ${expectedTab} tab to be active, got ${activeTab}` };
        }

        // Scroll to load more
        await page.evaluate(() => {
            window.scrollTo(0, document.body.scrollHeight);
        });

        await page.waitForLoadState('networkidle');

        // Verify tab remains active after loading
        const tabAfterLoad = await getActiveFeedTab(page);
        const sortingMaintained = tabAfterLoad === expectedTab;

        return {
            success: true,
            sortingMaintained: sortingMaintained,
            feedType: feedType,
            activeTabBefore: activeTab,
            activeTabAfter: tabAfterLoad
        };
    } catch (error) {
        return { success: false, errorMessage: error.message };
    }
}

/**
 * UI Action: Simulate network error during load more
 * @param {Object} page - Playwright page object
 * @param {Object} context - Test context
 * @returns {Promise<Object>} - Returns { success, errorMessageVisible, retryButtonVisible, errorMessage }
 */
async function performVerifyErrorHandlingAction(page, context = {}) {
    try {
        const { skipNavigation = false } = context;

        if (!skipNavigation) {
            await page.goto('/');
            await page.waitForLoadState('domcontentloaded');
        }

        // Wait for initial load
        const loadingText = page.getByText('Loading posts...');
        await loadingText.waitFor({ state: 'hidden', timeout: 10000 }).catch(() => {});

        // Get initial post count
        const postCards = page.locator('.bg-white.border.border-primary-200.rounded-lg');
        const initialCount = await postCards.count();

        if (initialCount === 0) {
            return {
                success: true,
                errorMessageVisible: false,
                retryButtonVisible: false,
                reason: 'No posts to test error handling'
            };
        }

        // Intercept API requests to simulate failure
        await page.route('**/api/posts*', route => route.abort('failed'));

        // Scroll to trigger load more
        await page.evaluate(() => {
            window.scrollTo(0, document.body.scrollHeight);
        });

        // Check for error message
        const errorMessage = page.locator('.text-red-500, [role="alert"]');
        let errorMessageVisible = false;
        try {
            await errorMessage.first().waitFor({ state: 'visible', timeout: 5000 });
            errorMessageVisible = true;
        } catch (e) {
            // Error message may not appear
        }

        // Check for retry button
        const retryButton = page.getByRole('button', { name: /retry/i });
        let retryButtonVisible = false;
        try {
            retryButtonVisible = await retryButton.isVisible();
        } catch (e) {
            // Retry button may not exist
        }

        // Clean up route interception
        await page.unroute('**/api/posts*');

        return {
            success: true,
            errorMessageVisible: errorMessageVisible,
            retryButtonVisible: retryButtonVisible
        };
    } catch (error) {
        return { success: false, errorMessage: error.message };
    }
}

/**
 * Helper: Create test posts for pagination testing
 * @param {Object} page - Playwright page object
 * @param {number} count - Number of posts to create (should be > page size)
 * @param {Object} options - Options for post creation
 * @returns {Promise<Object>} - Returns { success, posts, createdCount, errorMessage }
 */
async function createTestPostsForPagination(page, count = 25, options = {}) {
    try {
        const posts = [];
        const { categorySlug } = options;

        let categoryId = options.categoryId;
        if (!categoryId && categorySlug) {
            const catResult = await getCategoryBySlug(page, categorySlug);
            if (catResult.success) {
                categoryId = catResult.categoryId;
            }
        }

        if (!categoryId) {
            const catResult = await getOrCreateTestCategory(page);
            if (!catResult.success) {
                return { success: false, posts: [], errorMessage: catResult.errorMessage };
            }
            categoryId = catResult.categoryId;
        }

        for (let i = 0; i < count; i++) {
            const result = await createTestPost(page, {
                categoryId: categoryId,
                frustration: options.frustration || `Pagination test frustration ${Date.now()}_${i}`,
                identity: options.identity || `a pagination tester ${i}`
            });

            if (result.success) {
                posts.push(result);
            } else {
                return { success: false, posts: posts, createdCount: posts.length, errorMessage: result.errorMessage };
            }
        }

        return { success: true, posts: posts, createdCount: posts.length };
    } catch (error) {
        return { success: false, posts: [], createdCount: 0, errorMessage: error.message };
    }
}

/**
 * Helper: Check if posts are sorted by hot score descending
 * @param {Array} posts - Array of posts
 * @returns {boolean} - True if sorted correctly
 */
function arePostsSortedByHotScore(posts) {
    if (!Array.isArray(posts) || posts.length < 2) {
        return true;
    }

    for (let i = 0; i < posts.length - 1; i++) {
        const currentScore = posts[i].hotScore ?? posts[i].score ?? 0;
        const nextScore = posts[i + 1].hotScore ?? posts[i + 1].score ?? 0;

        if (currentScore < nextScore) {
            return false;
        }
    }

    return true;
}

/**
 * Helper: Check if posts are sorted by creation date descending
 * @param {Array} posts - Array of posts
 * @returns {boolean} - True if sorted correctly
 */
function arePostsSortedByCreatedAt(posts) {
    if (!Array.isArray(posts) || posts.length < 2) {
        return true;
    }

    for (let i = 0; i < posts.length - 1; i++) {
        const currentDate = new Date(posts[i].createdAt);
        const nextDate = new Date(posts[i + 1].createdAt);

        if (currentDate < nextDate) {
            return false;
        }
    }

    return true;
}

/**
 * Helper: Check if all posts belong to a specific category
 * @param {Array} posts - Array of posts
 * @param {string} categorySlug - Expected category slug
 * @returns {boolean} - True if all posts belong to the category
 */
function allPostsBelongToCategory(posts, categorySlug) {
    if (!Array.isArray(posts) || posts.length === 0) {
        return true;
    }

    return posts.every(post => post.category?.slug === categorySlug);
}

/**
 * Helper: Check if posts from two pages don't overlap
 * @param {Array} page1Posts - Posts from first page
 * @param {Array} page2Posts - Posts from second page
 * @returns {boolean} - True if there's no overlap
 */
function postsDoNotOverlap(page1Posts, page2Posts) {
    if (!Array.isArray(page1Posts) || !Array.isArray(page2Posts)) {
        return true;
    }

    const page1Ids = new Set(page1Posts.map(p => p.id));

    for (const post of page2Posts) {
        if (page1Ids.has(post.id)) {
            return false;
        }
    }

    return true;
}

/**
 * Helper: Extract cursor from posts array
 * @param {Array} posts - Array of posts
 * @returns {string|null} - Last post ID as cursor or null
 */
function getCursorFromPosts(posts) {
    return getLastPostId(posts);
}

module.exports = {
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
    // Re-export dependencies
    performShowPostListAction,
    getVisiblePostCount,
    createTestPostsForPostList,
    createTestPost,
    getOrCreateTestCategory,
    getCategoryBySlug,
    getLastPostId,
    createMultipleTestPosts
};
