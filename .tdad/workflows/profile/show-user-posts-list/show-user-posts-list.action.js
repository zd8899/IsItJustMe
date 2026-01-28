const { performFetchUserPostsAction, createUserWithPost, createUserWithMultiplePosts, createTestUser } = require('../fetch-user-posts/fetch-user-posts.action.js');

/**
 * Show User Posts List Action
 *
 * Navigates to a user's profile page and verifies the posts list is displayed correctly.
 * Handles loading states, empty states, and error states.
 *
 * @param {Object} page - Playwright page object
 * @param {Object} context - Test context and dependencies
 * @param {string} context.userId - The user ID to view profile for
 * @param {boolean} context.expectEmpty - If true, expect the user to have no posts
 * @param {boolean} context.checkLoading - If true, verify loading state is shown
 * @returns {Promise<Object>} - Returns { success, errorMessage, posts, ... }
 */
async function performShowUserPostsListAction(page, context = {}) {
    try {
        const { userId, expectEmpty, checkLoading } = context;

        if (!userId) {
            return { success: false, errorMessage: 'userId is required' };
        }

        // Navigate to user profile page
        await page.goto(`/profile/${userId}`);
        await page.waitForLoadState('domcontentloaded');

        // Check for loading state if requested
        if (checkLoading) {
            // Try to catch loading indicator - it may be brief
            const loadingLocator = page.getByText(/loading/i);
            const loadingVisible = await loadingLocator.first().isVisible().catch(() => false);
            return {
                success: true,
                loadingVisible: loadingVisible,
                loadingChecked: true
            };
        }

        // Wait for either posts list, empty state, or error state
        const postsListLocator = page.locator('[data-testid="user-posts-list"]');
        const emptyStateLocator = page.getByText(/no posts|hasn't posted|hasn't created any posts/i);
        // Use specific error selector to avoid matching Next.js route announcer [role="alert"]
        const errorLocator = page.locator('[role="alert"] .text-red-600, [role="alert"] .text-red-500');
        const postCardLocator = page.locator('[data-testid="user-post-card"]');

        // Use Promise.race to wait for one of the states
        const outcome = await Promise.race([
            postsListLocator.waitFor({ state: 'visible', timeout: 10000 }).then(() => ({ type: 'posts' })),
            emptyStateLocator.first().waitFor({ state: 'visible', timeout: 10000 }).then(() => ({ type: 'empty' })),
            errorLocator.first().waitFor({ state: 'visible', timeout: 10000 }).then(() => ({ type: 'error' }))
        ]).catch(() => ({ type: 'timeout' }));

        if (outcome.type === 'timeout') {
            // Check if profile loaded but no posts section
            const profileHeader = page.locator('[data-testid="profile-username"]');
            const profileVisible = await profileHeader.isVisible().catch(() => false);

            if (profileVisible) {
                return {
                    success: false,
                    errorMessage: 'Profile loaded but posts list section not found',
                    profileLoaded: true
                };
            }
            return { success: false, errorMessage: 'Timeout waiting for profile page content' };
        }

        if (outcome.type === 'error') {
            const errorText = await errorLocator.first().textContent().catch(() => 'Unknown error');
            return {
                success: false,
                errorMessage: errorText,
                hasError: true
            };
        }

        if (outcome.type === 'empty') {
            return {
                success: true,
                isEmpty: true,
                posts: [],
                postCount: 0
            };
        }

        // Posts list is visible - extract post data
        const postCards = await postCardLocator.all();
        const posts = [];

        for (const card of postCards) {
            const postData = await extractPostDataFromCard(card);
            if (postData) {
                posts.push(postData);
            }
        }

        return {
            success: true,
            isEmpty: false,
            posts: posts,
            postCount: posts.length,
            firstPost: posts.length > 0 ? posts[0] : null,
            secondPost: posts.length > 1 ? posts[1] : null
        };

    } catch (error) {
        return { success: false, errorMessage: error.message };
    }
}

/**
 * Helper to extract post data from a post card element
 * @param {Object} cardLocator - Playwright locator for the post card
 * @returns {Promise<Object|null>} - Post data or null
 */
async function extractPostDataFromCard(cardLocator) {
    try {
        const frustrationEl = cardLocator.locator('[data-testid="post-frustration"]');
        const identityEl = cardLocator.locator('[data-testid="post-identity"]');
        const categoryEl = cardLocator.locator('[data-testid="post-category"]');
        const scoreEl = cardLocator.locator('[data-testid="post-score"]');
        const dateEl = cardLocator.locator('[data-testid="post-date"]');
        const commentsEl = cardLocator.locator('[data-testid="post-comments"]');

        const frustration = await frustrationEl.textContent().catch(() => null);
        const identity = await identityEl.textContent().catch(() => null);
        const category = await categoryEl.textContent().catch(() => null);
        const scoreText = await scoreEl.textContent().catch(() => '0');
        const date = await dateEl.textContent().catch(() => null);
        const commentsText = await commentsEl.textContent().catch(() => '0');

        // Extract post ID from link if available
        const linkEl = cardLocator.locator('a[href*="/post/"]');
        const href = await linkEl.getAttribute('href').catch(() => null);
        const postId = href ? href.split('/post/')[1] : null;

        return {
            postId: postId,
            frustration: frustration,
            identity: identity,
            category: category,
            score: parseInt(scoreText) || 0,
            date: date,
            commentCount: parseInt(commentsText) || 0
        };
    } catch (error) {
        return null;
    }
}

/**
 * Navigate to profile and verify posts are in chronological order (newest first)
 * @param {Object} page - Playwright page object
 * @param {string} userId - User ID
 * @returns {Promise<Object>} - Returns { success, postsInOrder, posts }
 */
async function verifyPostsChronologicalOrder(page, userId) {
    try {
        const result = await performShowUserPostsListAction(page, { userId });

        if (!result.success) {
            return result;
        }

        if (result.isEmpty || result.posts.length < 2) {
            return {
                success: true,
                postsInOrder: true,
                posts: result.posts,
                message: 'Not enough posts to verify order'
            };
        }

        // Check if posts are in descending order by date
        const posts = result.posts;
        let inOrder = true;

        for (let i = 0; i < posts.length - 1; i++) {
            const currentDate = posts[i].date ? new Date(posts[i].date) : null;
            const nextDate = posts[i + 1].date ? new Date(posts[i + 1].date) : null;

            if (currentDate && nextDate && currentDate < nextDate) {
                inOrder = false;
                break;
            }
        }

        return {
            success: true,
            postsInOrder: inOrder,
            posts: posts
        };
    } catch (error) {
        return { success: false, errorMessage: error.message };
    }
}

/**
 * Click on a post in the user posts list and navigate to post detail
 * @param {Object} page - Playwright page object
 * @param {string} userId - User ID
 * @param {number} postIndex - Index of the post to click (0-based)
 * @returns {Promise<Object>} - Returns { success, postId, navigated }
 */
async function clickPostInList(page, userId, postIndex = 0) {
    try {
        // First navigate to profile
        const result = await performShowUserPostsListAction(page, { userId });

        if (!result.success) {
            return result;
        }

        if (result.isEmpty) {
            return { success: false, errorMessage: 'No posts to click' };
        }

        if (postIndex >= result.posts.length) {
            return { success: false, errorMessage: `Post index ${postIndex} out of range` };
        }

        // Click on the post
        const postCards = page.locator('[data-testid="user-post-card"]');
        const targetCard = postCards.nth(postIndex);
        const linkInCard = targetCard.locator('a[href*="/post/"]');

        // Get post ID before clicking
        const href = await linkInCard.getAttribute('href').catch(() => null);
        const postId = href ? href.split('/post/')[1] : null;

        await linkInCard.click();

        // Wait for navigation to post detail page
        // Use specific error selector to avoid matching Next.js route announcer [role="alert"]
        const errorAlert = page.locator('[role="alert"] .text-red-600, [role="alert"] .text-red-500');
        const navigationOutcome = await Promise.race([
            page.waitForURL('**/post/**', { timeout: 5000 }).then(() => ({ type: 'success' })),
            errorAlert.first().waitFor({ state: 'visible', timeout: 5000 }).then(() => ({ type: 'error' }))
        ]).catch(() => ({ type: 'timeout' }));

        if (navigationOutcome.type !== 'success') {
            return {
                success: false,
                errorMessage: 'Failed to navigate to post detail page',
                postId: postId
            };
        }

        await page.waitForLoadState('domcontentloaded');

        return {
            success: true,
            postId: postId,
            navigated: true,
            currentUrl: page.url()
        };
    } catch (error) {
        return { success: false, errorMessage: error.message };
    }
}

/**
 * Verify retry button is present after error and can be clicked
 * @param {Object} page - Playwright page object
 * @param {string} userId - User ID
 * @returns {Promise<Object>} - Returns { success, hasRetryButton }
 */
async function verifyRetryButtonPresent(page, userId) {
    try {
        await page.goto(`/profile/${userId}`);
        await page.waitForLoadState('domcontentloaded');

        // Wait for error state
        // Use specific error selector to avoid matching Next.js route announcer [role="alert"]
        const errorLocator = page.locator('[role="alert"] .text-red-600, [role="alert"] .text-red-500');
        await errorLocator.first().waitFor({ state: 'visible', timeout: 10000 }).catch(() => null);

        // Look for retry button
        const retryButton = page.getByRole('button', { name: /retry|try again/i });
        const hasRetryButton = await retryButton.isVisible().catch(() => false);

        return {
            success: true,
            hasRetryButton: hasRetryButton
        };
    } catch (error) {
        return { success: false, errorMessage: error.message };
    }
}

/**
 * Get posts array from action result
 * @param {Object} result - Result from performShowUserPostsListAction
 * @returns {Array} - Array of posts
 */
function getPostsFromResult(result) {
    return result?.posts || [];
}

/**
 * Get post count from action result
 * @param {Object} result - Result from performShowUserPostsListAction
 * @returns {number} - Number of posts
 */
function getPostCountFromResult(result) {
    return result?.postCount ?? result?.posts?.length ?? 0;
}

/**
 * Check if posts list is empty
 * @param {Object} result - Result from performShowUserPostsListAction
 * @returns {boolean} - True if empty
 */
function isPostsListEmpty(result) {
    return result?.isEmpty === true || (result?.posts && result.posts.length === 0);
}

/**
 * Get first post from result
 * @param {Object} result - Result from performShowUserPostsListAction
 * @returns {Object|null} - First post or null
 */
function getFirstPostFromResult(result) {
    return result?.firstPost || result?.posts?.[0] || null;
}

module.exports = {
    performShowUserPostsListAction,
    extractPostDataFromCard,
    verifyPostsChronologicalOrder,
    clickPostInList,
    verifyRetryButtonPresent,
    getPostsFromResult,
    getPostCountFromResult,
    isPostsListEmpty,
    getFirstPostFromResult
};
