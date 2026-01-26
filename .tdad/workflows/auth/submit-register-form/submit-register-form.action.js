/**
 * Submit Register Form Action
 *
 * Handles registration form submission via API and UI.
 * Supports both API testing (direct HTTP requests) and UI testing (browser interactions).
 *
 * @param {Object} page - Playwright page object
 * @param {Object} context - Test context and dependencies
 * @param {string} context.mode - 'api' for API testing, 'ui' for UI testing
 * @param {string} context.username - Username to register with
 * @param {string} context.password - Password to register with
 * @returns {Promise<Object>} - Returns { success, errorMessage, statusCode, body, userId, username }
 */
async function performSubmitRegisterFormAction(page, context = {}) {
    try {
        const { mode, username, password } = context;

        // ==========================================
        // API MODE - Direct HTTP request
        // ==========================================
        if (mode === 'api') {
            const response = await page.request.post('/api/auth/register', {
                data: { username, password }
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
                userId: body?.userId || body?.id || null,
                username: body?.username || null,
                errorMessage: !response.ok() ? (body?.error || body?.message || 'Registration failed') : null
            };
        }

        // ==========================================
        // UI MODE - Browser interaction
        // ==========================================

        // Navigate to registration page
        await page.goto('/auth/register');
        await page.waitForLoadState('domcontentloaded');

        // Get form elements
        const usernameField = page.getByLabel(/username/i);
        const passwordField = page.getByLabel(/password/i);
        const createAccountButton = page.getByRole('button', { name: /create account/i });

        // Wait for form to be ready
        await usernameField.waitFor({ state: 'visible', timeout: 5000 });

        // Fill form fields if provided
        if (username !== undefined && username !== null) {
            await usernameField.fill(username);
        }

        if (password !== undefined && password !== null) {
            await passwordField.fill(password);
        }

        // Click submit button
        await createAccountButton.click();

        // Error detection with Promise.race
        // Use only .bg-red-50 to avoid matching Next.js route announcer [role="alert"]
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
            // Check if we're still on the register page (might be a validation error not caught)
            const currentUrl = page.url();
            if (currentUrl.includes('/auth/register')) {
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

        return {
            success: true,
            username: username
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

        // Navigate to registration page
        await page.goto('/auth/register');
        await page.waitForLoadState('domcontentloaded');

        // Get form elements
        const usernameField = page.getByLabel(/username/i);
        const passwordField = page.getByLabel(/password/i);
        const createAccountButton = page.getByRole('button', { name: /create account/i });

        await usernameField.waitFor({ state: 'visible', timeout: 5000 });

        // Fill form
        await usernameField.fill(username);
        await passwordField.fill(password);

        // Set up variables to capture loading state
        let buttonDisabled = false;
        let loadingVisible = false;

        // Intercept the register API to add a delay, giving us time to observe loading state
        await page.route('**/api/auth/register', async (route) => {
            // Add delay to observe loading state
            await new Promise(resolve => setTimeout(resolve, 300));
            await route.continue();
        });

        // Click the button - don't await it, let it start the request
        createAccountButton.click();

        // Wait a bit for React to update, then check for loading indicators
        await new Promise(resolve => setTimeout(resolve, 50));

        // Check for aria-busy attribute
        const loadingIndicator = page.locator('[aria-busy="true"]');
        loadingVisible = await loadingIndicator.first().isVisible().catch(() => false);

        // Also check if button is disabled
        buttonDisabled = await createAccountButton.isDisabled().catch(() => false);

        // Wait for submission to complete (redirect or error)
        const errorLocator = page.locator('.bg-red-50');
        await Promise.race([
            page.waitForURL('**/', { timeout: 10000 }),
            errorLocator.waitFor({ state: 'visible', timeout: 10000 })
        ]).catch(() => null);

        // Unroute to clean up
        await page.unroute('**/api/auth/register');

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
 * Helper to submit form and check for error message
 *
 * @param {Object} page - Playwright page object
 * @param {Object} context - Context with username, password, and expectedError
 * @returns {Promise<Object>} - Returns { success, errorMessage, errorDisplayed }
 */
async function submitFormAndCheckError(page, context = {}) {
    try {
        const { username, password } = context;

        // Navigate to registration page
        await page.goto('/auth/register');
        await page.waitForLoadState('domcontentloaded');

        // Get form elements
        const usernameField = page.getByLabel(/username/i);
        const passwordField = page.getByLabel(/password/i);
        const createAccountButton = page.getByRole('button', { name: /create account/i });

        await usernameField.waitFor({ state: 'visible', timeout: 5000 });

        // Fill form fields if provided
        if (username !== undefined && username !== null && username !== '') {
            await usernameField.fill(username);
        }

        if (password !== undefined && password !== null && password !== '') {
            await passwordField.fill(password);
        }

        // Click submit button
        await createAccountButton.click();

        // Wait for error message to appear
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
 * Helper to check if form fields retain values after validation error
 *
 * @param {Object} page - Playwright page object
 * @param {Object} context - Context with username, password
 * @returns {Promise<Object>} - Returns { success, usernameValue, passwordValue }
 */
async function checkFormRetainsValues(page, context = {}) {
    try {
        const { username, password } = context;

        // Navigate to registration page
        await page.goto('/auth/register');
        await page.waitForLoadState('domcontentloaded');

        // Get form elements
        const usernameField = page.getByLabel(/username/i);
        const passwordField = page.getByLabel(/password/i);
        const createAccountButton = page.getByRole('button', { name: /create account/i });

        await usernameField.waitFor({ state: 'visible', timeout: 5000 });

        // Fill form
        if (username !== undefined && username !== null) {
            await usernameField.fill(username);
        }

        if (password !== undefined && password !== null) {
            await passwordField.fill(password);
        }

        // Click submit button
        await createAccountButton.click();

        // Wait for error to appear
        const errorLocator = page.locator('.bg-red-50');
        await errorLocator.first().waitFor({ state: 'visible', timeout: 5000 }).catch(() => null);

        // Check field values after error
        const usernameValue = await usernameField.inputValue();
        const passwordValue = await passwordField.inputValue();

        return {
            success: true,
            usernameValue: usernameValue,
            passwordValue: passwordValue
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
 * Helper to create a user that already exists for conflict testing
 * @param {Object} page - Playwright page object
 * @param {string} username - Username to create
 * @param {string} password - Password to use
 * @returns {Promise<Object>} - Result of user creation
 */
async function createExistingUser(page, username, password = 'TestPassword123!') {
    const response = await page.request.post('/api/auth/register', {
        data: { username, password }
    });

    return {
        success: response.ok(),
        statusCode: response.status()
    };
}

module.exports = {
    performSubmitRegisterFormAction,
    checkLoadingStateDuringSubmission,
    submitFormAndCheckError,
    checkFormRetainsValues,
    generateUniqueUsername,
    createExistingUser
};
