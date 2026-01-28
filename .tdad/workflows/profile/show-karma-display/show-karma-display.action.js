const { performFetchUserKarmaAction, createTestUser, loginUser, createTestPost, castMultiplePostVotes } = require('../fetch-user-karma/fetch-user-karma.action.js');

/**
 * Show Karma Display Action
 *
 * Navigates to a user's profile page and verifies the karma badge display.
 * This action handles UI interactions for viewing karma on the profile page.
 *
 * @param {Object} page - Playwright page object
 * @param {Object} context - Test context and dependencies
 * @param {string} context.userId - The user ID to view profile for
 * @returns {Promise<Object>} - Returns { success, errorMessage, karmaDisplayed, karmaText, hasKarmaBadge, hasPostKarma, hasCommentKarma, postKarmaText, commentKarmaText }
 */
async function performShowKarmaDisplayAction(page, context = {}) {
    try {
        const { userId } = context;

        if (!userId) {
            return { success: false, errorMessage: 'userId is required to view profile' };
        }

        // Navigate to the user's profile page
        await page.goto(`/profile/${userId}`);

        // Wait for the page to load
        await page.waitForLoadState('domcontentloaded');

        // Error Detection Pattern (Promise.race)
        // Use a more specific selector that excludes Next.js route announcer (empty alert with id __next-route-announcer__)
        // Only match alerts that contain actual text content
        const errorLocator = page.getByRole('alert').filter({ hasText: /.+/ });
        const loadingLocator = page.getByText('Loading...');
        const profileUsernameLocator = page.getByTestId('profile-username');

        // Wait for either profile to load or error to appear
        const outcome = await Promise.race([
            profileUsernameLocator.waitFor({ state: 'visible', timeout: 10000 }).then(() => ({ type: 'success' })),
            errorLocator.first().waitFor({ state: 'visible', timeout: 10000 }).then(() => ({ type: 'error' }))
        ]).catch(() => ({ type: 'timeout' }));

        if (outcome.type === 'error') {
            const errorText = await errorLocator.first().textContent().catch(() => 'Unknown error');
            return { success: false, errorMessage: errorText };
        }

        if (outcome.type === 'timeout') {
            // Check if still loading
            const isLoading = await loadingLocator.isVisible().catch(() => false);
            if (isLoading) {
                return { success: false, errorMessage: 'Profile page still loading after timeout' };
            }
            return { success: false, errorMessage: 'Timeout waiting for profile to load' };
        }

        // Look for karma display in the profile
        // The karma is displayed as "{number} karma" in the profile header
        const karmaLocator = page.locator('text=/\\-?\\d+\\s*karma/i');

        let hasKarmaBadge = false;
        let karmaDisplayed = null;
        let karmaText = null;

        try {
            await karmaLocator.first().waitFor({ state: 'visible', timeout: 5000 });
            hasKarmaBadge = true;
            karmaText = await karmaLocator.first().textContent();

            // Extract the numeric karma value from text like "25 karma"
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

        // Look for "Post Karma: X" pattern
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

        // Look for "Comment Karma: X" pattern
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

        // Verify karma badge is in the profile header section
        // The profile header is a Card component containing username and karma
        const profileHeaderSection = page.locator('[data-testid="profile-username"]').locator('..');
        let karmaInHeader = false;
        try {
            // Check if karma text is within the same parent container as the username
            const headerText = await profileHeaderSection.locator('..').textContent();
            karmaInHeader = headerText && headerText.includes('karma');
        } catch (e) {
            karmaInHeader = false;
        }

        return {
            success: hasKarmaBadge,
            errorMessage: hasKarmaBadge ? null : 'Karma badge not found on profile page',
            karmaDisplayed: karmaDisplayed,
            karmaText: karmaText,
            hasKarmaBadge: hasKarmaBadge,
            hasPostKarma: hasPostKarma,
            hasCommentKarma: hasCommentKarma,
            postKarmaText: postKarmaText,
            commentKarmaText: commentKarmaText,
            karmaInHeader: karmaInHeader
        };

    } catch (error) {
        return { success: false, errorMessage: error.message };
    }
}

/**
 * Helper to refresh the profile page and get updated karma
 * @param {Object} page - Playwright page object
 * @returns {Promise<Object>} - Returns { success, karmaDisplayed, errorMessage }
 */
async function refreshAndGetKarma(page) {
    try {
        await page.reload();
        await page.waitForLoadState('domcontentloaded');

        // Wait for profile to load
        const profileUsernameLocator = page.getByTestId('profile-username');
        await profileUsernameLocator.waitFor({ state: 'visible', timeout: 10000 });

        // Get karma value
        const karmaLocator = page.locator('text=/\\-?\\d+\\s*karma/i');
        await karmaLocator.first().waitFor({ state: 'visible', timeout: 5000 });
        const karmaText = await karmaLocator.first().textContent();

        const karmaMatch = karmaText.match(/(-?\d+)\s*karma/i);
        const karmaDisplayed = karmaMatch ? parseInt(karmaMatch[1], 10) : null;

        return {
            success: true,
            karmaDisplayed: karmaDisplayed,
            karmaText: karmaText,
            errorMessage: null
        };
    } catch (error) {
        return { success: false, karmaDisplayed: null, errorMessage: error.message };
    }
}

/**
 * Helper to setup a user with specific karma via posts and votes
 * @param {Object} page - Playwright page object
 * @param {number} targetKarma - The target karma value to achieve
 * @returns {Promise<Object>} - Returns { success, userId, username, password, errorMessage }
 */
async function setupUserWithKarma(page, targetKarma = 0) {
    try {
        // Create a new user
        const userResult = await createTestUser(page, 'karma');
        if (!userResult.success) {
            return { success: false, errorMessage: `Failed to create user: ${userResult.errorMessage}` };
        }

        const { userId, username, password } = userResult;

        // If target karma is 0, we're done
        if (targetKarma === 0) {
            return { success: true, userId, username, password, errorMessage: null };
        }

        // Create a post for the user to receive karma
        const postResult = await createTestPost(page, { userId });
        if (!postResult.success) {
            return { success: false, errorMessage: `Failed to create post: ${postResult.errorMessage}`, userId, username, password };
        }

        // Cast votes to achieve target karma
        if (targetKarma > 0) {
            const voteResult = await castMultiplePostVotes(page, postResult.postId, targetKarma, 0);
            if (!voteResult.success) {
                return { success: false, errorMessage: 'Failed to cast upvotes', userId, username, password };
            }
        } else if (targetKarma < 0) {
            const voteResult = await castMultiplePostVotes(page, postResult.postId, 0, Math.abs(targetKarma));
            if (!voteResult.success) {
                return { success: false, errorMessage: 'Failed to cast downvotes', userId, username, password };
            }
        }

        return { success: true, userId, username, password, errorMessage: null };
    } catch (error) {
        return { success: false, errorMessage: error.message };
    }
}

/**
 * Helper to get karma value from the displayed text
 * @param {Object} result - Result from performShowKarmaDisplayAction
 * @returns {number|null} - The karma value or null
 */
function getKarmaValue(result) {
    return result?.karmaDisplayed ?? null;
}

/**
 * Helper to check if karma badge is visible
 * @param {Object} result - Result from performShowKarmaDisplayAction
 * @returns {boolean} - True if karma badge is visible
 */
function hasKarmaBadgeVisible(result) {
    return result?.hasKarmaBadge === true;
}

/**
 * Helper to check if karma breakdown is displayed
 * @param {Object} result - Result from performShowKarmaDisplayAction
 * @returns {boolean} - True if both post and comment karma are shown
 */
function hasKarmaBreakdown(result) {
    return result?.hasPostKarma === true && result?.hasCommentKarma === true;
}

module.exports = {
    performShowKarmaDisplayAction,
    refreshAndGetKarma,
    setupUserWithKarma,
    getKarmaValue,
    hasKarmaBadgeVisible,
    hasKarmaBreakdown
};
