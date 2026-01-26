/**
 * Show User Menu Action
 *
 * Actions for testing the user menu component in the header.
 * Handles both authenticated and unauthenticated states.
 *
 * @param {Object} page - Playwright page object
 * @param {Object} context - Test context and dependencies
 * @returns {Promise<Object>} - Returns { success, errorMessage, ...data }
 */

/**
 * Check for unauthenticated user menu elements (Sign In, Sign Up links)
 *
 * @param {Object} page - Playwright page object
 * @returns {Promise<Object>} - Returns { success, errorMessage, hasSignInLink, hasSignUpLink }
 */
async function checkUnauthenticatedMenuElements(page) {
    try {
        await page.goto('/');
        await page.waitForLoadState('domcontentloaded');

        const signInLink = page.getByRole('link', { name: /sign\s*in/i });
        const signUpLink = page.getByRole('link', { name: /sign\s*up/i });

        // Use Promise.race to detect if links are visible or if an error occurs
        const errorLocator = page.getByRole('alert');
        const outcome = await Promise.race([
            signInLink.waitFor({ state: 'visible', timeout: 5000 }).then(() => ({ type: 'found' })),
            errorLocator.first().waitFor({ state: 'visible', timeout: 5000 }).then(() => ({ type: 'error' }))
        ]).catch(() => ({ type: 'timeout' }));

        if (outcome.type === 'error') {
            const msg = await errorLocator.textContent();
            return { success: false, errorMessage: msg };
        }

        const hasSignInLink = await signInLink.isVisible().catch(() => false);
        const hasSignUpLink = await signUpLink.isVisible().catch(() => false);

        return {
            success: true,
            hasSignInLink,
            hasSignUpLink
        };
    } catch (error) {
        return { success: false, errorMessage: error.message };
    }
}

/**
 * Click the Sign In link in the header and verify navigation
 *
 * @param {Object} page - Playwright page object
 * @returns {Promise<Object>} - Returns { success, errorMessage, navigatedUrl }
 */
async function clickSignInLink(page) {
    try {
        await page.goto('/');
        await page.waitForLoadState('domcontentloaded');

        const signInLink = page.getByRole('link', { name: /sign\s*in/i });

        const errorLocator = page.getByRole('alert');
        const outcome = await Promise.race([
            signInLink.waitFor({ state: 'visible', timeout: 5000 }).then(() => ({ type: 'found' })),
            errorLocator.first().waitFor({ state: 'visible', timeout: 5000 }).then(() => ({ type: 'error' }))
        ]).catch(() => ({ type: 'timeout' }));

        if (outcome.type === 'error') {
            const msg = await errorLocator.textContent();
            return { success: false, errorMessage: msg };
        }
        if (outcome.type === 'timeout') {
            return { success: false, errorMessage: 'Sign In link not found in header' };
        }

        await signInLink.click();
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
 * Click the Sign Up link in the header and verify navigation
 *
 * @param {Object} page - Playwright page object
 * @returns {Promise<Object>} - Returns { success, errorMessage, navigatedUrl }
 */
async function clickSignUpLink(page) {
    try {
        await page.goto('/');
        await page.waitForLoadState('domcontentloaded');

        const signUpLink = page.getByRole('link', { name: /sign\s*up/i });

        const errorLocator = page.getByRole('alert');
        const outcome = await Promise.race([
            signUpLink.waitFor({ state: 'visible', timeout: 5000 }).then(() => ({ type: 'found' })),
            errorLocator.first().waitFor({ state: 'visible', timeout: 5000 }).then(() => ({ type: 'error' }))
        ]).catch(() => ({ type: 'timeout' }));

        if (outcome.type === 'error') {
            const msg = await errorLocator.textContent();
            return { success: false, errorMessage: msg };
        }
        if (outcome.type === 'timeout') {
            return { success: false, errorMessage: 'Sign Up link not found in header' };
        }

        await signUpLink.click();
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
 * Simulate authenticated state by setting session data
 * This function sets up the authenticated state before visiting a page
 *
 * @param {Object} page - Playwright page object
 * @param {Object} context - Context with username
 * @param {string} context.username - Username to display
 * @returns {Promise<Object>} - Returns { success, errorMessage }
 */
async function simulateAuthenticatedState(page, context = {}) {
    try {
        const { username = 'testuser' } = context;

        // First go to the page to set localStorage/cookies
        await page.goto('/');
        await page.waitForLoadState('networkidle');

        // Set authentication state in localStorage/sessionStorage
        // This assumes the app reads auth state from storage
        await page.evaluate((user) => {
            localStorage.setItem('user', JSON.stringify({ username: user, isAuthenticated: true }));
            localStorage.setItem('isAuthenticated', 'true');
            localStorage.setItem('username', user);
            // Dispatch custom event to trigger re-render (storage event doesn't fire for same-window changes)
            window.dispatchEvent(new Event('localStorageChange'));
        }, username);

        // Wait for the UI to update - look for the username element to appear
        const usernameElement = page.getByRole('button', { name: username }).or(
            page.getByRole('link', { name: username })
        );

        // Wait for the username element to become visible (indicates auth state applied)
        await usernameElement.first().waitFor({ state: 'visible', timeout: 10000 }).catch(() => {
            // If username element doesn't appear, continue anyway - will be caught in test
        });

        return {
            success: true,
            username
        };
    } catch (error) {
        return { success: false, errorMessage: error.message };
    }
}

/**
 * Check for authenticated user menu elements (username, Sign Out button)
 *
 * @param {Object} page - Playwright page object
 * @param {Object} context - Context with expected username
 * @param {string} context.username - Expected username to find
 * @returns {Promise<Object>} - Returns { success, errorMessage, hasUsername, hasSignOutButton, hasSignInLink, hasSignUpLink }
 */
async function checkAuthenticatedMenuElements(page, context = {}) {
    try {
        const { username = 'testuser' } = context;

        await page.waitForLoadState('networkidle');

        // Look for username in header (could be a link or button)
        const usernameElement = page.getByRole('button', { name: username }).or(
            page.getByRole('link', { name: username })
        );

        const signOutButton = page.getByRole('button', { name: /sign\s*out/i });
        const signInLink = page.getByRole('link', { name: /sign\s*in/i });
        const signUpLink = page.getByRole('link', { name: /sign\s*up/i });

        // Check which elements are visible
        const hasUsername = await usernameElement.first().isVisible().catch(() => false);
        const hasSignOutButton = await signOutButton.isVisible().catch(() => false);
        const hasSignInLink = await signInLink.isVisible().catch(() => false);
        const hasSignUpLink = await signUpLink.isVisible().catch(() => false);

        return {
            success: true,
            hasUsername,
            hasSignOutButton,
            hasSignInLink,
            hasSignUpLink
        };
    } catch (error) {
        return { success: false, errorMessage: error.message };
    }
}

/**
 * Click on username in header and verify navigation to profile page
 *
 * @param {Object} page - Playwright page object
 * @param {Object} context - Context with username
 * @param {string} context.username - Username to click
 * @returns {Promise<Object>} - Returns { success, errorMessage, navigatedUrl }
 */
async function clickUsernameLink(page, context = {}) {
    try {
        const { username = 'testuser' } = context;

        await page.waitForLoadState('networkidle');

        // Username could be a link or button that navigates to profile
        const usernameElement = page.getByRole('button', { name: username }).or(
            page.getByRole('link', { name: username })
        );

        const errorLocator = page.getByRole('alert');
        const outcome = await Promise.race([
            usernameElement.first().waitFor({ state: 'visible', timeout: 5000 }).then(() => ({ type: 'found' })),
            errorLocator.first().waitFor({ state: 'visible', timeout: 5000 }).then(() => ({ type: 'error' }))
        ]).catch(() => ({ type: 'timeout' }));

        if (outcome.type === 'error') {
            const msg = await errorLocator.textContent();
            return { success: false, errorMessage: msg };
        }
        if (outcome.type === 'timeout') {
            return { success: false, errorMessage: `Username "${username}" not found in header` };
        }

        await usernameElement.first().click();
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
 * Click Sign Out button and verify user is logged out
 *
 * @param {Object} page - Playwright page object
 * @returns {Promise<Object>} - Returns { success, errorMessage }
 */
async function clickSignOutButton(page) {
    try {
        await page.waitForLoadState('networkidle');

        const signOutButton = page.getByRole('button', { name: /sign\s*out/i });

        const errorLocator = page.getByRole('alert');
        const outcome = await Promise.race([
            signOutButton.waitFor({ state: 'visible', timeout: 5000 }).then(() => ({ type: 'found' })),
            errorLocator.first().waitFor({ state: 'visible', timeout: 5000 }).then(() => ({ type: 'error' }))
        ]).catch(() => ({ type: 'timeout' }));

        if (outcome.type === 'error') {
            const msg = await errorLocator.textContent();
            return { success: false, errorMessage: msg };
        }
        if (outcome.type === 'timeout') {
            return { success: false, errorMessage: 'Sign Out button not found in header' };
        }

        await signOutButton.click();
        await page.waitForLoadState('domcontentloaded');

        return { success: true };
    } catch (error) {
        return { success: false, errorMessage: error.message };
    }
}

/**
 * Navigate to a post detail page
 *
 * @param {Object} page - Playwright page object
 * @param {Object} context - Context with optional postId
 * @param {string} context.postId - Post ID to navigate to (defaults to 'test-post')
 * @returns {Promise<Object>} - Returns { success, errorMessage, navigatedUrl }
 */
async function navigateToPostDetailPage(page, context = {}) {
    try {
        const { postId = 'test-post' } = context;

        await page.goto(`/post/${postId}`);
        await page.waitForLoadState('networkidle');

        return {
            success: true,
            navigatedUrl: page.url()
        };
    } catch (error) {
        return { success: false, errorMessage: error.message };
    }
}

/**
 * Main action - performs the show user menu check
 * Kept for backwards compatibility
 *
 * @param {Object} page - Playwright page object
 * @param {Object} context - Test context
 * @returns {Promise<Object>} - Returns { success, errorMessage, ...data }
 */
async function performShowUserMenuAction(page, context = {}) {
    try {
        const { isAuthenticated = false, username = 'testuser' } = context;

        if (isAuthenticated) {
            return await checkAuthenticatedMenuElements(page, { username });
        } else {
            return await checkUnauthenticatedMenuElements(page);
        }
    } catch (error) {
        return { success: false, errorMessage: error.message };
    }
}

module.exports = {
    performShowUserMenuAction,
    checkUnauthenticatedMenuElements,
    checkAuthenticatedMenuElements,
    clickSignInLink,
    clickSignUpLink,
    clickUsernameLink,
    clickSignOutButton,
    simulateAuthenticatedState,
    navigateToPostDetailPage
};
