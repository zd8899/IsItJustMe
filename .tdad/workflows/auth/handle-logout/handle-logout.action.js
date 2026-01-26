/**
 * Handle Logout Action
 *
 * Actions for testing the logout functionality.
 * Handles both API-based logout and UI-based logout flows.
 *
 * @param {Object} page - Playwright page object
 * @param {Object} context - Test context and dependencies
 * @returns {Promise<Object>} - Returns { success, errorMessage, ...data }
 */

const {
    simulateAuthenticatedState,
    checkAuthenticatedMenuElements,
    checkUnauthenticatedMenuElements,
    clickSignOutButton,
    navigateToPostDetailPage
} = require('../show-user-menu/show-user-menu.action.js');

const {
    createFullSessionForUser,
    generateUniqueUsername
} = require('../create-session/create-session.action.js');

/**
 * Perform API logout request
 *
 * @param {Object} page - Playwright page object
 * @param {Object} context - Context with optional auth token
 * @param {string} context.token - JWT token for authenticated request
 * @returns {Promise<Object>} - Returns { success, statusCode, body, sessionCleared }
 */
async function performLogoutApiRequest(page, context = {}) {
    try {
        const { token } = context;

        const headers = {};
        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }

        const response = await page.request.post('/api/auth/signout', {
            headers
        });

        const status = response.status();
        let body = null;

        try {
            body = await response.json();
        } catch (e) {
            body = await response.text();
        }

        return {
            success: response.ok(),
            statusCode: status,
            body: body,
            sessionCleared: body?.sessionCleared || body?.success || response.ok(),
            errorMessage: !response.ok() ? (body?.error || body?.message || 'Logout failed') : null
        };
    } catch (error) {
        return {
            success: false,
            errorMessage: error.message
        };
    }
}

/**
 * Perform UI logout flow
 * Clicks the Sign Out button and verifies the logout was successful
 *
 * @param {Object} page - Playwright page object
 * @param {Object} context - Context with optional starting page
 * @param {string} context.startPage - Page to start from ('/' or '/profile')
 * @returns {Promise<Object>} - Returns { success, errorMessage, redirectedUrl, hasSignInLink, hasSignUpLink }
 */
async function performLogoutUiFlow(page, context = {}) {
    try {
        const { startPage = '/' } = context;

        // Navigate to the starting page
        await page.goto(startPage);
        await page.waitForLoadState('domcontentloaded');

        // Click the Sign Out button
        const signOutResult = await clickSignOutButton(page);
        if (!signOutResult.success) {
            return {
                success: false,
                errorMessage: signOutResult.errorMessage || 'Failed to click Sign Out button'
            };
        }

        // Wait for navigation and check state
        await page.waitForLoadState('domcontentloaded');

        // Check that user is logged out (Sign In/Sign Up links visible)
        const menuState = await checkUnauthenticatedMenuElements(page);

        return {
            success: menuState.success,
            redirectedUrl: page.url(),
            hasSignInLink: menuState.hasSignInLink,
            hasSignUpLink: menuState.hasSignUpLink,
            errorMessage: menuState.errorMessage
        };
    } catch (error) {
        return {
            success: false,
            errorMessage: error.message
        };
    }
}

/**
 * Check if logout button is visible (for authenticated users only)
 *
 * @param {Object} page - Playwright page object
 * @returns {Promise<Object>} - Returns { success, hasSignOutButton }
 */
async function checkLogoutButtonVisibility(page) {
    try {
        await page.waitForLoadState('domcontentloaded');

        const signOutButton = page.getByRole('button', { name: /sign\s*out/i });
        const hasSignOutButton = await signOutButton.isVisible().catch(() => false);

        return {
            success: true,
            hasSignOutButton
        };
    } catch (error) {
        return {
            success: false,
            errorMessage: error.message
        };
    }
}

/**
 * Setup authenticated user for logout tests
 * Creates a real user and establishes a session
 *
 * @param {Object} page - Playwright page object
 * @param {string} prefix - Username prefix
 * @returns {Promise<Object>} - Returns { success, username, password, token, userId }
 */
async function setupAuthenticatedUser(page, prefix = 'logout') {
    try {
        const username = generateUniqueUsername(prefix);
        const password = 'TestPassword123!';

        // Create user and get session token
        const sessionResult = await createFullSessionForUser(page, username, password);

        if (!sessionResult.success) {
            return {
                success: false,
                errorMessage: sessionResult.errorMessage || 'Failed to create authenticated user'
            };
        }

        return {
            success: true,
            username: sessionResult.username || username,
            password,
            token: sessionResult.token,
            userId: sessionResult.userId
        };
    } catch (error) {
        return {
            success: false,
            errorMessage: error.message
        };
    }
}

/**
 * Simulate authenticated state and navigate to a page
 *
 * @param {Object} page - Playwright page object
 * @param {string} username - Username to display
 * @param {string} targetPage - Page to navigate to after setting auth state
 * @returns {Promise<Object>} - Returns { success, errorMessage }
 */
async function setupAuthenticatedStateOnPage(page, username, targetPage = '/') {
    try {
        // Set up the authenticated state
        const authResult = await simulateAuthenticatedState(page, { username });

        if (!authResult.success) {
            return {
                success: false,
                errorMessage: authResult.errorMessage || 'Failed to simulate authenticated state'
            };
        }

        // Navigate to target page if different from current
        if (targetPage !== '/') {
            await page.goto(targetPage);
            await page.waitForLoadState('domcontentloaded');
        }

        return {
            success: true,
            username
        };
    } catch (error) {
        return {
            success: false,
            errorMessage: error.message
        };
    }
}

/**
 * Main action - performs handle logout
 * Supports both API and UI modes
 *
 * @param {Object} page - Playwright page object
 * @param {Object} context - Test context
 * @param {string} context.mode - 'api' for API testing, 'ui' for UI testing
 * @param {string} context.token - JWT token for authenticated API requests
 * @param {string} context.startPage - Starting page for UI logout
 * @returns {Promise<Object>} - Returns { success, errorMessage, ...data }
 */
async function performHandleLogoutAction(page, context = {}) {
    try {
        const { mode } = context;

        if (mode === 'api') {
            return await performLogoutApiRequest(page, context);
        }

        // UI mode
        return await performLogoutUiFlow(page, context);
    } catch (error) {
        return {
            success: false,
            errorMessage: error.message
        };
    }
}

module.exports = {
    performHandleLogoutAction,
    performLogoutApiRequest,
    performLogoutUiFlow,
    checkLogoutButtonVisibility,
    setupAuthenticatedUser,
    setupAuthenticatedStateOnPage,
    simulateAuthenticatedState,
    checkAuthenticatedMenuElements,
    checkUnauthenticatedMenuElements,
    navigateToPostDetailPage,
    generateUniqueUsername
};
