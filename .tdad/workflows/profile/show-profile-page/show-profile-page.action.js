const { performShowProfileHeaderAction, navigateToProfilePage, checkUsernameDisplay, checkJoinDateDisplay, checkLoadingState, checkNotFoundMessage, setupTestUserForProfile } = require('../show-profile-header/show-profile-header.action.js');
const { performShowKarmaDisplayAction, setupUserWithKarma, getKarmaValue, hasKarmaBadgeVisible } = require('../show-karma-display/show-karma-display.action.js');
const { performShowUserPostsListAction, clickPostInList, verifyRetryButtonPresent, getPostsFromResult, isPostsListEmpty } = require('../show-user-posts-list/show-user-posts-list.action.js');
const { createTestUser, createTestPost } = require('../fetch-user-profile/fetch-user-profile.action.js');

/**
 * Show Profile Page Action
 *
 * Renders the complete profile page layout including profile header, karma display, and user posts list.
 * Handles navigation, loading states, empty states, and error states.
 *
 * @param {Object} page - Playwright page object
 * @param {Object} context - Test context and dependencies
 * @param {string} context.userId - User ID to view profile for
 * @param {string} context.expectedUsername - Expected username to verify (optional)
 * @param {boolean} context.checkLoading - If true, verify loading state is shown
 * @param {boolean} context.checkNotFound - If true, verify not found message is shown
 * @param {boolean} context.checkError - If true, verify error message and retry button
 * @param {boolean} context.expectEmpty - If true, expect user to have no posts
 * @returns {Promise<Object>} - Returns { success, errorMessage, ...data }
 */
async function performShowProfilePageAction(page, context = {}) {
    try {
        const { userId, expectedUsername, checkLoading, checkNotFound, checkError, expectEmpty } = context;

        if (!userId) {
            return { success: false, errorMessage: 'userId is required to view profile page' };
        }

        // Navigate to the profile page
        await page.goto(`/profile/${userId}`);

        // Check for loading state if requested
        if (checkLoading) {
            const loadingResult = await checkLoadingState(page);
            return {
                success: true,
                loadingChecked: true,
                loadingVisible: loadingResult.loadingVisible
            };
        }

        await page.waitForLoadState('domcontentloaded');

        // Check for not found state if requested
        if (checkNotFound) {
            const notFoundResult = await checkNotFoundMessage(page);
            return {
                success: notFoundResult.notFoundVisible,
                notFoundVisible: notFoundResult.notFoundVisible,
                notFoundChecked: true,
                errorMessage: notFoundResult.notFoundVisible ? null : 'Not found message not displayed'
            };
        }

        // Error Detection Pattern (Promise.race)
        const profileUsernameLocator = page.getByTestId('profile-username');
        const errorLocator = page.locator('[role="alert"]').filter({ hasText: /.+/ });
        const notFoundLocator = page.getByText(/not found|does not exist|no user/i);

        const outcome = await Promise.race([
            profileUsernameLocator.waitFor({ state: 'visible', timeout: 10000 }).then(() => ({ type: 'success' })),
            errorLocator.first().waitFor({ state: 'visible', timeout: 10000 }).then(() => ({ type: 'error' })),
            notFoundLocator.first().waitFor({ state: 'visible', timeout: 10000 }).then(() => ({ type: 'notfound' }))
        ]).catch(() => ({ type: 'timeout' }));

        if (outcome.type === 'error') {
            const errorText = await errorLocator.first().textContent().catch(() => 'Unknown error');

            // Check for retry button if error checking requested
            if (checkError) {
                const retryButton = page.getByRole('button', { name: /retry|try again/i });
                const hasRetryButton = await retryButton.isVisible().catch(() => false);
                return {
                    success: true,
                    hasError: true,
                    errorMessage: errorText,
                    hasRetryButton: hasRetryButton,
                    errorChecked: true
                };
            }

            return { success: false, errorMessage: errorText, hasError: true };
        }

        if (outcome.type === 'notfound') {
            return {
                success: checkNotFound ? true : false,
                notFoundVisible: true,
                errorMessage: checkNotFound ? null : 'Profile not found'
            };
        }

        if (outcome.type === 'timeout') {
            return { success: false, errorMessage: 'Timeout waiting for profile page to load' };
        }

        // Profile loaded - verify all sections

        // Check profile header section
        const headerSectionLocator = page.locator('[data-testid="profile-username"]').locator('..');
        const hasProfileHeader = await headerSectionLocator.isVisible().catch(() => false);

        // Check username display
        let usernameVisible = false;
        let displayedUsername = null;
        if (expectedUsername) {
            const usernameResult = await checkUsernameDisplay(page, { expectedUsername });
            usernameVisible = usernameResult.usernameVisible;
            displayedUsername = usernameResult.displayedUsername;
        } else {
            usernameVisible = await profileUsernameLocator.isVisible().catch(() => false);
            displayedUsername = await profileUsernameLocator.textContent().catch(() => null);
        }

        // Check join date display
        const joinDateResult = await checkJoinDateDisplay(page, {});
        const joinDateVisible = joinDateResult.joinDateVisible;

        // Check karma display
        const karmaLocator = page.locator('text=/\\-?\\d+\\s*karma/i');
        let hasKarmaBadge = false;
        let karmaDisplayed = null;
        let karmaText = null;

        try {
            await karmaLocator.first().waitFor({ state: 'visible', timeout: 5000 });
            hasKarmaBadge = true;
            karmaText = await karmaLocator.first().textContent();
            const karmaMatch = karmaText.match(/(-?\d+)\s*karma/i);
            if (karmaMatch) {
                karmaDisplayed = parseInt(karmaMatch[1], 10);
            }
        } catch (e) {
            hasKarmaBadge = false;
        }

        // Check for karma breakdown (Post Karma and Comment Karma)
        let hasPostKarma = false;
        let hasCommentKarma = false;
        let postKarmaText = null;
        let commentKarmaText = null;

        const postKarmaLocator = page.locator('text=/Post Karma:\\s*-?\\d+/i');
        try {
            const postKarmaVisible = await postKarmaLocator.first().isVisible({ timeout: 1000 });
            if (postKarmaVisible) {
                hasPostKarma = true;
                postKarmaText = await postKarmaLocator.first().textContent();
            }
        } catch (e) {
            hasPostKarma = false;
        }

        const commentKarmaLocator = page.locator('text=/Comment Karma:\\s*-?\\d+/i');
        try {
            const commentKarmaVisible = await commentKarmaLocator.first().isVisible({ timeout: 1000 });
            if (commentKarmaVisible) {
                hasCommentKarma = true;
                commentKarmaText = await commentKarmaLocator.first().textContent();
            }
        } catch (e) {
            hasCommentKarma = false;
        }

        // Check posts list or empty state
        const postsListLocator = page.locator('[data-testid="user-posts-list"]');
        const emptyStateLocator = page.getByText(/no posts|hasn't posted|hasn't created any posts/i);
        const postCardLocator = page.locator('[data-testid="user-post-card"]');

        let hasPosts = false;
        let hasEmptyState = false;
        let postCount = 0;

        // Check for posts or empty state
        const postsOutcome = await Promise.race([
            postsListLocator.waitFor({ state: 'visible', timeout: 5000 }).then(() => ({ type: 'posts' })),
            emptyStateLocator.first().waitFor({ state: 'visible', timeout: 5000 }).then(() => ({ type: 'empty' }))
        ]).catch(() => ({ type: 'timeout' }));

        if (postsOutcome.type === 'posts') {
            hasPosts = true;
            const postCards = await postCardLocator.all();
            postCount = postCards.length;
        } else if (postsOutcome.type === 'empty') {
            hasEmptyState = true;
        }

        return {
            success: true,
            hasProfileHeader: hasProfileHeader,
            usernameVisible: usernameVisible,
            displayedUsername: displayedUsername,
            joinDateVisible: joinDateVisible,
            hasKarmaBadge: hasKarmaBadge,
            karmaDisplayed: karmaDisplayed,
            karmaText: karmaText,
            hasPostKarma: hasPostKarma,
            hasCommentKarma: hasCommentKarma,
            postKarmaText: postKarmaText,
            commentKarmaText: commentKarmaText,
            hasPosts: hasPosts,
            hasEmptyState: hasEmptyState,
            postCount: postCount
        };

    } catch (error) {
        return { success: false, errorMessage: error.message };
    }
}

/**
 * Setup a test user with specified karma and optional posts
 * @param {Object} page - Playwright page object
 * @param {Object} context - Setup context
 * @param {number} context.karma - Target karma value (default: 0)
 * @param {number} context.postCount - Number of posts to create (default: 0)
 * @param {string} context.prefix - Username prefix (default: 'profilepage')
 * @returns {Promise<Object>} - Returns { success, userId, username, password, postIds, errorMessage }
 */
async function setupProfilePageTestUser(page, context = {}) {
    try {
        const { karma = 0, postCount = 0, prefix = 'profilepage' } = context;

        // Create a test user
        const userResult = await createTestUser(page, prefix);
        if (!userResult.success) {
            return { success: false, errorMessage: `Failed to create user: ${userResult.errorMessage}` };
        }

        const { userId, username } = userResult;
        const password = 'TestPassword123!';
        const postIds = [];

        // Create posts if requested
        if (postCount > 0) {
            for (let i = 0; i < postCount; i++) {
                const postResult = await createTestPost(page, { userId });
                if (postResult.success && postResult.postId) {
                    postIds.push(postResult.postId);
                }
            }
        }

        return {
            success: true,
            userId: userId,
            username: username,
            password: password,
            postIds: postIds,
            postCount: postIds.length,
            errorMessage: null
        };
    } catch (error) {
        return { success: false, errorMessage: error.message };
    }
}

/**
 * Setup a test user with no posts
 * @param {Object} page - Playwright page object
 * @param {string} prefix - Username prefix (default: 'noposts')
 * @returns {Promise<Object>} - Returns { success, userId, username, errorMessage }
 */
async function setupUserWithNoPosts(page, prefix = 'noposts') {
    try {
        const userResult = await createTestUser(page, prefix);
        if (!userResult.success) {
            return { success: false, errorMessage: `Failed to create user: ${userResult.errorMessage}` };
        }

        return {
            success: true,
            userId: userResult.userId,
            username: userResult.username,
            errorMessage: null
        };
    } catch (error) {
        return { success: false, errorMessage: error.message };
    }
}

/**
 * Navigate to profile page and click on a post to go to post detail
 * @param {Object} page - Playwright page object
 * @param {string} userId - User ID
 * @param {number} postIndex - Index of post to click (default: 0)
 * @returns {Promise<Object>} - Returns { success, postId, navigated, currentUrl, errorMessage }
 */
async function navigateToPostFromProfile(page, userId, postIndex = 0) {
    return await clickPostInList(page, userId, postIndex);
}

/**
 * Check if profile page has all required sections
 * @param {Object} result - Result from performShowProfilePageAction
 * @returns {boolean} - True if all sections are present
 */
function hasAllProfileSections(result) {
    return result?.hasProfileHeader === true &&
           result?.usernameVisible === true &&
           result?.hasKarmaBadge === true;
}

/**
 * Check if profile page shows empty state
 * @param {Object} result - Result from performShowProfilePageAction
 * @returns {boolean} - True if empty state is shown
 */
function hasEmptyPostsState(result) {
    return result?.hasEmptyState === true;
}

/**
 * Get karma displayed value from result
 * @param {Object} result - Result from performShowProfilePageAction
 * @returns {number|null} - Karma value or null
 */
function getKarmaDisplayed(result) {
    return result?.karmaDisplayed ?? null;
}

/**
 * Check if karma breakdown is displayed
 * @param {Object} result - Result from performShowProfilePageAction
 * @returns {boolean} - True if both post and comment karma are shown
 */
function hasKarmaBreakdown(result) {
    return result?.hasPostKarma === true && result?.hasCommentKarma === true;
}

/**
 * Get post count from result
 * @param {Object} result - Result from performShowProfilePageAction
 * @returns {number} - Number of posts displayed
 */
function getPostCount(result) {
    return result?.postCount ?? 0;
}

/**
 * Generate a non-existent user ID for testing not found scenarios
 * @returns {string} - A CUID-like string that doesn't exist
 */
function generateNonExistentUserId() {
    return `clnonexistent${Date.now()}xyz`;
}

module.exports = {
    performShowProfilePageAction,
    setupProfilePageTestUser,
    setupUserWithNoPosts,
    navigateToPostFromProfile,
    hasAllProfileSections,
    hasEmptyPostsState,
    getKarmaDisplayed,
    hasKarmaBreakdown,
    getPostCount,
    generateNonExistentUserId
};
