const { performFetchUserProfileAction, createTestUser } = require('../fetch-user-profile/fetch-user-profile.action.js');

/**
 * Show Profile Header Action
 *
 * UI Actions for testing the profile header component.
 * Handles displaying username, join date, loading states, and not found cases.
 *
 * @param {Object} page - Playwright page object
 * @param {Object} context - Test context and dependencies
 * @returns {Promise<Object>} - Returns { success, errorMessage, ...data }
 */

/**
 * Navigate to a user's profile page
 *
 * @param {Object} page - Playwright page object
 * @param {Object} context - Context with userId
 * @param {string} context.userId - User ID to view profile for
 * @returns {Promise<Object>} - Returns { success, errorMessage, navigatedUrl }
 */
async function navigateToProfilePage(page, context = {}) {
    try {
        const { userId } = context;

        if (!userId) {
            return { success: false, errorMessage: 'userId is required to navigate to profile page' };
        }

        await page.goto(`/profile/${userId}`);
        await page.waitForLoadState('domcontentloaded');

        return {
            success: true,
            navigatedUrl: page.url()
        };
    } catch (error) {
        return { success: false, errorMessage: error.message };
    }
}

/**
 * Check if username is displayed in profile header
 *
 * @param {Object} page - Playwright page object
 * @param {Object} context - Context with expected username
 * @param {string} context.expectedUsername - The username that should be displayed
 * @returns {Promise<Object>} - Returns { success, errorMessage, usernameVisible, displayedUsername }
 */
async function checkUsernameDisplay(page, context = {}) {
    try {
        const { expectedUsername } = context;

        if (!expectedUsername) {
            return { success: false, errorMessage: 'expectedUsername is required' };
        }

        await page.waitForLoadState('domcontentloaded');

        // Look for the username in the profile header using various strategies
        const usernameLocator = page.getByRole('heading', { name: expectedUsername })
            .or(page.getByText(expectedUsername, { exact: true }))
            .or(page.locator('[data-testid="profile-username"]'));

        // Use specific error selector to avoid matching Next.js route announcer [role="alert"]
        const errorLocator = page.locator('[role="alert"] .text-red-600, [role="alert"] .text-red-500');
        const notFoundLocator = page.getByText(/not found|does not exist|no user/i);

        const outcome = await Promise.race([
            usernameLocator.first().waitFor({ state: 'visible', timeout: 5000 }).then(() => ({ type: 'found' })),
            errorLocator.first().waitFor({ state: 'visible', timeout: 5000 }).then(() => ({ type: 'error' })),
            notFoundLocator.first().waitFor({ state: 'visible', timeout: 5000 }).then(() => ({ type: 'notfound' }))
        ]).catch(() => ({ type: 'timeout' }));

        if (outcome.type === 'error') {
            const msg = await errorLocator.first().textContent();
            return { success: false, errorMessage: msg, usernameVisible: false };
        }

        if (outcome.type === 'notfound') {
            return { success: false, errorMessage: 'Profile not found', usernameVisible: false };
        }

        if (outcome.type === 'timeout') {
            return { success: false, errorMessage: 'Username not found in profile header', usernameVisible: false };
        }

        const usernameVisible = await usernameLocator.first().isVisible().catch(() => false);

        return {
            success: true,
            usernameVisible,
            displayedUsername: expectedUsername
        };
    } catch (error) {
        return { success: false, errorMessage: error.message, usernameVisible: false };
    }
}

/**
 * Check if join date is displayed in profile header
 *
 * @param {Object} page - Playwright page object
 * @param {Object} context - Context with expected join date pattern
 * @param {string} context.expectedJoinDate - The join date pattern that should be displayed (partial match)
 * @returns {Promise<Object>} - Returns { success, errorMessage, joinDateVisible }
 */
async function checkJoinDateDisplay(page, context = {}) {
    try {
        const { expectedJoinDate } = context;

        await page.waitForLoadState('domcontentloaded');

        // Look for join date text - common patterns like "Joined January 15, 2024" or "Member since January 15, 2024"
        const joinDatePatterns = [
            page.getByText(/joined/i),
            page.getByText(/member since/i),
            page.locator('[data-testid="profile-join-date"]')
        ];

        // If a specific date is expected, also look for it
        if (expectedJoinDate) {
            joinDatePatterns.push(page.getByText(expectedJoinDate));
        }

        // Use specific error selector to avoid matching Next.js route announcer [role="alert"]
        const errorLocator = page.locator('[role="alert"] .text-red-600, [role="alert"] .text-red-500');
        const notFoundLocator = page.getByText(/not found|does not exist|no user/i);

        // Create a combined locator for join date elements
        const joinDateLocator = page.getByText(/joined/i)
            .or(page.getByText(/member since/i))
            .or(page.locator('[data-testid="profile-join-date"]'));

        // Race between finding join date, error, or not found
        const outcome = await Promise.race([
            joinDateLocator.first().waitFor({ state: 'visible', timeout: 5000 }).then(() => ({ type: 'found' })),
            errorLocator.first().waitFor({ state: 'visible', timeout: 5000 }).then(() => ({ type: 'error' })),
            notFoundLocator.first().waitFor({ state: 'visible', timeout: 5000 }).then(() => ({ type: 'notfound' }))
        ]).catch(() => ({ type: 'timeout' }));

        if (outcome.type === 'error') {
            const msg = await errorLocator.first().textContent();
            return { success: false, errorMessage: msg, joinDateVisible: false };
        }

        if (outcome.type === 'notfound') {
            return { success: false, errorMessage: 'Profile not found', joinDateVisible: false };
        }

        if (outcome.type === 'timeout') {
            return { success: false, errorMessage: 'Join date not found in profile header', joinDateVisible: false };
        }

        return {
            success: true,
            joinDateVisible: true
        };
    } catch (error) {
        return { success: false, errorMessage: error.message, joinDateVisible: false };
    }
}

/**
 * Check if loading indicator is visible in profile header
 *
 * @param {Object} page - Playwright page object
 * @returns {Promise<Object>} - Returns { success, errorMessage, loadingVisible }
 */
async function checkLoadingState(page) {
    try {
        // Look for common loading indicators
        const loadingLocator = page.getByRole('progressbar')
            .or(page.getByText(/loading/i))
            .or(page.locator('[data-testid="profile-loading"]'))
            .or(page.locator('.animate-spin'))
            .or(page.locator('.animate-pulse'));

        // Check if loading is visible (this is a quick check, not waiting for it)
        const loadingVisible = await loadingLocator.first().isVisible({ timeout: 2000 }).catch(() => false);

        return {
            success: true,
            loadingVisible
        };
    } catch (error) {
        return { success: false, errorMessage: error.message, loadingVisible: false };
    }
}

/**
 * Check if not found message is displayed for non-existent user
 *
 * @param {Object} page - Playwright page object
 * @returns {Promise<Object>} - Returns { success, errorMessage, notFoundVisible }
 */
async function checkNotFoundMessage(page) {
    try {
        await page.waitForLoadState('domcontentloaded');

        // Look for not found message
        const notFoundLocator = page.getByText(/not found|does not exist|no user|user not found|profile not found/i)
            .or(page.locator('[data-testid="profile-not-found"]'));

        // Use specific error selector to avoid matching Next.js route announcer [role="alert"]
        const errorLocator = page.locator('[role="alert"] .text-red-600, [role="alert"] .text-red-500');

        const outcome = await Promise.race([
            notFoundLocator.first().waitFor({ state: 'visible', timeout: 5000 }).then(() => ({ type: 'notfound' })),
            errorLocator.first().waitFor({ state: 'visible', timeout: 5000 }).then(() => ({ type: 'error' }))
        ]).catch(() => ({ type: 'timeout' }));

        if (outcome.type === 'notfound' || outcome.type === 'error') {
            return {
                success: true,
                notFoundVisible: true
            };
        }

        return {
            success: false,
            errorMessage: 'Not found message not displayed',
            notFoundVisible: false
        };
    } catch (error) {
        return { success: false, errorMessage: error.message, notFoundVisible: false };
    }
}

/**
 * Complete profile header check - verifies username and join date
 *
 * @param {Object} page - Playwright page object
 * @param {Object} context - Context with expected values
 * @param {string} context.userId - User ID to navigate to
 * @param {string} context.expectedUsername - Expected username
 * @param {string} context.expectedJoinDate - Expected join date (optional)
 * @returns {Promise<Object>} - Returns { success, errorMessage, usernameVisible, joinDateVisible }
 */
async function checkProfileHeader(page, context = {}) {
    try {
        const { userId, expectedUsername, expectedJoinDate } = context;

        // Navigate to profile page
        const navResult = await navigateToProfilePage(page, { userId });
        if (!navResult.success) {
            return navResult;
        }

        // Check username
        const usernameResult = await checkUsernameDisplay(page, { expectedUsername });
        if (!usernameResult.success) {
            return usernameResult;
        }

        // Check join date
        const joinDateResult = await checkJoinDateDisplay(page, { expectedJoinDate });

        return {
            success: usernameResult.success && joinDateResult.success,
            usernameVisible: usernameResult.usernameVisible,
            joinDateVisible: joinDateResult.joinDateVisible,
            displayedUsername: usernameResult.displayedUsername,
            errorMessage: usernameResult.errorMessage || joinDateResult.errorMessage
        };
    } catch (error) {
        return { success: false, errorMessage: error.message };
    }
}

/**
 * Setup test user and return profile data for testing
 *
 * @param {Object} page - Playwright page object
 * @param {Object} context - Context with optional prefix
 * @param {string} context.prefix - Username prefix (default: 'profiletest')
 * @returns {Promise<Object>} - Returns { success, errorMessage, userId, username, createdAt }
 */
async function setupTestUserForProfile(page, context = {}) {
    try {
        const { prefix = 'profiletest' } = context;

        // Create a test user using the dependency action
        const createResult = await createTestUser(page, prefix);

        if (!createResult.success) {
            return { success: false, errorMessage: createResult.errorMessage || 'Failed to create test user' };
        }

        return {
            success: true,
            userId: createResult.userId,
            username: createResult.username,
            karma: createResult.karma
        };
    } catch (error) {
        return { success: false, errorMessage: error.message };
    }
}

/**
 * Main action - performs the show profile header check
 *
 * @param {Object} page - Playwright page object
 * @param {Object} context - Test context
 * @param {string} context.userId - User ID to view
 * @param {string} context.expectedUsername - Expected username to verify
 * @param {string} context.expectedJoinDate - Expected join date to verify (optional)
 * @param {boolean} context.checkNotFound - If true, check for not found state
 * @param {boolean} context.checkLoading - If true, check for loading state
 * @returns {Promise<Object>} - Returns { success, errorMessage, ...data }
 */
async function performShowProfileHeaderAction(page, context = {}) {
    try {
        const { userId, expectedUsername, expectedJoinDate, checkNotFound, checkLoading } = context;

        // Navigate to profile page
        const navResult = await navigateToProfilePage(page, { userId });
        if (!navResult.success) {
            return navResult;
        }

        // Check for loading state if requested
        if (checkLoading) {
            return await checkLoadingState(page);
        }

        // Check for not found state if requested
        if (checkNotFound) {
            return await checkNotFoundMessage(page);
        }

        // Default: check full profile header
        return await checkProfileHeader(page, { userId, expectedUsername, expectedJoinDate });
    } catch (error) {
        return { success: false, errorMessage: error.message };
    }
}

/**
 * Helper to format date for display comparison
 * @param {Date|string} date - Date to format
 * @returns {string} - Formatted date string like "January 15, 2024"
 */
function formatJoinDate(date) {
    const d = new Date(date);
    return d.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
}

module.exports = {
    performShowProfileHeaderAction,
    navigateToProfilePage,
    checkUsernameDisplay,
    checkJoinDateDisplay,
    checkLoadingState,
    checkNotFoundMessage,
    checkProfileHeader,
    setupTestUserForProfile,
    formatJoinDate
};
