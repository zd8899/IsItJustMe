/**
 * Submit Login Form Action
 *
 * Handles login form submission via API and UI.
 * Supports both API testing (direct HTTP requests) and UI testing (browser interactions).
 *
 * @param {Object} page - Playwright page object
 * @param {Object} context - Test context and dependencies
 * @param {string} context.mode - 'api' for API testing, 'ui' for UI testing
 * @param {string} context.username - Username to login with
 * @param {string} context.password - Password to login with
 * @param {boolean} context.emptyBody - If true, send empty body (API mode)
 * @param {boolean} context.usernameOnly - If true, send only username (API mode)
 * @param {boolean} context.passwordOnly - If true, send only password (API mode)
 * @returns {Promise<Object>} - Returns { success, errorMessage, statusCode, body, token, userId, username }
 */
async function performSubmitLoginFormAction(page, context = {}) {
    try {
        const { mode, username, password, emptyBody, usernameOnly, passwordOnly } = context;

        // ==========================================
        // API MODE - Direct HTTP request
        // ==========================================
        if (mode === 'api') {
            let requestData = {};

            if (emptyBody) {
                requestData = {};
            } else if (usernameOnly) {
                requestData = { username };
            } else if (passwordOnly) {
                requestData = { password };
            } else {
                requestData = { username, password };
            }

            const response = await page.request.post('/api/auth/login', {
                data: requestData
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
                token: body?.token || null,
                userId: body?.userId || null,
                username: body?.username || null,
                errorMessage: !response.ok() ? (body?.error || body?.message || 'Login failed') : null
            };
        }

        // ==========================================
        // UI MODE - Browser interaction
        // ==========================================

        // Navigate to login page
        await page.goto('/auth/login');
        await page.waitForLoadState('domcontentloaded');

        // Get form elements
        const usernameField = page.getByLabel(/username/i);
        const passwordField = page.getByLabel(/password/i);
        const loginButton = page.getByRole('button', { name: /log\s*in/i });

        // Wait for form to be ready
        await usernameField.waitFor({ state: 'visible', timeout: 5000 });

        // Fill form fields if provided
        if (username !== undefined && username !== null && username !== '') {
            await usernameField.fill(username);
        }

        if (password !== undefined && password !== null && password !== '') {
            await passwordField.fill(password);
        }

        // Click submit button
        await loginButton.click();

        // Error detection with Promise.race
        // Use .bg-red-50 for error alerts to avoid matching Next.js route announcer [role="alert"]
        const errorLocator = page.locator('.bg-red-50');
        const outcome = await Promise.race([
            page.waitForURL('/', { timeout: 10000 }).then(() => ({ type: 'success' })),
            errorLocator.waitFor({ state: 'visible', timeout: 10000 }).then(() => ({ type: 'error' }))
        ]).catch(() => ({ type: 'timeout' }));

        if (outcome.type === 'error') {
            const msg = await errorLocator.textContent();
            return { success: false, errorMessage: msg?.trim() || 'Unknown error' };
        }

        if (outcome.type === 'timeout') {
            // Check if we're still on the login page (might be a validation error not caught)
            const currentUrl = page.url();
            if (currentUrl.includes('/auth/login')) {
                // Check for error message one more time
                const errorVisible = await errorLocator.isVisible().catch(() => false);
                if (errorVisible) {
                    const msg = await errorLocator.textContent();
                    return { success: false, errorMessage: msg?.trim() || 'Unknown error' };
                }
                return { success: false, errorMessage: 'Timeout waiting for redirect or error' };
            }
        }

        // Wait for page to fully load
        await page.waitForLoadState('domcontentloaded');

        // Extract token from localStorage if available
        const token = await page.evaluate(() => localStorage.getItem('token')).catch(() => null);

        return {
            success: true,
            username: username,
            token: token
        };

    } catch (error) {
        return { success: false, errorMessage: error.message };
    }
}

/**
 * Helper to check if loading state is visible during form submission
 *
 * @param {Object} page - Playwright page object
 * @param {Object} context - Context with username and password
 * @returns {Promise<Object>} - Returns { success, buttonDisabled, loadingVisible }
 */
async function checkLoadingStateDuringSubmission(page, context = {}) {
    try {
        const { username, password } = context;

        // Navigate to login page
        await page.goto('/auth/login');
        await page.waitForLoadState('domcontentloaded');

        // Get form elements
        const usernameField = page.getByLabel(/username/i);
        const passwordField = page.getByLabel(/password/i);
        const loginButton = page.getByRole('button', { name: /log\s*in/i });

        await usernameField.waitFor({ state: 'visible', timeout: 5000 });

        // Fill form
        await usernameField.fill(username);
        await passwordField.fill(password);

        // Set up variables to capture loading state
        let buttonDisabled = false;
        let loadingVisible = false;

        // Intercept the login API to add a delay, giving us time to observe loading state
        // NextAuth uses /api/auth/callback/credentials for credentials login
        await page.route('**/api/auth/callback/credentials', async (route) => {
            // Add delay to observe loading state
            await new Promise(resolve => setTimeout(resolve, 300));
            await route.continue();
        });

        // Click the button - don't await it, let it start the request
        loginButton.click();

        // Wait a bit for React to update, then check for loading indicators
        await new Promise(resolve => setTimeout(resolve, 50));

        // Check for aria-busy attribute
        const loadingIndicator = page.locator('[aria-busy="true"]');
        loadingVisible = await loadingIndicator.first().isVisible().catch(() => false);

        // Also check if button is disabled
        buttonDisabled = await loginButton.isDisabled().catch(() => false);

        // Wait for submission to complete (redirect or error)
        const errorLocator = page.locator('.bg-red-50');
        await Promise.race([
            page.waitForURL('**/', { timeout: 10000 }),
            errorLocator.waitFor({ state: 'visible', timeout: 10000 })
        ]).catch(() => null);

        // Unroute to clean up
        await page.unroute('**/api/auth/login');

        return {
            success: true,
            buttonDisabled: buttonDisabled,
            loadingVisible: loadingVisible
        };

    } catch (error) {
        return { success: false, errorMessage: error.message };
    }
}

/**
 * Helper to submit form and check for validation error message
 *
 * @param {Object} page - Playwright page object
 * @param {Object} context - Context with username, password, and expectedError
 * @returns {Promise<Object>} - Returns { success, errorMessage, errorDisplayed }
 */
async function submitFormAndCheckValidationError(page, context = {}) {
    try {
        const { username, password } = context;

        // Navigate to login page
        await page.goto('/auth/login');
        await page.waitForLoadState('domcontentloaded');

        // Get form elements
        const usernameField = page.getByLabel(/username/i);
        const passwordField = page.getByLabel(/password/i);
        const loginButton = page.getByRole('button', { name: /log\s*in/i });

        await usernameField.waitFor({ state: 'visible', timeout: 5000 });

        // Fill form fields if provided (leave empty if not provided for validation testing)
        if (username !== undefined && username !== null && username !== '') {
            await usernameField.fill(username);
        }

        if (password !== undefined && password !== null && password !== '') {
            await passwordField.fill(password);
        }

        // Click submit button
        await loginButton.click();

        // Wait for error message to appear (validation or API error)
        const errorLocator = page.locator('.bg-red-50');
        await errorLocator.first().waitFor({ state: 'visible', timeout: 5000 }).catch(() => null);

        const errorVisible = await errorLocator.first().isVisible().catch(() => false);
        let errorMessage = null;

        if (errorVisible) {
            errorMessage = await errorLocator.first().textContent();
            errorMessage = errorMessage?.trim() || null;
        }

        return {
            success: true,
            errorDisplayed: errorVisible,
            errorMessage: errorMessage
        };

    } catch (error) {
        return { success: false, errorMessage: error.message };
    }
}

/**
 * Generate unique username with timestamp
 * @param {string} prefix - Prefix for the username
 * @returns {string} - Unique username (max 20 chars)
 */
function generateUniqueUsername(prefix = 'user') {
    const shortTimestamp = Date.now().toString().slice(-6);
    return `${prefix}_${shortTimestamp}`;
}

/**
 * Helper to create a test user via API for login testing
 * @param {Object} page - Playwright page object
 * @param {string} username - Username to create
 * @param {string} password - Password to use
 * @returns {Promise<Object>} - Result of user creation
 */
async function createTestUser(page, username, password) {
    const response = await page.request.post('/api/auth/register', {
        data: { username, password }
    });

    let body = null;
    try {
        body = await response.json();
    } catch (e) {
        body = await response.text();
    }

    return {
        success: response.ok(),
        statusCode: response.status(),
        userId: body?.userId || body?.id || null,
        username: body?.username || username,
        errorMessage: !response.ok() ? (body?.error || body?.message || 'User creation failed') : null
    };
}

/**
 * Helper to get token from login result
 * @param {Object} loginResult - Result from performSubmitLoginFormAction
 * @returns {string|null} - JWT token or null
 */
function getTokenFromLogin(loginResult) {
    return loginResult?.token || loginResult?.body?.token || null;
}

/**
 * Helper to get userId from login result
 * @param {Object} loginResult - Result from performSubmitLoginFormAction
 * @returns {string|null} - User ID or null
 */
function getUserIdFromLogin(loginResult) {
    return loginResult?.userId || loginResult?.body?.userId || null;
}

module.exports = {
    performSubmitLoginFormAction,
    checkLoadingStateDuringSubmission,
    submitFormAndCheckValidationError,
    generateUniqueUsername,
    createTestUser,
    getTokenFromLogin,
    getUserIdFromLogin
};
